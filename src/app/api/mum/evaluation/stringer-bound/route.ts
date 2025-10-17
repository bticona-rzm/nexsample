// app/api/mum/evaluation/stringer-bound/route.ts
import { NextResponse } from 'next/server';

// ✅ FACTORES CORRECTOS SEGÚN IDEA (igual que Cell & Classical)
const getCorrectIDEAFactors = (confidenceLevel: number): number[] => {
    const factorsMap: { [key: number]: number[] } = {
        80: [1.61, 3.00, 4.28, 5.52, 6.73, 7.91, 9.08, 10.24, 11.38, 12.52],
        85: [1.90, 3.38, 4.72, 5.99, 7.22, 8.43, 9.62, 10.80, 11.97, 13.13],
        90: [2.2504, 3.7790, 5.3332, 6.8774, 8.4164, 9.9151, 11.4279, 12.9302, 14.4330, 15.9344],
        95: [3.00, 4.75, 6.30, 7.76, 9.16, 10.52, 11.85, 13.15, 14.44, 15.71],
        99: [4.61, 6.64, 8.41, 10.05, 11.61, 13.11, 14.57, 16.00, 17.40, 18.78]
    };
    
    return factorsMap[confidenceLevel] || factorsMap[90];
};

// ✅ BASIC PRECISION CORRECTA (igual que Cell & Classical)
const calculateBasicPrecision = (confidenceLevel: number, sampleInterval: number): number => {
    const factors = getCorrectIDEAFactors(confidenceLevel);
    return Math.round(factors[0] * sampleInterval * 100) / 100;
};

const calculateStringerBound = (
    errorList: any[], 
    errorType: string, 
    factors: number[], 
    sampleInterval: number
): { 
    uel: number, 
    mostLikelyError: number,
    totalTaintings: number
} => {
    
    // ✅ FILTRAR SOLO ERRORES CON TAINTING > 0 (igual que Cell & Classical)
    const realErrors = errorList.filter(e => e.tainting > 0);
    
    if (realErrors.length === 0) {
        // ✅ SI NO HAY ERRORES, DEVOLVER BASIC PRECISION
        return {
            uel: factors[0] * sampleInterval, // ← ✅ MULTIPLICAR POR SAMPLE INTERVAL
            mostLikelyError: 0,
            totalTaintings: 0
        };
    }

    // ✅ ALGORITMO STRINGER BOUND CORRECTO
    let bound = factors[0]; // Comenzar con el factor básico
    
    // ✅ ORDENAR ERRORES POR TAINTING DESCENDENTE (igual que IDEA)
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
        uel: monetaryBound, // ← ✅ YA EN TÉRMINOS MONETARIOS
        mostLikelyError,
        totalTaintings: Math.round(totalTaintings * 10000) / 10000
    };
};

// EN app/api/mum/evaluation/stringer-bound/route.ts - CORREGIR DETECCIÓN DE ERRORES
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
        

        // ✅ EN EL POST DE STRINGER BOUND - VERIFICAR CÁLCULO DE ERRORES
        const errors = sampleData
            .filter((item: any) => {
                const bookValue = Number(item.bookValue);
                const auditedValue = Number(item.auditedValue);
                
                if (isNaN(bookValue) || isNaN(auditedValue) || bookValue === 0) {
                    return false;
                }
                
                const error = bookValue - auditedValue;
                // ✅ USAR EL MISMO CRITERIO QUE CELL & CLASSICAL
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

        // ✅ 2. SEPARAR ERRORES (IGUAL QUE CELL & CLASSICAL)
        const overstatements = errors
            .filter((e: any) => e.isOverstatement)
            .sort((a: any, b: any) => b.taining - a.taining);  // ← ✅ CORREGIR: "taining" con una 't'
            
        const understatements = errors
            .filter((e: any) => e.isUnderstatement)
            .sort((a: any, b: any) => b.taining - a.taining);  // ← ✅ CORREGIR: "taining" con una 't'


        // ✅ 3. OBTENER FACTORES (IGUAL QUE CELL & CLASSICAL)
        const factors = getCorrectIDEAFactors(confidenceLevel);

        const overstatementResult = calculateStringerBound(overstatements, 'overstatement', factors, sampleInterval);


        const understatementResult = calculateStringerBound(
            understatements, 
            'understatement', 
            factors, 
            sampleInterval
        );

        // ✅ EN EL POST DE STRINGER BOUND - CORREGIR CÁLCULOS NETOS
        const netOverstatementMLE = overstatementResult.mostLikelyError - understatementResult.mostLikelyError;
        const netOverstatementUEL = Math.round((overstatementResult.uel - understatementResult.mostLikelyError) * 100) / 100;

        // ✅ CALCULAR PRECISIÓN TOTAL CORRECTAMENTE
        const calculatePrecisionTotal = (upperErrorLimit: number, mostLikelyError: number): number => {
            return Math.round((upperErrorLimit - mostLikelyError) * 100) / 100;
        };


        // ✅ 9. CALCULAR ERRORES DE VALOR ALTO
        const calculateHighValueErrors = (highValueItems: any[]) => {
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

        const highValueErrors = calculateHighValueErrors(highValueItems);

        // ✅ 10. RESPUESTA FINAL CON DATOS SEPARADOS
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
            
            // ✅ NUEVOS CAMPOS PARA FRONTEND
            overstatementErrors: overstatements.length,
            understatementErrors: understatements.length,
            overstatementMLE: overstatementResult.mostLikelyError,
            understatementMLE: understatementResult.mostLikelyError,
            
            populationExcludingHigh: populationExcludingHigh !== undefined ? Math.round(populationExcludingHigh * 100) / 100 : Math.round(populationValue * 100) / 100,
            highValueTotal: highValueTotal !== undefined ? Math.round(highValueTotal * 100) / 100 : 0,
            populationIncludingHigh: Math.round(populationValue * 100) / 100,
            highValueCountResume: highValueCountResume !== undefined ? highValueCountResume : 0,
            
            highValueErrors: {
                totalCount: highValueErrors.count,
                overstatementCount: highValueErrors.overstatementCount,
                understatementCount: highValueErrors.understatementCount,
                overstatementAmount: highValueErrors.overstatementAmount,
                understatementAmount: highValueErrors.understatementAmount,
                totalErrorAmount: highValueErrors.totalErrorAmount
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