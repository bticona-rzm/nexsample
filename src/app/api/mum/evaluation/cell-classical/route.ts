// app/api/mum/evaluation/cell-classical/route.ts
import { NextResponse } from 'next/server';

// ✅ FACTORES CORRECTOS SEGÚN IDEA
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

// ✅ BASIC PRECISION CORRECTA
const calculateBasicPrecision = (confidenceLevel: number, sampleInterval: number): number => {
    const factors = getCorrectIDEAFactors(confidenceLevel);
    return Math.round(factors[0] * sampleInterval * 100) / 100;
};

// ✅ FUNCIÓN PARA PRECISION GAP WIDENING
const calculatePrecisionGapWidening = (
    upperErrorLimit: number, 
    basicPrecision: number, 
    mostLikelyError: number
): number => {
    const pgw = upperErrorLimit - basicPrecision - mostLikelyError;
    return Math.round(pgw * 100) / 100;
};

export async function POST(req: Request) {
    try {
        const { 
            sampleData, 
            sampleInterval, 
            confidenceLevel, 
            populationValue, 
            populationExcludingHigh,
            highValueTotal,
            highValueCountResume,
            highValueItems = []
        } = await req.json();

        console.log("📊 PROCESANDO CELL & CLASSICAL PPS - ALGORITMO IDEA:", {
            items: sampleData.length,
            interval: sampleInterval,
            confidence: confidenceLevel
        });

        // 1. CALCULAR ERRORES
        const errors = sampleData
            .filter((item: any) => {
                const bookValue = Number(item.bookValue);
                const auditedValue = Number(item.auditedValue);
                return !isNaN(bookValue) && !isNaN(auditedValue) && bookValue !== 0;
            })
            .map((item: any) => {
                const bookValue = Number(item.bookValue);
                const auditedValue = Number(item.auditedValue);
                const error = bookValue - auditedValue;
                const tainting = Math.min(Math.abs(error) / bookValue, 1);
                
                return {
                    reference: item.reference,
                    bookValue,
                    auditedValue,
                    error,
                    tainting: Math.round(tainting * 10000) / 10000,
                    isOverstatement: error > 0,
                    isUnderstatement: error < 0,
                    projectedError: Math.round(tainting * sampleInterval * 100) / 100
                };
            });

        // 2. SEPARAR ERRORES
        const overstatements = errors
            .filter((e: any) => e.isOverstatement)
            .sort((a: any, b: any) => b.tainting - a.tainting);
            
        const understatements = errors
            .filter((e: any) => e.isUnderstatement)
            .sort((a: any, b: any) => b.tainting - a.tainting);

        // 3. ✅ OBTENER FACTORES CORRECTOS DE IDEA
        const factors = getCorrectIDEAFactors(confidenceLevel);

        // 4. ✅ ALGORITMO IDEA CORREGIDO
        const calculateUEL = (errorList: any[], errorType: string): { 
            uel: number, 
            stages: any[],
            mostLikelyError: number,
            totalTaintings: number,
            precisionGapWidening: number // ✅ AGREGAMOS PGW AL RESULTADO
        } => {
            const stages: any[] = [];
            let currentUEL = factors[0];
            let totalTaintings = 0;

            // ✅ STAGE 0 - BASIC PRECISION
            const stage0 = {
                stage: 0,
                uelFactor: Math.round(factors[0] * 10000) / 10000,
                tainting: errorType === 'understatement' ? 1.0000 : 1.0000,
                averageTainting: 0.0000,
                previousUEL: 0.0000,
                loadingPropagation: 0.0000,
                simplePropagation: Math.round(factors[0] * 10000) / 10000,
                maxStageUEL: Math.round(factors[0] * 10000) / 10000
            };
            stages.push(stage0);

            // ✅ PROCESAR ERRORES (stages 1+)
            for (let i = 0; i < errorList.length; i++) {
                const error = errorList[i];
                totalTaintings += error.tainting;
                
                const currentFactor = factors[i + 1] || factors[factors.length - 1];
                
                const loadAndSpread = Math.round((currentUEL + error.tainting) * 10000) / 10000;
                
                const taintingsUpToNow = errorList.slice(0, i + 1).map(e => e.tainting);
                const averageTainting = taintingsUpToNow.reduce((sum, t) => sum + t, 0) / taintingsUpToNow.length;
                const simpleSpread = Math.round((currentFactor * averageTainting) * 10000) / 10000;
                
                const stageUEL = Math.max(loadAndSpread, simpleSpread);
                
                const stage = {
                    stage: i + 1,
                    uelFactor: Math.round(currentFactor * 10000) / 10000,
                    tainting: error.tainting,
                    averageTainting: Math.round(averageTainting * 10000) / 10000,
                    previousUEL: Math.round(currentUEL * 10000) / 10000,
                    loadingPropagation: loadAndSpread,
                    simplePropagation: simpleSpread,
                    maxStageUEL: Math.round(stageUEL * 10000) / 10000
                };
                
                stages.push(stage);
                currentUEL = stageUEL;
            }

            const mostLikelyError = Math.round(totalTaintings * sampleInterval * 100) / 100;
            const upperErrorLimit = Math.round(currentUEL * sampleInterval * 100) / 100;
            const basicPrecisionValue = Math.round(factors[0] * sampleInterval * 100) / 100;
            
            // ✅ CALCULAR PRECISION GAP WIDENING PARA ESTE TIPO DE ERROR
            const precisionGapWidening = calculatePrecisionGapWidening(
                upperErrorLimit,
                basicPrecisionValue,
                mostLikelyError
            );
            
            return { 
                uel: Math.round(currentUEL * 10000) / 10000, 
                stages,
                mostLikelyError,
                totalTaintings: Math.round(totalTaintings * 10000) / 10000,
                precisionGapWidening // ✅ INCLUIMOS PGW EN EL RESULTADO
            };
        };

        // 5. ✅ CALCULAR RESULTADOS (AHORA CON PGW INDIVIDUAL)
        const overstatementResult = calculateUEL(overstatements, 'overstatement');
        const understatementResult = calculateUEL(understatements, 'understatement');

        // 6. ✅ CÁLCULOS NETOS
        const netOverstatementMLE = overstatementResult.mostLikelyError - understatementResult.mostLikelyError;
        const netOverstatementUEL = Math.round((overstatementResult.uel * sampleInterval - understatementResult.mostLikelyError) * 100) / 100;
        const netUnderstatementUEL = Math.round((understatementResult.uel * sampleInterval - overstatementResult.mostLikelyError) * 100) / 100;

        // 7. ✅ BASIC PRECISION VALUE PARA USAR EN LA RESPUESTA
        const basicPrecisionValue = calculateBasicPrecision(confidenceLevel, sampleInterval);

        // ✅ CALCULAR ERRORES EN ELEMENTOS DE VALOR ALTO (REALES)
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

            // Filtrar elementos de valor alto que tienen errores
            const highValueErrors = highValueItems.filter((item: any) => {
                const bookValue = Number(item.bookValue);
                const auditedValue = Number(item.auditedValue);
                return !isNaN(bookValue) && !isNaN(auditedValue) && 
                       Math.abs(bookValue - auditedValue) > 0.01; // Mismo criterio que errores normales
            });

            // Calcular estadísticas de errores
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

        // ✅ CALCULAR ERRORES DE VALOR ALTO
        const highValueErrors = calculateHighValueErrors(highValueItems);


        // 8. ✅ RESPUESTA FINAL CON AMBOS PRECISION GAP WIDENING
        const response = {
            numErrores: errors.length,
            errorMasProbableBruto: overstatementResult.mostLikelyError,
            errorMasProbableNeto: netOverstatementMLE,
            precisionTotal: calculateBasicPrecision(confidenceLevel, sampleInterval),
            limiteErrorSuperiorBruto: Math.round(overstatementResult.uel * sampleInterval * 100) / 100,
            limiteErrorSuperiorNeto: netOverstatementUEL,
            populationExcludingHigh: populationExcludingHigh !== undefined ? Math.round(populationExcludingHigh * 100) / 100 : Math.round(populationValue * 100) / 100,
            highValueTotal: highValueTotal !== undefined ? Math.round(highValueTotal * 100) / 100 : 0,
            populationIncludingHigh: Math.round(populationValue * 100) / 100,
            highValueCountResume: highValueCountResume !== undefined ? highValueCountResume : 0,
            
            // ✅ NUEVOS CAMPOS CON DATOS REALES DE ERRORES EN VALOR ALTO
            highValueErrors: {
                totalCount: highValueErrors.count,
                overstatementCount: highValueErrors.overstatementCount,
                understatementCount: highValueErrors.understatementCount,
                overstatementAmount: highValueErrors.overstatementAmount,
                understatementAmount: highValueErrors.understatementAmount,
                totalErrorAmount: highValueErrors.totalErrorAmount
            },
            
            cellClassicalData: {
                overstatements: overstatementResult.stages,
                understatements: understatementResult.stages,
                totalTaintings: overstatementResult.totalTaintings,
                stageUEL: overstatementResult.uel,
                basicPrecision: calculateBasicPrecision(confidenceLevel, sampleInterval),
                mostLikelyError: overstatementResult.mostLikelyError,
                upperErrorLimit: Math.round(overstatementResult.uel * sampleInterval * 100) / 100,
                understatementMLE: understatementResult.mostLikelyError,
                understatementUEL: Math.round(understatementResult.uel * sampleInterval * 100) / 100,
                netUnderstatementUEL: Math.round((understatementResult.uel * sampleInterval - overstatementResult.mostLikelyError) * 100) / 100,
                precisionGapWideningOver: overstatementResult.precisionGapWidening,
                precisionGapWideningUnder: understatementResult.precisionGapWidening
            }
        };

        console.log("✅ RESULTADOS - CON ERRORES DE VALOR ALTO REALES:", {
            highValueItems: highValueItems.length,
            highValueErrors: highValueErrors.count,
            highValueOverstatements: highValueErrors.overstatementCount,
            highValueUnderstatements: highValueErrors.understatementCount,
            highValueErrorAmount: highValueErrors.totalErrorAmount
        });

        return NextResponse.json(response);

    } catch (error: any) {
        console.error("❌ Error en evaluación:", error);
        return NextResponse.json({ 
            error: `Error en evaluación: ${error.message}` 
        }, { status: 500 });
    }
}