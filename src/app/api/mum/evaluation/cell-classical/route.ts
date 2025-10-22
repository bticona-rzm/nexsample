// app/api/mum/evaluation/cell-classical/route.ts
import { NextResponse } from 'next/server';
import { 
    getCellClassicalFactors, 
    detectErrors, 
    calculateHighValueErrors,
    calculatePrecisionTotal,
    calculatePrecisionGapWidening,
    ProcessedError,
    StageData
} from '@/utils/tables';

// ✅ ALGORITMO CELL & CLASSICAL (usando factores centralizados)
const calculateUEL = (errorList: ProcessedError[], factors: number[], sampleInterval: number): { 
    uel: number, 
    stages: StageData[],
    mostLikelyError: number,
    totalTaintings: number,
    precisionGapWidening: number
} => {
    const stages: StageData[] = [];
    const initialUELFactor = Math.round(factors[0] * 10000) / 10000;
    let currentUEL = initialUELFactor;
    let totalTaintings = 0;

    // Stage 0
    const stage0: StageData = {
        stage: 0,
        uelFactor: initialUELFactor,
        tainting: 1.0000,
        averageTainting: 0.0000,
        previousUEL: 0.0000,
        loadingPropagation: 0.0000,
        simplePropagation: initialUELFactor,
        maxStageUEL: Math.max(0.0000, initialUELFactor)
    };
    stages.push(stage0);

    const realErrors = errorList.filter(e => e.tainting > 0);

    for (let i = 0; i < realErrors.length; i++) {
        if (i >= factors.length - 1) break;

        const error = realErrors[i];
        totalTaintings += error.tainting;
        
        const currentFactor = factors[i + 1];
        const loadAndSpread = Math.round((currentUEL + error.tainting) * 10000) / 10000;
        
        const taintingsUpToNow = realErrors.slice(0, i + 1).map(e => e.tainting);
        const averageTainting = taintingsUpToNow.reduce((sum, t) => sum + t, 0) / taintingsUpToNow.length;
        
        const simpleSpread = Math.round((currentFactor * averageTainting) * 10000) / 10000;
        const stageUEL = Math.max(loadAndSpread, simpleSpread);
        
        const stage: StageData = {
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
        precisionGapWidening
    };
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

        // ✅ USAR FUNCIONES CENTRALIZADAS
        const errors = detectErrors(sampleData, sampleInterval);
        const factors = getCellClassicalFactors(confidenceLevel);

        const overstatements = errors
            .filter(e => e.isOverstatement)
            .sort((a, b) => b.tainting - a.tainting);
            
        const understatements = errors
            .filter(e => e.isUnderstatement)
            .sort((a, b) => b.tainting - a.tainting);

        const overstatementResult = calculateUEL(overstatements, factors, sampleInterval);
        const understatementResult = calculateUEL(understatements, factors, sampleInterval);

        // ✅ CÁLCULOS NETOS
        const netOverstatementMLE = overstatementResult.mostLikelyError - understatementResult.mostLikelyError;
        const netOverstatementUEL = Math.round((overstatementResult.uel * sampleInterval - understatementResult.mostLikelyError) * 100) / 100;

        const highValueErrors = calculateHighValueErrors(highValueItems);

        const response = {
            numErrores: overstatements.length + understatements.length,
            errorMasProbableBruto: overstatementResult.mostLikelyError,
            errorMasProbableNeto: netOverstatementMLE,
            
            precisionTotal: calculatePrecisionTotal(
                Math.round(overstatementResult.uel * sampleInterval * 100) / 100,
                overstatementResult.mostLikelyError
            ),
            precisionTotalUnder: calculatePrecisionTotal(
                Math.round(understatementResult.uel * sampleInterval * 100) / 100,
                understatementResult.mostLikelyError
            ),

            limiteErrorSuperiorBruto: Math.round(overstatementResult.uel * sampleInterval * 100) / 100,
            limiteErrorSuperiorNeto: netOverstatementUEL,
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
            },
            
            cellClassicalData: {
                overstatements: overstatementResult.stages,
                understatements: understatementResult.stages,
                totalTaintings: overstatementResult.totalTaintings,
                stageUEL: overstatementResult.uel,
                basicPrecision: Math.round(factors[0] * sampleInterval * 100) / 100,
                mostLikelyError: overstatementResult.mostLikelyError,
                upperErrorLimit: Math.round(overstatementResult.uel * sampleInterval * 100) / 100,
                understatementMLE: understatementResult.mostLikelyError,
                understatementUEL: Math.round(understatementResult.uel * sampleInterval * 100) / 100,
                netUnderstatementUEL: Math.round((understatementResult.uel * sampleInterval - overstatementResult.mostLikelyError) * 100) / 100,
                precisionGapWideningOver: overstatementResult.precisionGapWidening,
                precisionGapWideningUnder: understatementResult.precisionGapWidening
            }
        };

        return NextResponse.json(response);

    } catch (error: any) {
        console.error("❌ Error en evaluación:", error);
        return NextResponse.json({ 
            error: `Error en evaluación: ${error.message}` 
        }, { status: 500 });
    }
}