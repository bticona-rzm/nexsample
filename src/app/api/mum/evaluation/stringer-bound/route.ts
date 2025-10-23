import { NextResponse } from 'next/server';
import { 
    getCellClassicalFactors,
    ProcessedError 
} from '@/utils/tables';

// ✅ INTERFACES ESPECÍFICAS DEL COMPONENTE
interface HighValueErrors {
    count: number;
    overstatementCount: number;
    understatementCount: number;
    overstatementAmount: number;
    understatementAmount: number;
    totalErrorAmount: number;
}

interface StringerBoundResult {
    uel: number;
    mostLikelyError: number;
    totalTaintings: number;
}

// ✅ FUNCIONES DE LÓGICA DE NEGOCIO (en el route)
const detectErrors = (sampleData: any[], sampleInterval: number): ProcessedError[] => {
    return sampleData
        .filter((item: any) => {
            const bookValue = Number(item.bookValue);
            const auditedValue = Number(item.auditedValue);
            
            if (isNaN(bookValue) || isNaN(auditedValue) || bookValue === 0) {
                return false;
            }
            
            const error = bookValue - auditedValue;
            return Math.abs(error) > (bookValue * 0.01) || Math.abs(error) > 0.01;
        })
        .map((item: any) => {
            const bookValue = Number(item.bookValue);
            const auditedValue = Number(item.auditedValue);
            const error = bookValue - auditedValue;
            const tainting = Math.min(Math.abs(error) / bookValue, 1);
            const projectedError = tainting * sampleInterval;
            
            return {
                reference: item.reference,
                bookValue,
                auditedValue,
                error,
                tainting: Math.round(tainting * 10000) / 10000,
                isOverstatement: error > 0,
                isUnderstatement: error < 0,
                projectedError: Math.round(projectedError * 100) / 100
            };
        });
};

const calculateHighValueErrors = (highValueItems: any[]): HighValueErrors => {
    if (!highValueItems || highValueItems.length === 0) {
        return {
            count: 0,
            overstatementCount: 0,
            understatementCount: 0,
            overstatementAmount: 0,
            understatementAmount: 0,
            totalErrorAmount: 0
        };
    }

    const highValueErrors = highValueItems.filter((item: any) => {
        const bookValue = Number(item.bookValue);
        const auditedValue = Number(item.auditedValue);
        return !isNaN(bookValue) && !isNaN(auditedValue) && 
               Math.abs(bookValue - auditedValue) > 0.01;
    });

    const overstatementErrors = highValueErrors.filter((item: any) => 
        Number(item.bookValue) > Number(item.auditedValue)
    );
    const understatementErrors = highValueErrors.filter((item: any) => 
        Number(item.bookValue) < Number(item.auditedValue)
    );

    const overstatementAmount = overstatementErrors.reduce((sum: number, item: any) => 
        sum + (Number(item.bookValue) - Number(item.auditedValue)), 0
    );
    const understatementAmount = understatementErrors.reduce((sum: number, item: any) => 
        sum + (Number(item.auditedValue) - Number(item.bookValue)), 0
    );

    return {
        count: highValueErrors.length,
        overstatementCount: overstatementErrors.length,
        understatementCount: understatementErrors.length,
        overstatementAmount: Math.round(overstatementAmount * 100) / 100,
        understatementAmount: Math.round(understatementAmount * 100) / 100,
        totalErrorAmount: Math.round((overstatementAmount + understatementAmount) * 100) / 100
    };
};

const calculateBasicPrecision = (confidenceLevel: number, sampleInterval: number): number => {
    const factors = getCellClassicalFactors(confidenceLevel);
    return Math.round(factors[0] * sampleInterval * 100) / 100;
};

const calculatePrecisionTotal = (upperErrorLimit: number, mostLikelyError: number): number => {
    return Math.round((upperErrorLimit - mostLikelyError) * 100) / 100;
};

// ✅ ALGORITMO STRINGER BOUND (usando factores centralizados)
const calculateStringerBound = (
    errorList: ProcessedError[], 
    factors: number[], 
    sampleInterval: number
): StringerBoundResult => {
    
    // ✅ FILTRAR SOLO ERRORES CON TAINTING > 0
    const realErrors = errorList.filter(e => e.tainting > 0);
    
    if (realErrors.length === 0) {
        // ✅ SI NO HAY ERRORES, DEVOLVER BASIC PRECISION
        return {
            uel: factors[0] * sampleInterval,
            mostLikelyError: 0,
            totalTaintings: 0
        };
    }

    // ✅ ALGORITMO STRINGER BOUND CORRECTO
    let bound = factors[0]; // Comenzar con el factor básico
    
    // ✅ ORDENAR ERRORES POR TAINTING DESCENDENTE
    const sortedErrors = [...realErrors].sort((a, b) => b.tainting - a.tainting);
    
    // ✅ APLICAR FACTORES INCREMENTALES (Stringer Bound clásico)
    for (let i = 0; i < Math.min(sortedErrors.length, factors.length - 1); i++) {
        const error = sortedErrors[i];
        const incrementalFactor = factors[i + 1] - factors[i];
        bound += incrementalFactor * error.tainting;
    }

    // ✅ CALCULAR TOTAL TAINTINGS Y MOST LIKELY ERROR
    const totalTaintings = sortedErrors.reduce((sum, e) => sum + e.tainting, 0);
    const mostLikelyError = Math.round(totalTaintings * sampleInterval * 100) / 100;
    
    // ✅ CONVERTIR BOUND A MONETARY (multiplicar por sampleInterval)
    const monetaryBound = Math.round(bound * sampleInterval * 100) / 100;

    return {
        uel: monetaryBound,
        mostLikelyError,
        totalTaintings: Math.round(totalTaintings * 10000) / 10000
    };
};

export async function POST(req: Request) {
    try {
        const requestData = await req.json();

        const { 
            sampleData, 
            sampleInterval, 
            confidenceLevel, 
            populationValue,
            highValueItems = [],
            populationExcludingHigh,
            highValueTotal,
            highValueCountResume
        } = requestData;

        // ✅ VALIDACIONES
        if (!sampleData || !Array.isArray(sampleData)) {
            throw new Error("sampleData es requerido y debe ser un array");
        }

        if (!sampleInterval || sampleInterval <= 0) {
            throw new Error(`sampleInterval inválido: ${sampleInterval}`);
        }

        // ✅ DETECTAR ERRORES (usando función local)
        const errors = detectErrors(sampleData, sampleInterval);

        // ✅ SEPARAR ERRORES
        const overstatements = errors
            .filter((e: ProcessedError) => e.isOverstatement)
            .sort((a: ProcessedError, b: ProcessedError) => b.tainting - a.tainting);
            
        const understatements = errors
            .filter((e: ProcessedError) => e.isUnderstatement)
            .sort((a: ProcessedError, b: ProcessedError) => b.tainting - a.tainting);

        // ✅ OBTENER FACTORES DESDE TABLAS CENTRALIZADAS
        const factors = getCellClassicalFactors(confidenceLevel);

        // ✅ CALCULAR STRINGER BOUND
        const overstatementResult = calculateStringerBound(overstatements, factors, sampleInterval);
        const understatementResult = calculateStringerBound(understatements, factors, sampleInterval);

        // ✅ CÁLCULOS NETOS
        const netOverstatementMLE = overstatementResult.mostLikelyError - understatementResult.mostLikelyError;
        const netOverstatementUEL = Math.round((overstatementResult.uel - understatementResult.mostLikelyError) * 100) / 100;

        // ✅ CALCULAR ERRORES DE VALOR ALTO
        const highValueErrors = calculateHighValueErrors(highValueItems);

        // ✅ RESPUESTA FINAL
        const response = {
            numErrores: overstatements.length + understatements.length,
            errorMasProbableBruto: overstatementResult.mostLikelyError,
            errorMasProbableNeto: netOverstatementMLE,
            
            precisionTotal: calculatePrecisionTotal(
                overstatementResult.uel,
                overstatementResult.mostLikelyError
            ),

            limiteErrorSuperiorBruto: overstatementResult.uel,
            limiteErrorSuperiorNeto: netOverstatementUEL,
            
            // ✅ CAMPOS ADICIONALES PARA FRONTEND
            overstatementErrors: overstatements.length,
            understatementErrors: understatements.length,
            overstatementMLE: overstatementResult.mostLikelyError,
            understatementMLE: understatementResult.mostLikelyError,
            
            populationExcludingHigh: populationExcludingHigh !== undefined ? 
                Math.round(populationExcludingHigh * 100) / 100 : 
                Math.round(populationValue * 100) / 100,
            highValueTotal: highValueTotal !== undefined ? 
                Math.round(highValueTotal * 100) / 100 : 0,
            populationIncludingHigh: Math.round(populationValue * 100) / 100,
            highValueCountResume: highValueCountResume !== undefined ? 
                highValueCountResume : 0,
            
            highValueErrors: {
                totalCount: highValueErrors.count,
                overstatementCount: highValueErrors.overstatementCount,
                understatementCount: highValueErrors.understatementCount,
                overstatementAmount: highValueErrors.overstatementAmount,
                understatementAmount: highValueErrors.understatementAmount,
                totalErrorAmount: highValueErrors.totalErrorAmount
            },

            // ✅ DATOS ESPECÍFICOS DE STRINGER BOUND
            stringerBoundData: {
                basicPrecision: calculateBasicPrecision(confidenceLevel, sampleInterval),
                overstatementUEL: overstatementResult.uel,
                understatementUEL: understatementResult.uel,
                overstatementMLE: overstatementResult.mostLikelyError,
                understatementMLE: understatementResult.mostLikelyError,
                totalTaintingsOver: overstatementResult.totalTaintings,
                totalTaintingsUnder: understatementResult.totalTaintings
            }
        };

        return NextResponse.json(response);

    } catch (error: any) {
        console.error("❌ ERROR DETALLADO EN STRINGER BOUND:", error);
        return NextResponse.json({ 
            error: `Error en evaluación Stringer Bound: ${error.message}` 
        }, { status: 500 });
    }
}