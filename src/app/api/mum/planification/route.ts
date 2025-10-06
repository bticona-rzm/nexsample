import { NextResponse } from 'next/server';
import { getConfidenceFactor } from '@/utils/tables';

export async function POST(req: Request) {
    try {
        const {
            excelData,
            useFieldValue,
            selectedField,
            selectedPopulationType,
            confidenceLevel,
            errorType,
            tolerableError,
            expectedError,
            estimatedPopulationValue,
        } = await req.json();

        // 1. Calcular valor de población
        let populationValue = estimatedPopulationValue;
        
        if (!populationValue || populationValue === 0) {
            if (useFieldValue && selectedField && excelData) {
                const sum = excelData.reduce((acc: number, row: any) => {
                    const value = parseFloat(row[selectedField]);
                    if (!isNaN(value)) {
                        if (selectedPopulationType === "positive" && value > 0) {
                            return acc + value;
                        }
                        if (selectedPopulationType === "negative" && value < 0) {
                            return acc + Math.abs(value);
                        }
                        if (selectedPopulationType === "absolute") {
                            return acc + Math.abs(value);
                        }
                    }
                    return acc;
                }, 0);
                populationValue = sum;
            } else if (!useFieldValue && excelData) {
                populationValue = excelData.length;
            }
        }

        if (populationValue === 0) {
            return NextResponse.json({ error: "El valor de la población es cero." }, { status: 400 });
        }

        // 2. Convertir errores a valores monetarios
        const tolerableErrorMonetary = errorType === "percentage"
            ? (tolerableError / 100) * populationValue
            : tolerableError;

        const expectedErrorMonetary = errorType === "percentage"
            ? (expectedError / 100) * populationValue
            : expectedError;

        // 3. Validaciones
        if (expectedErrorMonetary >= tolerableErrorMonetary) {
            return NextResponse.json({ 
                error: "El error esperado debe ser menor que el error tolerable." 
            }, { status: 400 });
        }

        // 4. Obtener factor de confianza
        const confidenceFactor = getConfidenceFactor(confidenceLevel);

        // 5. CÁLCULOS CORREGIDOS SEGÚN IDEA
        
        // Tamaño de muestra inicial (fórmula estándar MUM)
        const initialSampleSize = Math.ceil(
            (populationValue * confidenceFactor) / tolerableErrorMonetary
        );

        // Ajuste por error esperado (fórmula de expansión)
        const expansionFactor = tolerableErrorMonetary / (tolerableErrorMonetary - expectedErrorMonetary);
        const adjustedSampleSize = Math.ceil(initialSampleSize * expansionFactor);

        // Tamaño final (no puede ser mayor que la población)
        const finalSampleSize = Math.min(adjustedSampleSize, populationValue);
        
        // Intervalo muestral
        const sampleInterval = populationValue / finalSampleSize;

        // Suma de contaminaciones tolerables (en porcentaje)
        // Esta es la clave: se calcula como (ErrorEsperado / ErrorTolerable) * 100
        const tolerableContaminationPercent = (expectedErrorMonetary / tolerableErrorMonetary) * 100;

        // Número de errores esperados (para la conclusión)
        // IDEA usa "total taintings" que es un valor decimal, no entero
        const expectedTotalTaintings = expectedErrorMonetary / tolerableErrorMonetary;

        const conclusion = `La población podrá aceptarse a un nivel de confianza del ${confidenceLevel}% cuando no se observan más de ${expectedTotalTaintings.toFixed(6)} total taintings en una muestra de tamaño ${finalSampleSize}.`;

        return NextResponse.json({
            estimatedPopulationValue: populationValue,
            estimatedSampleSize: finalSampleSize,
            sampleInterval: sampleInterval,
            tolerableContamination: tolerableContaminationPercent,
            conclusion,
            confidenceFactorUsed: confidenceFactor,
            expectedTotalTaintings: expectedTotalTaintings,
            minSampleSize: finalSampleSize
        });

    } catch (error: any) {
        console.error('Error in planification API:', error);
        return NextResponse.json({ 
            error: "Ocurrió un error en el servidor: " + error.message 
        }, { status: 500 });
    }
}