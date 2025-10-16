// app/api/mum/summary/route.ts
import { NextResponse } from 'next/server';

// Interfaces (mantener igual)
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
    cellClassicalData: {
        overstatements: StageData[];
        understatements: StageData[];
        totalTaintings: number;
        stageUEL: number;
        basicPrecision: number;
        mostLikelyError: number;
        upperErrorLimit: number;
        understatementMLE?: number;
        understatementUEL?: number;
        understatementPrecision?: number;
        netUnderstatementUEL?: number;
    };
}

// ✅ FACTORES EXACTOS DE IDEA para 90% confianza
const getUELFactors = (confidenceLevel: number): number[] => {
    const factors: { [key: number]: number[] } = {
        80: [1.61, 1.27, 1.16, 1.10, 1.06, 1.03, 1.01, 0.99],
        85: [1.90, 1.45, 1.31, 1.24, 1.19, 1.16, 1.13, 1.11],
        // ✅ FACTORES EXACTOS DE IDEA para 90%
        90: [2.2504, 3.7790, 5.3332, 6.8774, 8.4132, 9.9436, 11.4704, 12.9946],
        95: [3.00, 1.75, 1.55, 1.46, 1.40, 1.36, 1.33, 1.30],
        99: [4.61, 2.08, 1.78, 1.66, 1.58, 1.52, 1.48, 1.44]
    };
    return factors[confidenceLevel] || factors[90];
};

export async function POST(req: Request) {
    try {
        const {
            sampleData,
            sampleInterval,
            confidenceLevel = 90,
            populationValue
        }: {
            sampleData: SampleItem[];
            sampleInterval: number;
            confidenceLevel: number;
            populationValue: number;
        } = await req.json();


        // 1. CALCULAR ERRORES Y TAINTINGS
        const errors: CalculatedError[] = sampleData
            .filter((item: SampleItem) => Math.abs(item.bookValue - item.auditedValue) > 0.01)
            .map((item: SampleItem) => {
                const error = item.bookValue - item.auditedValue;
                const tainting = item.bookValue > 0 ? Math.abs(error) / item.bookValue : 0;
                return {
                    reference: item.reference,
                    bookValue: item.bookValue,
                    auditedValue: item.auditedValue,
                    error,
                    tainting: Math.min(tainting, 1),
                    isOverstatement: error > 0,
                    isUnderstatement: error < 0
                };
            });

        // 2. SEPARAR SOBREESTIMACIONES Y SUBESTIMACIONES
        const overstatements = errors.filter((e: CalculatedError) => e.isOverstatement)
            .sort((a, b) => b.tainting - a.tainting);
        const understatements = errors.filter((e: CalculatedError) => e.isUnderstatement)
            .sort((a, b) => b.tainting - a.tainting);

        const uelFactors = getUELFactors(confidenceLevel);

        // ✅ FUNCIÓN CORREGIDA para calcular stages
        const calculateStages = (errors: CalculatedError[], uelFactors: number[]): StageData[] => {
            const stages: StageData[] = [];
            
            // ✅ STAGE 0: Basic Precision (siempre existe)
            stages.push({
                stage: 0,
                uelFactor: uelFactors[0],
                tainting: 0,
                averageTainting: 0,
                previousUEL: 0,
                loadingPropagation: uelFactors[0],
                simplePropagation: uelFactors[0],
                maxStageUEL: uelFactors[0]
            });

            let previousStageUEL = uelFactors[0];

            // ✅ STAGES 1 en adelante: Solo si hay errores
            for (let i = 1; i < uelFactors.length; i++) {
                const currentError = i - 1 < errors.length ? errors[i - 1] : null;
                
                if (!currentError) break;

                const tainting = currentError.tainting;
                const currentFactor = uelFactors[i];
                
                // Calcular average tainting hasta este stage (incluyendo stage 0)
                const errorsUpToStage = errors.slice(0, i);
                const averageTainting = errorsUpToStage.length > 0 
                    ? errorsUpToStage.reduce((sum, e) => sum + e.tainting, 0) / errorsUpToStage.length
                    : 0;

                // ✅ "Load and Spread": Previous UEL + Current Tainting
                const loadingPropagation = previousStageUEL + tainting;
                
                // ✅ "Simple Spread": Factor × Average Tainting  
                const simplePropagation = currentFactor * averageTainting;
                
                // ✅ Stage UEL es el MÁXIMO entre ambos
                const maxStageUEL = Math.max(loadingPropagation, simplePropagation);

                const stage: StageData = {
                    stage: i,
                    uelFactor: currentFactor,
                    tainting,
                    averageTainting,
                    previousUEL: previousStageUEL,
                    loadingPropagation,
                    simplePropagation,
                    maxStageUEL
                };
                
                stages.push(stage);
                previousStageUEL = maxStageUEL;
            }
            
            return stages;
        };

        // ✅ CALCULAR LOS STAGES
        const overstatementStages = calculateStages(overstatements, uelFactors);
        const understatementStages = calculateStages(understatements, uelFactors);

        // ✅ CÁLCULOS FINALES CORREGIDOS (IDEA COMPATIBLE)
        const totalOverTaintings = overstatements.reduce((sum, e) => sum + e.tainting, 0);
        const totalUnderTaintings = understatements.reduce((sum, e) => sum + e.tainting, 0);

        // Most Likely Error = Sum(tainting) × Sampling Interval
        const overstatementMLE = totalOverTaintings * sampleInterval;
        const understatementMLE = totalUnderTaintings * sampleInterval;

        // Basic Precision = UEL Factor[0] × Sampling Interval
        const basicPrecision = uelFactors[0] * sampleInterval;

        // ✅ CALCULAR UEL CORRECTAMENTE
        const getFinalUEL = (stages: StageData[]): number => {
            if (stages.length === 0) return uelFactors[0];
            return Math.max(...stages.map(s => s.maxStageUEL));
        };

        const overstatementFinalUEL = getFinalUEL(overstatementStages);
        const understatementFinalUEL = getFinalUEL(understatementStages);

        const overstatementUEL = overstatementFinalUEL * sampleInterval;
        const understatementUEL = understatementFinalUEL * sampleInterval;

        // ✅ PRECISION TOTAL CORREGIDA (ALGORITMO REAL DE IDEA)
        const calculatePrecisionTotal = (finalUEL: number, basicPrecision: number, sampleInterval: number): number => {
            const basicUELFactor = uelFactors[0];
            const incrementalUEL = finalUEL - basicUELFactor;
            return basicPrecision + (incrementalUEL * sampleInterval);
        };

        const overstatementPrecision = calculatePrecisionTotal(overstatementFinalUEL, basicPrecision, sampleInterval);
        const understatementPrecision = calculatePrecisionTotal(understatementFinalUEL, basicPrecision, sampleInterval);

        // ✅ NET CALCULATIONS CORREGIDOS (como IDEA)
        const netOverstatementMLE = overstatementMLE - understatementMLE;
        const netUnderstatementMLE = understatementMLE - overstatementMLE;

        const netOverstatementUEL = overstatementUEL - understatementMLE;
        const netUnderstatementUEL = understatementUEL - overstatementMLE;

        const response: CellClassicalResponse = {
            numErrores: errors.length,
            errorMasProbableBruto: overstatementMLE,
            errorMasProbableNeto: netOverstatementMLE,
            precisionTotal: overstatementPrecision,
            limiteErrorSuperiorBruto: overstatementUEL,
            limiteErrorSuperiorNeto: netOverstatementUEL,
            
            cellClassicalData: {
                overstatements: overstatementStages,
                understatements: understatementStages,
                totalTaintings: totalOverTaintings,
                stageUEL: overstatementFinalUEL,
                basicPrecision,
                mostLikelyError: overstatementMLE,
                upperErrorLimit: overstatementUEL,
                // ✅ AGREGAR los campos para understatements
                understatementMLE,
                understatementUEL,
                understatementPrecision,
                netUnderstatementUEL
            }
        };

        return NextResponse.json(response);
    } catch (error: any) {
        console.error("❌ Error en evaluación Cell & Classical PPS:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}