import { NextResponse } from 'next/server';
import { 
    getCellClassicalFactors,
    ProcessedError,
    StageData 
} from '@/utils/tables';

// Interfaces específicas del componente
interface SampleItem {
    reference: string;
    bookValue: number;
    auditedValue: number;
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

// ✅ FUNCIONES DE LÓGICA DE NEGOCIO (en el route)
const detectErrors = (sampleData: SampleItem[], sampleInterval: number): ProcessedError[] => {
    return sampleData
        .filter((item: SampleItem) => Math.abs(item.bookValue - item.auditedValue) > 0.01)
        .map((item: SampleItem) => {
            const error = item.bookValue - item.auditedValue;
            const tainting = item.bookValue > 0 ? Math.abs(error) / item.bookValue : 0;
            const projectedError = tainting * sampleInterval;
            
            return {
                reference: item.reference,
                bookValue: item.bookValue,
                auditedValue: item.auditedValue,
                error,
                tainting: Math.min(tainting, 1),
                isOverstatement: error > 0,
                isUnderstatement: error < 0,
                projectedError: Math.round(projectedError * 100) / 100
            };
        });
};

// ✅ FUNCIÓN CORREGIDA para calcular stages (usando factores centralizados)
const calculateStages = (errors: ProcessedError[], uelFactors: number[]): StageData[] => {
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

// ✅ CALCULAR UEL CORRECTAMENTE
const getFinalUEL = (stages: StageData[]): number => {
    if (stages.length === 0) return 0;
    return Math.max(...stages.map(s => s.maxStageUEL));
};

// ✅ PRECISION TOTAL CORREGIDA (ALGORITMO REAL DE IDEA)
const calculatePrecisionTotal = (finalUEL: number, basicPrecision: number, sampleInterval: number, basicUELFactor: number): number => {
    const incrementalUEL = finalUEL - basicUELFactor;
    return basicPrecision + (incrementalUEL * sampleInterval);
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

        // 1. CALCULAR ERRORES Y TAINTINGS (usando función local)
        const errors = detectErrors(sampleData, sampleInterval);

        // 2. SEPARAR SOBREESTIMACIONES Y SUBESTIMACIONES
        const overstatements = errors.filter((e: ProcessedError) => e.isOverstatement)
            .sort((a, b) => b.tainting - a.tainting);
        const understatements = errors.filter((e: ProcessedError) => e.isUnderstatement)
            .sort((a, b) => b.tainting - a.tainting);

        // ✅ OBTENER FACTORES DESDE TABLAS CENTRALIZADAS
        const uelFactors = getCellClassicalFactors(confidenceLevel);

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

        const overstatementFinalUEL = getFinalUEL(overstatementStages);
        const understatementFinalUEL = getFinalUEL(understatementStages);

        const overstatementUEL = overstatementFinalUEL * sampleInterval;
        const understatementUEL = understatementFinalUEL * sampleInterval;

        const overstatementPrecision = calculatePrecisionTotal(overstatementFinalUEL, basicPrecision, sampleInterval, uelFactors[0]);
        const understatementPrecision = calculatePrecisionTotal(understatementFinalUEL, basicPrecision, sampleInterval, uelFactors[0]);

        // ✅ NET CALCULATIONS CORREGIDOS (como IDEA)
        const netOverstatementMLE = overstatementMLE - understatementMLE;
        const netOverstatementUEL = overstatementUEL - understatementMLE;

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
                netUnderstatementUEL: understatementUEL - overstatementMLE
            }
        };

        return NextResponse.json(response);
    } catch (error: any) {
        console.error("❌ Error en evaluación Cell & Classical PPS:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}