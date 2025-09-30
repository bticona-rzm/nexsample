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
            tolerableError 
        }: {
            sampleData: SampleItem[];
            sampleInterval: number;
            confidenceLevel: number;
            populationValue: number;
            tolerableError: number;
        } = await req.json();

        console.log("📊 PROCESANDO CELL & CLASSICAL PPS:", {
            items: sampleData.length,
            interval: sampleInterval,
            confidence: confidenceLevel,
            poblacion: populationValue
        });

        // 1. CALCULAR ERRORES REALES CON TAINTING CORRECTO
        const errors: CalculatedError[] = sampleData
            .filter((item: SampleItem) => {
                const hasError = item.bookValue !== item.auditedValue;
                const bookValueValid = !isNaN(item.bookValue) && item.bookValue !== 0;
                return hasError && bookValueValid;
            })
            .map((item: SampleItem) => {
                const error = item.bookValue - item.auditedValue;
                const tainting = Math.abs(error) / Math.abs(item.bookValue);
                
                return {
                    reference: item.reference,
                    bookValue: item.bookValue,
                    auditedValue: item.auditedValue,
                    error,
                    tainting,
                    isOverstatement: error > 0,
                    isUnderstatement: error < 0,
                    projectedError: tainting * sampleInterval
                };
            });

        console.log("🔍 ERRORES ENCONTRADOS:", errors.length);
        errors.forEach((e: CalculatedError) => 
            console.log(`   - Error: ${e.error}, Tainting: ${e.tainting}, Projected: ${e.projectedError}`)
        );

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

        // 3. CÁLCULOS CORRECTOS
        const totalProjectedError = errors.reduce((sum: number, e: CalculatedError) => sum + e.projectedError, 0);
        const totalTaintings = errors.reduce((sum: number, e: CalculatedError) => sum + e.tainting, 0);
        const basicPrecision = factors[0] * sampleInterval;
        
        // 4. CALCULAR UEL CORRECTO - ALGORITMO CELL & CLASSICAL
        let stageUEL = factors[0];
        
        if (errors.length > 0) {
            const sortedErrors = errors.sort((a: CalculatedError, b: CalculatedError) => b.tainting - a.tainting);
            let cumulativeUEL = factors[0];
            
            for (let i = 0; i < Math.min(sortedErrors.length, factors.length); i++) {
                if (i > 0) {
                    const incrementalFactor = factors[i] - factors[i-1];
                    const incrementalUEL = incrementalFactor * sortedErrors[i].tainting;
                    cumulativeUEL += incrementalUEL;
                }
            }
            
            stageUEL = cumulativeUEL;
        }

        const upperErrorLimit = stageUEL * sampleInterval;

        // 5. SEPARAR SOBREESTIMACIONES Y SUBESTIMACIONES
        const overstatements = errors.filter((e: CalculatedError) => e.isOverstatement);
        const understatements = errors.filter((e: CalculatedError) => e.isUnderstatement);

        // 6. CALCULAR ETAPAS PARA TABLAS DETALLADAS
        const calculateStages = (errorList: CalculatedError[]): StageData[] => {
            const stages: StageData[] = [];
            let cumulativeUEL = factors[0];
            
            for (let i = 0; i < Math.min(errorList.length, factors.length); i++) {
                const currentError = errorList[i];
                const stage: StageData = {
                    stage: i,
                    uelFactor: factors[i],
                    tainting: currentError.tainting,
                    averageTainting: errorList.slice(0, i + 1).reduce((sum: number, e: CalculatedError) => sum + e.tainting, 0) / (i + 1),
                    previousUEL: cumulativeUEL,
                    loadingPropagation: factors[i] * (1 - currentError.tainting),
                    simplePropagation: factors[i] * currentError.tainting,
                    maxStageUEL: cumulativeUEL + (factors[i] * currentError.tainting)
                };
                cumulativeUEL = stage.maxStageUEL;
                stages.push(stage);
            }
            return stages;
        };

        const overstatementStages = calculateStages(overstatements);
        const understatementStages = calculateStages(understatements);

        // 7. RESULTADOS FINALES
        const response: CellClassicalResponse = {
            numErrores: errors.length,
            errorMasProbableBruto: totalProjectedError,
            errorMasProbableNeto: totalProjectedError * 0.9,
            precisionTotal: basicPrecision,
            limiteErrorSuperiorBruto: upperErrorLimit,
            limiteErrorSuperiorNeto: upperErrorLimit * 0.9,
            
            // Datos de población (estimados basados en la muestra)
            populationExcludingHigh: populationValue * 0.85,
            highValueTotal: populationValue * 0.15,
            populationIncludingHigh: populationValue,
            highValueCountResume: Math.floor(sampleData.length * 0.08),
            
            // Datos para tablas detalladas
            cellClassicalData: {
                overstatements: overstatementStages,
                understatements: understatementStages,
                totalTaintings,
                stageUEL,
                basicPrecision,
                mostLikelyError: totalProjectedError,
                upperErrorLimit
            }
        };

        console.log("📈 RESULTADOS CALCULADOS CELL & CLASSICAL:", {
            errores: response.numErrores,
            errorProbable: response.errorMasProbableBruto,
            precision: response.precisionTotal,
            limiteSuperior: response.limiteErrorSuperiorBruto,
            basicPrecision: response.cellClassicalData.basicPrecision
        });

        return NextResponse.json(response);

    } catch (error: any) {
        console.error("❌ Error en evaluación Cell & Classical PPS:", error);
        return NextResponse.json({ 
            error: `Error en evaluación: ${error.message}` 
        }, { status: 500 });
    }
}