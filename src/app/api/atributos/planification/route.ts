import { NextResponse } from 'next/server';
import { 
    getMusPlanificationFactors,
    getMusPlanificationFactor,
    getAvailableMusConfidenceLevels
} from '@/utils/tables';

export async function POST(request: Request) {
    try {
        const { 
            estimatedPopulationValue, 
            confidenceLevel, 
            errorType, 
            tolerableError, 
            expectedError,
            excelData,
            useFieldValue,
        } = await request.json();

        // Validaciones
        if (!estimatedPopulationValue || estimatedPopulationValue <= 0) {
            return NextResponse.json({ error: "El valor de la población debe ser mayor que cero." }, { status: 400 });
        }
        
        if (!tolerableError || tolerableError <= 0) {
            return NextResponse.json({ error: "El error tolerable debe ser mayor que cero." }, { status: 400 });
        }

        // ✅ USAR TABLAS CENTRALIZADAS
        const availableLevels = getAvailableMusConfidenceLevels();
        if (!availableLevels.includes(confidenceLevel)) {
            return NextResponse.json({ 
                error: `Nivel de confianza no válido. Debe ser: ${availableLevels.join(', ')}.` 
            }, { status: 400 });
        }

        // Determinar valor de población
        let finalPopulationValue: number;
        
        if (useFieldValue) {
            finalPopulationValue = estimatedPopulationValue;
        } else {
            if (!excelData || !Array.isArray(excelData)) {
                return NextResponse.json({ error: "Datos de Excel no proporcionados o inválidos." }, { status: 400 });
            }
            finalPopulationValue = excelData.length;
        }

        if (finalPopulationValue <= 0) {
            return NextResponse.json({ error: "El valor de la población debe ser mayor que cero." }, { status: 400 });
        }

        // Convertir errores
        const tolerableErrorMonetary = errorType === "percentage"
            ? (tolerableError / 100) * finalPopulationValue
            : tolerableError;
        
        const expectedErrorMonetary = errorType === "percentage"
            ? (expectedError / 100) * finalPopulationValue
            : expectedError;

        if (expectedErrorMonetary >= tolerableErrorMonetary) {
            return NextResponse.json({ 
                error: `El error esperado debe ser menor que el error tolerable.` 
            }, { status: 400 });
        }

        // ✅ USAR FUNCIÓN CENTRALIZADA
        const expectedErrorsCount = Math.min(
            Math.floor(expectedErrorMonetary / (tolerableErrorMonetary * 0.1)),
            getMusPlanificationFactors(confidenceLevel).length - 1
        );
        
        const confidenceFactor = getMusPlanificationFactor(confidenceLevel, expectedErrorsCount);
        
        console.log("Parámetros MUS (desde tables.ts):", {
            poblacion: finalPopulationValue,
            factorConfianza: confidenceFactor,
            erroresEsperadosCount: expectedErrorsCount
        });

        // Cálculos
        const sampleInterval = finalPopulationValue / (tolerableErrorMonetary / confidenceFactor);
        const estimatedSampleSize = Math.ceil(finalPopulationValue / sampleInterval);
        const tolerableContamination = (confidenceFactor / estimatedSampleSize) * 100;
        const minSampleSize = Math.max(30, Math.ceil(finalPopulationValue * 0.05));

        const conclusion = 
            `Para una población de ${finalPopulationValue.toLocaleString()} con error tolerable del ${tolerableError}${errorType === "percentage" ? "%" : " unidades"}, ` +
            `se requiere una muestra de ${estimatedSampleSize} elementos (intervalo: ${sampleInterval.toFixed(2)}). ` +
            `La tasa de error proyectada no debe exceder el ${tolerableContamination.toFixed(2)}%.`;

        return NextResponse.json({
            estimatedPopulationValue: finalPopulationValue,
            estimatedSampleSize,
            sampleInterval: Math.round(sampleInterval * 100) / 100,
            tolerableContamination: Math.round(tolerableContamination * 100) / 100,
            minSampleSize,
            conclusion,
            confidenceFactorUsed: confidenceFactor
        });

    } catch (error) {
        console.error("Error en cálculo de planificación MUS:", error);
        return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
    }
}