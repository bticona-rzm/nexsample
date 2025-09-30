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
    };
}

// Factores UEL para Cell & Classical PPS (95% confianza)
const UEL_FACTORS = [3.00, 1.75, 1.55, 1.46, 1.40, 1.36, 1.33, 1.30];

export async function POST(req: Request) {
    try {
        const {
            sampleData,
            sampleInterval,
            confidenceLevel,
            populationValue
        }: {
            sampleData: SampleItem[];
            sampleInterval: number;
            confidenceLevel: number;
            populationValue: number;
        } = await req.json();

        // 1. CALCULAR ERRORES Y TAINTINGS
        const errors: CalculatedError[] = sampleData
            .filter((item: SampleItem) => item.bookValue !== item.auditedValue)
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
                    isUnderstatement: error < 0
                };
            });

        // 2. SEPARAR SOBREESTIMACIONES Y SUBESTIMACIONES
        const overstatements = errors.filter((e: CalculatedError) => e.isOverstatement);
        const understatements = errors.filter((e: CalculatedError) => e.isUnderstatement);

        // 3. CALCULAR ETAPAS PARA CELL & CLASSICAL PPS
        const calculateStages = (errors: CalculatedError[], type: 'over' | 'under'): StageData[] => {
            const stages: StageData[] = [];
            let cumulativeUEL = UEL_FACTORS[0];
            
            for (let i = 0; i < Math.min(errors.length, UEL_FACTORS.length); i++) {
                const stage: StageData = {
                    stage: i,
                    uelFactor: UEL_FACTORS[i],
                    tainting: errors[i]?.tainting || 0,
                    averageTainting: errors.slice(0, i + 1).reduce((sum: number, e: CalculatedError) => sum + e.tainting, 0) / (i + 1),
                    previousUEL: cumulativeUEL,
                    loadingPropagation: UEL_FACTORS[i],
                    simplePropagation: UEL_FACTORS[i],
                    maxStageUEL: cumulativeUEL + UEL_FACTORS[i]
                };
                cumulativeUEL = stage.maxStageUEL;
                stages.push(stage);
            }
            return stages;
        };

        const overstatementStages = calculateStages(overstatements, 'over');
        const understatementStages = calculateStages(understatements, 'under');

        // 4. CALCULAR RESULTADOS FINALES
        const totalTaintings = errors.reduce((sum: number, e: CalculatedError) => sum + e.tainting, 0);
        const stageUEL = Math.max(
            ...overstatementStages.map((s: StageData) => s.maxStageUEL),
            ...understatementStages.map((s: StageData) => s.maxStageUEL)
        );
        const basicPrecision = UEL_FACTORS[0] * sampleInterval;
        const mostLikelyError = totalTaintings * sampleInterval;
        const upperErrorLimit = stageUEL * sampleInterval;

        const response: CellClassicalResponse = {
            numErrores: errors.length,
            errorMasProbableBruto: mostLikelyError,
            errorMasProbableNeto: mostLikelyError * 0.8,
            precisionTotal: basicPrecision,
            limiteErrorSuperiorBruto: upperErrorLimit,
            limiteErrorSuperiorNeto: upperErrorLimit * 0.8,
            
            cellClassicalData: {
                overstatements: overstatementStages,
                understatements: understatementStages,
                totalTaintings,
                stageUEL,
                basicPrecision,
                mostLikelyError,
                upperErrorLimit
            }
        };

        return NextResponse.json(response);
    } catch (error: any) {
        console.error("Error en evaluación Cell & Classical PPS:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}