// app/api/mum/planification/route.ts
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

        // 1. Usar el valor de población del frontend o calcularlo
        let populationValue = estimatedPopulationValue;
        
        if (!populationValue || populationValue === 0) {
            if (useFieldValue && selectedField && excelData) {
                const sum = excelData.reduce((acc: number, row: any) => {
                    const value = parseFloat(row[selectedField]);
                    if (!isNaN(value) && value > 0) {
                        return acc + value;
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

        // 4. Obtener factor de confianza - SIMPLIFICADO
        const confidenceFactor = getConfidenceFactor(confidenceLevel);

        // 5. Calcular número de errores esperados (simplificado)
        const errorRatio = expectedErrorMonetary / tolerableErrorMonetary;
        let expectedErrorsCount = 0;
        
        if (errorRatio > 0.33) expectedErrorsCount = 1;
        if (errorRatio > 0.66) expectedErrorsCount = 2;

        // 6. CÁLCULOS SIMPLIFICADOS
        const initialSampleSize = Math.ceil(
            (populationValue * confidenceFactor) / (tolerableErrorMonetary - expectedErrorMonetary)
        );

        const finalSampleSize = Math.min(initialSampleSize, populationValue);
        const sampleInterval = populationValue / finalSampleSize;

        const tolerableContaminationPercent = ((tolerableErrorMonetary - expectedErrorMonetary) / tolerableErrorMonetary) * 100;

        const conclusion = `La población podrá aceptarse a un nivel de confianza del ${confidenceLevel}% cuando no se observan más de ${expectedErrorsCount} error(es) en una muestra de tamaño ${finalSampleSize}.`;

        return NextResponse.json({
            estimatedPopulationValue: populationValue,
            estimatedSampleSize: finalSampleSize,
            sampleInterval: sampleInterval,
            tolerableContamination: tolerableContaminationPercent,
            conclusion,
            confidenceFactorUsed: confidenceFactor,
            expectedErrorsCount: expectedErrorsCount,
            minSampleSize: finalSampleSize
        });

    } catch (error: any) {
        console.error('Error in planification API:', error);
        return NextResponse.json({ 
            error: "Ocurrió un error en el servidor: " + error.message 
        }, { status: 500 });
    }
}