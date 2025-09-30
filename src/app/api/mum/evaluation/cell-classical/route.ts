// app/api/mum/evaluation/cell-classical/route.ts
import { NextResponse } from 'next/server';

// Interfaces
interface SampleItem {
    reference: string;
    bookValue: number;
    auditedValue: number;
}

interface EvaluationRequest {
    sampleData: SampleItem[];
    sampleInterval: number;
    confidenceLevel: number;
    populationValue: number;
    tolerableError: number;
}

// Factores UEL para diferentes niveles de confianza
const UEL_FACTORS = {
    90: [2.31, 1.90, 1.61, 1.44, 1.33, 1.25, 1.19, 1.14],
    95: [3.00, 1.75, 1.55, 1.46, 1.40, 1.36, 1.33, 1.30],
    99: [4.61, 2.89, 2.36, 2.11, 1.97, 1.87, 1.80, 1.74]
};

export async function POST(req: Request) {
    try {
        const { sampleData, sampleInterval, confidenceLevel, populationValue, tolerableError }: EvaluationRequest = await req.json();

        console.log(`Procesando ${sampleData.length} registros con intervalo ${sampleInterval}`);

        // 1. CALCULAR ERRORES REALES
        const errors = sampleData
            .filter(item => {
                const hasBookValue = !isNaN(item.bookValue) && item.bookValue !== 0;
                const hasAuditedValue = !isNaN(item.auditedValue);
                return hasBookValue && hasAuditedValue && item.bookValue !== item.auditedValue;
            })
            .map(item => {
                const error = item.bookValue - item.auditedValue;
                const absoluteBookValue = Math.abs(item.bookValue);
                const tainting = absoluteBookValue > 0 ? Math.abs(error) / absoluteBookValue : 0;
                
                return {
                    reference: item.reference,
                    bookValue: item.bookValue,
                    auditedValue: item.auditedValue,
                    error,
                    tainting,
                    isOverstatement: error > 0,
                    isUnderstatement: error < 0,
                    projectedError: error > 0 ? error * (sampleInterval / absoluteBookValue) : 0
                };
            });

        console.log(`Encontrados ${errors.length} errores`);

        // 2. SEPARAR Y ORDENAR POR TAINTING (MÁS GRANDE PRIMERO)
        const overstatements = errors
            .filter(e => e.isOverstatement)
            .sort((a, b) => b.tainting - a.tainting);
            
        const understatements = errors
            .filter(e => e.isUnderstatement) 
            .sort((a, b) => b.tainting - a.tainting);

        // 3. OBTENER FACTORES UEL CORRECTOS
        const factors = UEL_FACTORS[confidenceLevel as keyof typeof UEL_FACTORS] || UEL_FACTORS[95];

        // 4. CALCULAR ETAPAS CON DATOS REALES
        const calculateStages = (errorList: any[], factors: number[]) => {
            const stages = [];
            let cumulativeUEL = factors[0];
            
            for (let i = 0; i < Math.min(errorList.length, factors.length); i++) {
                const currentError = errorList[i];
                const previousErrors = errorList.slice(0, i + 1);
                const averageTainting = previousErrors.reduce((sum, e) => sum + e.taining, 0) / previousErrors.length;
                
                const stage = {
                    stage: i,
                    uelFactor: factors[i],
                    tainting: currentError.taining,
                    averageTainting: averageTainting,
                    previousUEL: cumulativeUEL,
                    loadingPropagation: factors[i] * (1 - averageTainting),
                    simplePropagation: factors[i],
                    maxStageUEL: cumulativeUEL + (factors[i] * (1 - averageTainting))
                };
                
                cumulativeUEL = stage.maxStageUEL;
                stages.push(stage);
            }
            return stages;
        };

        const overstatementStages = calculateStages(overstatements, factors);
        const understatementStages = calculateStages(understatements, factors);

        // 5. CÁLCULOS FINALES CON DATOS REALES
        const totalProjectedError = errors.reduce((sum, e) => sum + e.projectedError, 0);
        const totalTaintings = errors.reduce((sum, e) => sum + e.tainting, 0);
        
        const stageUEL = Math.max(
            ...overstatementStages.map(s => s.maxStageUEL),
            ...understatementStages.map(s => s.maxStageUEL),
            factors[0] // Precisión básica como mínimo
        );
        
        const basicPrecision = factors[0] * sampleInterval;
        const mostLikelyError = totalProjectedError;
        const upperErrorLimit = stageUEL * sampleInterval;

        // 6. DECISIÓN DE ACEPTACIÓN
        const isAccepted = upperErrorLimit <= tolerableError;
        const conclusion = `La población ${isAccepted ? 'PUEDE' : 'NO PUEDE'} aceptarse. ` +
                          `UEL: ${upperErrorLimit.toLocaleString()}, ` +
                          `Tolerable: ${tolerableError.toLocaleString()}`;

        const response = {
            // Resultados principales
            numErrores: errors.length,
            errorMasProbableBruto: mostLikelyError,
            errorMasProbableNeto: mostLikelyError * 0.8, // Ajuste conservador
            precisionTotal: basicPrecision,
            limiteErrorSuperiorBruto: upperErrorLimit,
            limiteErrorSuperiorNeto: upperErrorLimit * 0.8,
            isAccepted,
            conclusion,
            
            // Datos para valores altos (si aplican)
            highValueCountResume: sampleData.filter(item => Math.abs(item.bookValue) >= sampleInterval).length,
            highValueTotal: sampleData
                .filter(item => Math.abs(item.bookValue) >= sampleInterval)
                .reduce((sum, item) => sum + Math.abs(item.bookValue), 0),
            populationExcludingHigh: populationValue, // Esto debería calcularse basado en los datos
            populationIncludingHigh: populationValue,
            
            // Datos específicos para Cell & Classical PPS
            cellClassicalData: {
                overstatements: overstatementStages,
                understatements: understatementStages,
                totalTaintings,
                stageUEL,
                basicPrecision,
                mostLikelyError,
                upperErrorLimit,
                sampleInterval,
                factorsUsed: factors.slice(0, Math.max(overstatements.length, understatements.length) + 1)
            }
        };

        console.log("Evaluación completada:", response);
        return NextResponse.json(response);

    } catch (error: any) {
        console.error("Error en evaluación Cell & Classical PPS:", error);
        return NextResponse.json({ 
            error: "Error procesando la evaluación: " + error.message 
        }, { status: 500 });
    }
}   