// app/api/mum/evaluation/cell-classical/route.ts
import { NextResponse } from 'next/server';

// Interfaces para tipado fuerte
interface SampleItem {
    reference: string;
    bookValue: number;
    auditedValue: number;
}

interface CalculatedError {
    reference: string;
    bookValue: number;
    auditedValue: number;
    error: number;
    tainting: number;
    isOverstatement: boolean;
    isUnderstatement: boolean;
    projectedError: number;
}

interface StageData {
    stage: number;
    uelFactor: number;
    tainting: number;
    averageTainting: number;
    previousUEL: number;
    loadingPropagation: number;
    simplePropagation: number;
    maxStageUEL: number;
}

interface CellClassicalResponse {
    numErrores: number;
    errorMasProbableBruto: number;
    errorMasProbableNeto: number;
    precisionTotal: number;
    limiteErrorSuperiorBruto: number;
    limiteErrorSuperiorNeto: number;
    populationExcludingHigh: number;
    highValueTotal: number;
    populationIncludingHigh: number;
    highValueCountResume: number;
    cellClassicalData: {
        overstatements: StageData[];
        understatements: StageData[];
        totalTaintings: number;
        stageUEL: number;
        basicPrecision: number;
        mostLikelyError: number;
        upperErrorLimit: number;
    };
}

export async function POST(req: Request) {
    try {
        const { 
            sampleData, 
            sampleInterval, 
            confidenceLevel, 
            populationValue, 
            tolerableError,
            populationExcludingHigh,  // ✅ RECIBIR estos valores reales
            highValueTotal,           // ✅ en lugar de calcularlos
            highValueCountResume      // ✅ con porcentajes fijos
        } = await req.json();

        console.log("📊 PROCESANDO CELL & CLASSICAL PPS:", {
            items: sampleData.length,
            interval: sampleInterval,
            confidence: confidenceLevel,
            poblacion: populationValue,
            populationExcludingHigh,
            highValueTotal
        });

        // 1. CALCULAR ERRORES REALES - VERSIÓN MEJORADA
        const errors: CalculatedError[] = sampleData
            .filter((item: SampleItem) => {
                const bookValue = Number(item.bookValue);
                const auditedValue = Number(item.auditedValue);
                
                if (isNaN(bookValue) || isNaN(auditedValue) || bookValue === 0) {
                    return false;
                }
                
                // Tolerancia para errores pequeños
                const hasError = Math.abs(bookValue - auditedValue) > 0.01;
                return hasError;
            })
            .map((item: SampleItem) => {
                const bookValue = Number(item.bookValue);
                const auditedValue = Number(item.auditedValue);
                const error = bookValue - auditedValue;
                const tainting = Math.abs(error) / Math.abs(bookValue);
                
                return {
                    reference: item.reference,
                    bookValue: bookValue,
                    auditedValue: auditedValue,
                    error,
                    tainting,
                    isOverstatement: error > 0,
                    isUnderstatement: error < 0,
                    projectedError: tainting * sampleInterval
                };
            });

        console.log("🔍 ERRORES ENCONTRADOS:", errors.length);

        // 2. FACTORES UEL SEGÚN NIVEL DE CONFIANZA
        const getUELFactors = (confidence: number): number[] => {
            switch (confidence) {
                case 80: return [1.61, 1.41, 1.28, 1.19, 1.13, 1.08, 1.04, 1.00];
                case 90: return [2.31, 1.90, 1.61, 1.44, 1.33, 1.25, 1.19, 1.14];
                case 95: return [3.00, 1.75, 1.55, 1.46, 1.40, 1.36, 1.33, 1.30];
                case 99: return [4.61, 2.89, 2.36, 2.11, 1.97, 1.87, 1.80, 1.74];
                default: return [3.00, 1.75, 1.55, 1.46, 1.40, 1.36, 1.33, 1.30];
            }
        };

        const factors = getUELFactors(confidenceLevel);

        // 3. ✅ SEPARAR CÁLCULOS PARA SOBREESTIMACIONES Y SUBESTIMACIONES
        const overstatements = errors.filter((e: CalculatedError) => e.isOverstatement);
        const understatements = errors.filter((e: CalculatedError) => e.isUnderstatement);

        // Calcular errores proyectados por separado
        const overstatementProjectedError = overstatements.reduce((sum: number, e: CalculatedError) => sum + e.projectedError, 0);
        const understatementProjectedError = understatements.reduce((sum: number, e: CalculatedError) => sum + e.projectedError, 0);

        // Calcular UEL por separado
        const calculateUEL = (errorList: CalculatedError[]): number => {
            if (errorList.length === 0) return factors[0];
            
            const sortedErrors = errorList.sort((a: CalculatedError, b: CalculatedError) => b.tainting - a.tainting);
            let cumulativeUEL = factors[0];
            
            for (let i = 0; i < Math.min(sortedErrors.length, factors.length); i++) {
                if (i > 0) {
                    const incrementalFactor = factors[i] - factors[i-1];
                    const incrementalUEL = incrementalFactor * sortedErrors[i].tainting;
                    cumulativeUEL += incrementalUEL;
                }
            }
            
            return cumulativeUEL;
        };

        const overstatementUEL = calculateUEL(overstatements);
        const understatementUEL = calculateUEL(understatements);

        const basicPrecision = factors[0] * sampleInterval;

        // 4. ✅ CALCULAR ETAPAS MEJORADO
        const calculateStages = (errorList: CalculatedError[]): StageData[] => {
            const stages: StageData[] = [];
            let cumulativeUEL = factors[0];
            const sortedErrors = errorList.sort((a: CalculatedError, b: CalculatedError) => b.tainting - a.tainting);
            
            for (let i = 0; i < Math.min(sortedErrors.length, factors.length); i++) {
                const currentError = sortedErrors[i];
                const incrementalFactor = i === 0 ? factors[0] : factors[i] - factors[i-1];
                
                const stage: StageData = {
                    stage: i + 1,
                    uelFactor: factors[i],
                    tainting: currentError.tainting,
                    averageTainting: sortedErrors.slice(0, i + 1).reduce((sum: number, e: CalculatedError) => sum + e.tainting, 0) / (i + 1),
                    previousUEL: cumulativeUEL,
                    loadingPropagation: cumulativeUEL + currentError.tainting,
                    simplePropagation: factors[i] * currentError.tainting,
                    maxStageUEL: Math.max(cumulativeUEL + currentError.tainting, factors[i] * currentError.tainting)
                };
                
                cumulativeUEL = stage.maxStageUEL;
                stages.push(stage);
            }
            return stages;
        };

        const overstatementStages = calculateStages(overstatements);
        const understatementStages = calculateStages(understatements);

        // 5. ✅ RESULTADOS FINALES CORREGIDOS - VERSIÓN REAL
        const response: CellClassicalResponse = {
            numErrores: errors.length,
            
            // ✅ VALORES DIFERENTES PARA CADA COLUMNA
            errorMasProbableBruto: overstatementProjectedError,
            errorMasProbableNeto: understatementProjectedError,
            
            precisionTotal: basicPrecision,
            
            // ✅ LÍMITES DIFERENTES
            limiteErrorSuperiorBruto: overstatementUEL * sampleInterval,
            limiteErrorSuperiorNeto: understatementUEL * sampleInterval,
            
            // ✅✅✅ CORRECCIÓN PRINCIPAL - NO USAR PORCENTAJES FIJOS
            populationExcludingHigh: populationExcludingHigh !== undefined ? populationExcludingHigh : populationValue,
            highValueTotal: highValueTotal !== undefined ? highValueTotal : 0,
            populationIncludingHigh: populationValue,
            highValueCountResume: highValueCountResume !== undefined ? highValueCountResume : 0,
            
            // Datos para tablas detalladas
            cellClassicalData: {
                overstatements: overstatementStages,
                understatements: understatementStages,
                totalTaintings: errors.reduce((sum: number, e: CalculatedError) => sum + e.tainting, 0),
                stageUEL: Math.max(overstatementUEL, understatementUEL),
                basicPrecision,
                mostLikelyError: overstatementProjectedError + understatementProjectedError,
                upperErrorLimit: Math.max(overstatementUEL, understatementUEL) * sampleInterval
            }
        };

        console.log("📈 RESULTADOS CALCULADOS CELL & CLASSICAL:", {
            errores: response.numErrores,
            sobrestimaciones: overstatements.length,
            subestimaciones: understatements.length,
            errorBruto: response.errorMasProbableBruto,
            errorNeto: response.errorMasProbableNeto,
            limiteBruto: response.limiteErrorSuperiorBruto,
            limiteNeto: response.limiteErrorSuperiorNeto
        });

        return NextResponse.json(response);

    } catch (error: any) {
        console.error("❌ Error en evaluación Cell & Classical PPS:", error);
        return NextResponse.json({ 
            error: `Error en evaluación: ${error.message}` 
        }, { status: 500 });
    }
}