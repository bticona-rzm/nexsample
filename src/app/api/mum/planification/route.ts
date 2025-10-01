// app/api/mum/planification/route.ts
import { NextResponse } from 'next/server';

// Factores de Confianza para MUM (Monetary Unit Sampling)
const confidenceFactors: {
    [confidenceLevel: number]: number[]
} = {
    75: [1.39, 2.70, 3.93, 5.11],
    90: [2.31, 3.89, 5.33, 6.69],
    95: [3.00, 4.75, 6.30, 7.76],
    99: [4.61, 6.64, 8.41, 10.05],
};

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
                    if (!isNaN(value) && value > 0) { // Solo valores positivos
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

        // 4. Obtener factor de confianza
        const currentConfidenceFactors = confidenceFactors[confidenceLevel];
        if (!currentConfidenceFactors) {
            return NextResponse.json({ 
                error: "Nivel de confianza no válido. Use 75, 90, 95 o 99." 
            }, { status: 400 });
        }

        // 5. Calcular número de errores esperados - FÓRMULA CORREGIDA
        // En MUM, esto se basa en la relación entre error esperado y tolerable
        const errorRatio = expectedErrorMonetary / tolerableErrorMonetary;
        
        // Método más preciso para determinar expectedErrorsCount
        let expectedErrorsCount = 0;
        if (errorRatio > 0.33 && errorRatio <= 0.66) {
            expectedErrorsCount = 1;
        } else if (errorRatio > 0.66) {
            expectedErrorsCount = 2;
        }
        // Si errorRatio <= 0.33, se mantiene en 0

        expectedErrorsCount = Math.min(expectedErrorsCount, 3);
        const confidenceFactor = currentConfidenceFactors[expectedErrorsCount];

        // 6. CÁLCULOS CORREGIDOS - FÓRMULA ESTÁNDAR MUM

        // a) Tamaño de muestra - FÓRMULA PRECISA
        const initialSampleSize = Math.ceil(
            (populationValue * confidenceFactor) / tolerableErrorMonetary
        );

        // b) Ajustar por error esperado (incrementar muestra si hay error esperado)
        const adjustedSampleSize = expectedErrorsCount > 0 
            ? Math.ceil(initialSampleSize * (1 + (expectedErrorsCount * 0.1)))
            : initialSampleSize;

        // c) Asegurar que no exceda la población
        const finalSampleSize = Math.min(adjustedSampleSize, populationValue);

        // d) Intervalo muestral - FÓRMULA PRECISA
        const sampleInterval = populationValue / finalSampleSize;

        // e) Suma de contaminaciones tolerables - CÁLCULO CORRECTO
        // Esto representa el porcentaje máximo de error que podemos tolerar en la muestra
        const tolerableContaminationPercent = ((tolerableErrorMonetary - expectedErrorMonetary) / tolerableErrorMonetary) * 100;

        // f) Conclusión
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