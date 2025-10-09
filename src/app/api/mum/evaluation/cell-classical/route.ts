// app/api/mum/evaluation/cell-classical/route.ts
import { NextResponse } from 'next/server';
import { getIncrementalFactors, calculateBasicPrecision } from '@/utils/tables';

// Interfaces (se mantienen igual)
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
            populationExcludingHigh,
            highValueTotal,
            highValueCountResume
        } = await req.json();

        console.log("📊 PROCESANDO CELL & CLASSICAL PPS:", {
            items: sampleData.length,
            interval: sampleInterval,
            confidence: confidenceLevel,
            poblacion: populationValue
        });

        // 1. CALCULAR ERRORES - CORREGIDO
        const errors: CalculatedError[] = sampleData
            .filter((item: SampleItem) => {
                const bookValue = Number(item.bookValue);
                const auditedValue = Number(item.auditedValue);
                
                if (isNaN(bookValue) || isNaN(auditedValue) || bookValue === 0) {
                    return false;
                }
                
                // ✅ CORREGIDO: Solo considerar errores significativos (> 0.01)
                const hasError = Math.abs(bookValue - auditedValue) > 0.01;
                return hasError;
            })
            .map((item: SampleItem) => {
                const bookValue = Number(item.bookValue);
                const auditedValue = Number(item.auditedValue);
                const error = bookValue - auditedValue;
                
                // ✅ CORREGIDO: Tainting siempre positivo, entre 0 y 1
                const tainting = Math.min(Math.abs(error) / Math.abs(bookValue), 1);
                
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

        // 2. ✅ USAR FACTORES DE TABLAS CORREGIDOS
        const factors = getIncrementalFactors(confidenceLevel);

        // 3. ✅ SEPARAR ERRORES CORRECTAMENTE
        const overstatements = errors
            .filter((e: CalculatedError) => e.isOverstatement)
            .sort((a: CalculatedError, b: CalculatedError) => b.tainting - a.tainting);
            
        const understatements = errors
            .filter((e: CalculatedError) => e.isUnderstatement)  
            .sort((a: CalculatedError, b: CalculatedError) => b.tainting - a.tainting);

        // 4. ✅ CALCULAR MOST LIKELY ERROR CORRECTO
        const overstatementMLE = overstatements.reduce((sum: number, e: CalculatedError) => sum + e.projectedError, 0);
        const understatementMLE = understatements.reduce((sum: number, e: CalculatedError) => sum + e.projectedError, 0);

        // 5. ✅ CALCULAR UEL COMO IDEA - ALGORITMO CORREGIDO
        const calculateUEL = (errorList: CalculatedError[]): { uel: number, stages: StageData[] } => {
            if (errorList.length === 0) {
                return { 
                    uel: factors[0], 
                    stages: [] 
                };
            }
            
            const stages: StageData[] = [];
            let cumulativeUEL = factors[0];
            
            for (let i = 0; i < Math.min(errorList.length, factors.length); i++) {
                const error = errorList[i];
                const incrementalFactor = i === 0 ? factors[0] : factors[i] - factors[i-1];
                
                // ✅ CORREGIDO: Cálculos como IDEA
                const loadingPropagation = cumulativeUEL + error.tainting;
                const simplePropagation = factors[i] * error.tainting;
                const maxStageUEL = Math.max(loadingPropagation, simplePropagation);
                
                const stage: StageData = {
                    stage: i + 1,
                    uelFactor: factors[i],
                    tainting: error.tainting,
                    averageTainting: errorList.slice(0, i + 1).reduce((sum, e) => sum + e.tainting, 0) / (i + 1),
                    previousUEL: cumulativeUEL,
                    loadingPropagation,
                    simplePropagation,
                    maxStageUEL
                };
                
                cumulativeUEL = maxStageUEL;
                stages.push(stage);
            }
            
            return { uel: cumulativeUEL, stages };
        };

        // ✅ CALCULAR POR SEPARADO
        const overstatementResult = calculateUEL(overstatements);
        const understatementResult = calculateUEL(understatements);

        const overstatementUEL = overstatementResult.uel;
        const understatementUEL = understatementResult.uel;
        const overstatementStages = overstatementResult.stages;
        const understatementStages = understatementResult.stages;

        // 6. ✅ BASIC PRECISION CORRECTA
        const basicPrecision = calculateBasicPrecision(confidenceLevel, sampleInterval);

        // 7. ✅ RESULTADOS FINALES - CORREGIDOS PARA COINCIDIR CON IDEA
        const response: CellClassicalResponse = {
            numErrores: errors.length,
            
            // ✅ CORREGIDO: Most Likely Error diferente para cada columna
            errorMasProbableBruto: overstatementMLE,  // Sobrestimaciones
            errorMasProbableNeto: -understatementMLE, // Subestimaciones (negativo)
            
            precisionTotal: basicPrecision,
            
            // ✅ CORREGIDO: Límites diferentes multiplicados por sampleInterval
            limiteErrorSuperiorBruto: overstatementUEL * sampleInterval,
            limiteErrorSuperiorNeto: understatementUEL * sampleInterval,
            
            // ✅ MANTENER valores reales recibidos
            populationExcludingHigh: populationExcludingHigh !== undefined ? populationExcludingHigh : populationValue,
            highValueTotal: highValueTotal !== undefined ? highValueTotal : 0,
            populationIncludingHigh: populationValue,
            highValueCountResume: highValueCountResume !== undefined ? highValueCountResume : 0,
            
            // ✅ DATOS DETALLADOS CORREGIDOS
            cellClassicalData: {
                overstatements: overstatementStages,
                understatements: understatementStages,
                totalTaintings: errors.reduce((sum: number, e: CalculatedError) => sum + e.tainting, 0),
                stageUEL: Math.max(overstatementUEL, understatementUEL),
                basicPrecision,
                mostLikelyError: overstatementMLE + understatementMLE,
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
            limiteNeto: response.limiteErrorSuperiorNeto,
            basicPrecision: response.precisionTotal
        });

        return NextResponse.json(response);

    } catch (error: any) {
        console.error("❌ Error en evaluación Cell & Classical PPS:", error);
        return NextResponse.json({ 
            error: `Error en evaluación: ${error.message}` 
        }, { status: 500 });
    }
}