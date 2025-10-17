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
    console.log(`🔍 ${errorType} - ERROR LIST LENGTH:`, errorList.length);
    console.log(`🔍 ${errorType} - FIRST ERROR:`, errorList[0] ? {
        hasTainting: errorList[0].hasOwnProperty('tainting'),
        tainting: errorList[0].tainting
    } : 'No errors');
    
    const realErrors = errorList.filter(e => e.taining > 0);
    
    if (realErrors.length === 0) {
        return {
            uel: factors[0],
            mostLikelyError: 0,
            totalTaintings: 0
        };
    }

    let bound = factors[0];
    
    for (let i = 0; i < Math.min(realErrors.length, factors.length - 1); i++) {
        const error = realErrors[i];
        const incrementalFactor = factors[i + 1] - factors[i];
        bound += incrementalFactor * error.taining;
    }

    const totalTaintings = realErrors.reduce((sum, e) => sum + e.taining, 0);
    const mostLikelyError = Math.round(totalTaintings * sampleInterval * 100) / 100;

    return {
        uel: Math.round(bound * 10000) / 10000,
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
        

        // ✅ 1. CALCULAR ERRORES (USAR EXACTAMENTE EL MISMO CÓDIGO QUE CELL & CLASSICAL)
        // ✅ DENTRO DEL MAPEO DE ERRORES - VERIFICAR CÁLCULOS
        const errors = sampleData
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
            
            console.log("🔍 ERROR CALCULATION:", {
                bookValue,
                auditedValue,
                error,
                tainting,
                sampleInterval,
                projectedError,
                projectedErrorRounded: Math.round(projectedError * 100) / 100
            });
            
            return {
                reference: item.reference,
                bookValue,
                auditedValue,
                error,
                tainting: Math.round(tainting * 10000) / 10000,  // ← ✅ CORREGIR: "taining" con una 't'
                isOverstatement: error > 0,
                isUnderstatement: error < 0,
                projectedError: Math.round(projectedError * 100) / 100
            };
        });

            console.log("🔍 SUMA DE projectedError:", errors.reduce((sum, e) => sum + e.projectedError, 0));

        console.log("🔍 ERRORES DETECTADOS STRINGER BOUND:", {
            totalItems: sampleData.length,
            erroresReales: errors.length,
            erroresDetalles: errors.map(e => ({
                bookValue: e.bookValue,
                auditedValue: e.auditedValue,
                error: e.error,
                tainting: e.tainting,
                projectedError: e.projectedError
            }))
        });

        // ✅ 2. SEPARAR ERRORES (IGUAL QUE CELL & CLASSICAL)
        const overstatements = errors
            .filter((e: any) => e.isOverstatement)
            .sort((a: any, b: any) => b.taining - a.taining);  // ← ✅ CORREGIR: "taining" con una 't'
            
        const understatements = errors
            .filter((e: any) => e.isUnderstatement)
            .sort((a: any, b: any) => b.taining - a.taining);  // ← ✅ CORREGIR: "taining" con una 't'

        console.log("🔍 SEPARACIÓN DE ERRORES:", {
            overstatements: overstatements.length,
            understatements: understatements.length,
            overstatementsDetails: overstatements.map(o => ({
                tainting: o.tainting,  // ← ✅ CORREGIR: "taining" con una 't'
                projectedError: o.projectedError
            }))
        });

        // ✅ DEBUG PROFUNDO - VERIFICAR LA ESTRUCTURA COMPLETA
        console.log("🔍 ESTRUCTURA COMPLETA DE OVERSTATEMENTS:", JSON.stringify(overstatements, null, 2));

        // ✅ 3. OBTENER FACTORES (IGUAL QUE CELL & CLASSICAL)
        const factors = getCorrectIDEAFactors(confidenceLevel);

        console.log("🔍 INMEDIATELY BEFORE calculateStringerBound:", {
            overstatementsLength: overstatements.length,
            firstOverstatement: overstatements[0] ? {
                tainting: overstatements[0].tainting,
                keys: Object.keys(overstatements[0])
            } : 'No overstatements'
        });

        const overstatementResult = calculateStringerBound(overstatements, 'overstatement', factors, sampleInterval);


        const understatementResult = calculateStringerBound(
            understatements, 
            'understatement', 
            factors, 
            sampleInterval
        );

        console.log("🔍 RESULTADOS STRINGER BOUND CALCULADOS:", {
            overstatementUEL: overstatementResult.uel,
            overstatementMLE: overstatementResult.mostLikelyError,
            understatementUEL: understatementResult.uel,
            understatementMLE: understatementResult.mostLikelyError,
            basicPrecision: factors[0]
        });

        // ✅ 6. CÁLCULOS NETOS (IGUAL QUE CELL & CLASSICAL)
        const netOverstatementMLE = overstatementResult.mostLikelyError - understatementResult.mostLikelyError;
        const netOverstatementUEL = Math.round((overstatementResult.uel * sampleInterval - understatementResult.mostLikelyError) * 100) / 100;

        // ✅ 7. BASIC PRECISION VALUE
        const basicPrecisionValue = calculateBasicPrecision(confidenceLevel, sampleInterval);

        // ✅ 8. CALCULAR PRECISIÓN TOTAL
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
                Math.round(overstatementResult.uel * sampleInterval * 100) / 100,
                overstatementResult.mostLikelyError
            ),

            limiteErrorSuperiorBruto: Math.round(overstatementResult.uel * sampleInterval * 100) / 100,
            limiteErrorSuperiorNeto: netOverstatementUEL,
            
            // ✅ NUEVOS CAMPOS PARA FRONTEND
            overstatementErrors: overstatements.length,
            understatementErrors: understatements.length,
            overstatementMLE: overstatementResult.mostLikelyError,
            understatementMLE: understatementResult.mostLikelyError,
            overstatementUEL: Math.round(overstatementResult.uel * sampleInterval * 100) / 100,
            understatementUEL: Math.round(understatementResult.uel * sampleInterval * 100) / 100,
            
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

        console.log("✅ RESULTADO FINAL STRINGER BOUND:", response);

        return NextResponse.json(response);

    } catch (error: any) {
        console.error("❌ ERROR DETALLADO EN STRINGER BOUND:", error);
        return NextResponse.json({ 
            error: `Error en evaluación Stringer Bound: ${error.message}` 
        }, { status: 500 });
    }
}