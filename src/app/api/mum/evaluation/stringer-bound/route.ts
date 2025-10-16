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

export async function POST(req: Request) {
    try {
        console.log("🔍 INICIANDO EVALUACIÓN STRINGER BOUND");
        
        const requestData = await req.json();
        const { 
            sampleData, 
            sampleInterval, 
            confidenceLevel, 
            populationValue, 
            tolerableError,
            highValueLimit,
            highValueItems = [],
            populationExcludingHigh,
            highValueTotal,
            highValueCountResume
        } = requestData;

        console.log("📊 DATOS RECIBIDOS:", {
            sampleDataLength: sampleData?.length,
            sampleInterval,
            confidenceLevel,
            populationValue,
            highValueItemsLength: highValueItems?.length,
            highValueTotal,
            highValueCountResume
        });

        // ✅ VALIDACIONES BÁSICAS
        if (!sampleData || !Array.isArray(sampleData)) {
            throw new Error("sampleData es requerido y debe ser un array");
        }

        if (!sampleInterval || sampleInterval <= 0) {
            throw new Error("sampleInterval es requerido y debe ser mayor a 0");
        }

        // ✅ 1. CALCULAR ERRORES EN MUESTRA NORMAL
        const errors = sampleData
            .filter((item: any) => {
                const bookValue = Number(item.bookValue);
                const auditedValue = Number(item.auditedValue);
                
                if (isNaN(bookValue) || isNaN(auditedValue) || bookValue === 0) {
                    return false;
                }
                
                const error = bookValue - auditedValue;
                // ✅ SOLO considerar error si la diferencia es significativa (> 1% o > 0.01)
                return Math.abs(error) > (bookValue * 0.01) || Math.abs(error) > 0.01;
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

        console.log("🔍 ERRORES ENCONTRADOS:", {
            totalItems: sampleData.length,
            erroresReales: errors.length,
            overstatements: errors.filter((e: any) => e.isOverstatement).length,
            understatements: errors.filter((e: any) => e.isUnderstatement).length
        });

        // ✅ 2. CALCULAR ERRORES EN VALORES ALTOS
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

        // ✅ 3. ALGORITMO STRINGER BOUND CORREGIDO
        const factors = getCorrectIDEAFactors(confidenceLevel);
        const basicPrecision = Math.round(factors[0] * sampleInterval * 100) / 100;

        console.log("🔍 FACTORES Y PRECISIÓN BÁSICA:", {
            confidenceLevel,
            basicPrecisionFactor: factors[0],
            basicPrecision,
            sampleInterval
        });

        // Separar overstatements y understatements
        const overstatements = errors.filter((e: any) => e.isOverstatement);
        const understatements = errors.filter((e: any) => e.isUnderstatement);

        // Calcular Most Likely Error
        const overstatementMLE = Math.round(overstatements.reduce((sum: number, e: any) => sum + e.projectedError, 0) * 100) / 100;
        const understatementMLE = Math.round(understatements.reduce((sum: number, e: any) => sum + e.projectedError, 0) * 100) / 100;

        console.log("🔍 MOST LIKELY ERRORS:", {
            overstatementMLE,
            understatementMLE,
            overstatementsCount: overstatements.length,
            understatementsCount: understatements.length
        });

        // ✅ ALGORITMO STRINGER BOUND CORREGIDO
        const calculateStringerUEL = (errorList: any[]) => {
            if (errorList.length === 0) {
                return basicPrecision;
            }

            // Ordenar por tainting descendente
            const sortedErrors = [...errorList].sort((a: any, b: any) => b.taining - a.taining);
            let cumulativeFactor = factors[0]; // ✅ Empezar con el factor básico

            for (let i = 0; i < Math.min(sortedErrors.length, factors.length - 1); i++) {
                const error = sortedErrors[i];
                const incrementalFactor = factors[i + 1] - factors[i];
                cumulativeFactor += incrementalFactor * error.taining; // ✅ Solo factores
            }

            // ✅ Convertir a UEL al final
            return Math.round(cumulativeFactor * sampleInterval * 100) / 100;
        };

        const overstatementUEL = calculateStringerUEL(overstatements);
        const understatementUEL = calculateStringerUEL(understatements);

        console.log("🔍 UPPER ERROR LIMITS:", {
            overstatementUEL,
            understatementUEL
        });

        // ✅ 4. CALCULAR ERRORES EN VALORES ALTOS
        const highValueErrors = calculateHighValueErrors(highValueItems);

        console.log("🔍 ERRORES EN VALORES ALTOS:", highValueErrors);

        // ✅ 5. RESULTADOS COMBINADOS (Stringer Bound)
        const response = {
            numErrores: errors.length,
            errorMasProbableBruto: overstatementMLE,
            errorMasProbableNeto: overstatementMLE - understatementMLE,
            precisionTotal: basicPrecision,
            limiteErrorSuperiorBruto: overstatementUEL,
            limiteErrorSuperiorNeto: overstatementUEL - understatementMLE,
            populationExcludingHigh: populationExcludingHigh !== undefined ? populationExcludingHigh : populationValue,
            highValueTotal: highValueTotal !== undefined ? highValueTotal : 0,
            populationIncludingHigh: populationValue,
            highValueCountResume: highValueCountResume !== undefined ? highValueCountResume : 0,
            
            // ✅ DATOS DE ERRORES EN VALOR ALTO
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
        console.error("❌ ERROR DETALLADO EN STRINGER BOUND:", {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        
        return NextResponse.json({ 
            error: `Error en evaluación Stringer Bound: ${error.message}` 
        }, { status: 500 });
    }
}