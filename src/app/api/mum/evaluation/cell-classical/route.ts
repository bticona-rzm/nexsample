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

        // ✅ 1. REGLA IDEA: Precisión decimal para cálculos
        const IDEA_DECIMAL_PRECISION = {
            monetary: 2,      // Valores monetarios
            percentages: 6,   // Taintings
            factors: 4,       // Factores UEL
        };

        // 2. CALCULAR ERRORES - CON PRECISIÓN IDEA
        const errors: CalculatedError[] = sampleData
            .filter((item: SampleItem) => {
                const bookValue = Number(item.bookValue);
                const auditedValue = Number(item.auditedValue);
                
                if (isNaN(bookValue) || isNaN(auditedValue) || bookValue === 0) {
                    return false;
                }
                
                // ✅ REGLA IDEA: Solo errores > 0.01
                const hasError = Math.abs(bookValue - auditedValue) > 0.01;
                return hasError;
            })
            .map((item: SampleItem) => {
                const bookValue = Number(item.bookValue);
                const auditedValue = Number(item.auditedValue);
                const error = bookValue - auditedValue;
                
                // ✅ REGLA IDEA: Tainting entre 0-1, 6 decimales
                const tainting = Math.round(Math.min(Math.abs(error) / Math.abs(bookValue), 1) * 1000000) / 1000000;
                
                return {
                    reference: item.reference,
                    bookValue: bookValue,
                    auditedValue: auditedValue,
                    error,
                    tainting,
                    isOverstatement: error > 0,
                    isUnderstatement: error < 0,
                    projectedError: Math.round(tainting * sampleInterval * 100) / 100 // 2 decimales monetarios
                };
            });

        console.log("🔍 ERRORES ENCONTRADOS:", errors.length);

        // 3. ✅ USAR FACTORES IDEA CORREGIDOS
        const factors = getIncrementalFactors(confidenceLevel);

        // 4. ✅ SEPARAR ERRORES CORRECTAMENTE
        const overstatements = errors
            .filter((e: CalculatedError) => e.isOverstatement)
            .sort((a: CalculatedError, b: CalculatedError) => b.tainting - a.tainting);
            
        const understatements = errors
            .filter((e: CalculatedError) => e.isUnderstatement)  
            .sort((a: CalculatedError, b: CalculatedError) => b.tainting - a.tainting);

        // ✅ REGLA IDEA: Most Likely Error con 2 decimales
        const overstatementMLE = Math.round(overstatements.reduce((sum: number, e: CalculatedError) => sum + e.projectedError, 0) * 100) / 100;
        const understatementMLE = Math.round(understatements.reduce((sum: number, e: CalculatedError) => sum + e.projectedError, 0) * 100) / 100;

        // 5. ✅ CALCULAR UEL CON ALGORITMO IDEA COMPLETO
        const calculateUEL = (errorList: CalculatedError[]): { uel: number, stages: StageData[] } => {
            if (errorList.length === 0) {
                return { 
                    uel: Math.round(factors[0] * 10000) / 10000, // 4 decimales
                    stages: [] 
                };
            }
            
            const stages: StageData[] = [];
            let cumulativeUEL = factors[0];
            
            // ✅ REGLA IDEA: Máximo 10 errores procesados
            const maxErrors = Math.min(errorList.length, 10);
            
            for (let i = 0; i < maxErrors; i++) {
                const error = errorList[i];
                
                // ✅ CÁLCULOS CON PRECISIÓN IDEA
                const loadingPropagation = Math.round((cumulativeUEL + error.tainting) * 10000) / 10000;
                const simplePropagation = Math.round((factors[i] * error.tainting) * 10000) / 10000;
                const maxStageUEL = Math.max(loadingPropagation, simplePropagation);
                
                const stage: StageData = {
                    stage: i + 1,
                    uelFactor: Math.round(factors[i] * 10000) / 10000,
                    tainting: error.tainting,
                    averageTainting: Math.round(errorList.slice(0, i + 1).reduce((sum, e) => sum + e.tainting, 0) / (i + 1) * 1000000) / 1000000,
                    previousUEL: Math.round(cumulativeUEL * 10000) / 10000,
                    loadingPropagation,
                    simplePropagation,
                    maxStageUEL: Math.round(maxStageUEL * 10000) / 10000
                };
                
                cumulativeUEL = maxStageUEL;
                stages.push(stage);
            }
            
            return { uel: Math.round(cumulativeUEL * 10000) / 10000, stages };
        };

        // ✅ CALCULAR POR SEPARADO
        const overstatementResult = calculateUEL(overstatements);
        const understatementResult = calculateUEL(understatements);

        const overstatementUEL = overstatementResult.uel;
        const understatementUEL = understatementResult.uel;
        const overstatementStages = overstatementResult.stages;
        const understatementStages = understatementResult.stages;

        // 6. ✅ BASIC PRECISION CORRECTA (2 decimales)
        const basicPrecision = Math.round(calculateBasicPrecision(confidenceLevel, sampleInterval) * 100) / 100;

        // 7. ✅ RESULTADOS FINALES CON PRECISIÓN IDEA
        const response: CellClassicalResponse = {
            numErrores: errors.length,
            
            // ✅ PRECISIÓN MONETARIA: 2 decimales
            errorMasProbableBruto: overstatementMLE,
            errorMasProbableNeto: -understatementMLE,
            
            precisionTotal: basicPrecision,
            
            // ✅ LÍMITES CON 2 DECIMALES
            limiteErrorSuperiorBruto: Math.round(overstatementUEL * sampleInterval * 100) / 100,
            limiteErrorSuperiorNeto: Math.round(understatementUEL * sampleInterval * 100) / 100,
            
            // ✅ VALORES DE POBLACIÓN CON 2 DECIMALES
            populationExcludingHigh: populationExcludingHigh !== undefined ? Math.round(populationExcludingHigh * 100) / 100 : Math.round(populationValue * 100) / 100,
            highValueTotal: highValueTotal !== undefined ? Math.round(highValueTotal * 100) / 100 : 0,
            populationIncludingHigh: Math.round(populationValue * 100) / 100,
            highValueCountResume: highValueCountResume !== undefined ? highValueCountResume : 0,
            
            // ✅ DATOS DETALLADOS CON PRECISIÓN IDEA
            cellClassicalData: {
                overstatements: overstatementStages,
                understatements: understatementStages,
                totalTaintings: Math.round(errors.reduce((sum: number, e: CalculatedError) => sum + e.tainting, 0) * 1000000) / 1000000,
                stageUEL: Math.round(Math.max(overstatementUEL, understatementUEL) * 10000) / 10000,
                basicPrecision,
                mostLikelyError: Math.round((overstatementMLE + understatementMLE) * 100) / 100,
                upperErrorLimit: Math.round(Math.max(overstatementUEL, understatementUEL) * sampleInterval * 100) / 100
            }
        };

        console.log("📈 RESULTADOS CELL & CLASSICAL - IDEA:", {
            errores: response.numErrores,
            sobrestimaciones: overstatements.length,
            subestimaciones: understatements.length,
            errorBruto: response.errorMasProbableBruto,
            errorNeto: response.errorMasProbableNeto,
            limiteBruto: response.limiteErrorSuperiorBruto,
            limiteNeto: response.limiteErrorSuperiorNeto,
            precision: response.precisionTotal,
            reglasAplicadas: {
                decimalesMonetarios: 2,
                decimalesTainting: 6,
                maxErroresProcesados: 10
            }
        });

        return NextResponse.json(response);

    } catch (error: any) {
        console.error("❌ Error en evaluación Cell & Classical PPS:", error);
        return NextResponse.json({ 
            error: `Error en evaluación: ${error.message}` 
        }, { status: 500 });
    }
}