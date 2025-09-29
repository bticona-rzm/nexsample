// app/api/mum/planification/route.ts
import { NextResponse } from 'next/server';

// Factores de Confianza CORREGIDOS (para 0, 1, 2, 3 errores esperados)
const confidenceFactors: {
    [confidenceLevel: number]: number[]
} = {
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
            modifyPrecision,
            precisionValue,
        } = await req.json();

        // 1. Calcular el valor total de la población (ESTE ESTÁ BIEN)
        let estimatedPopulationValue = 0;
        if (useFieldValue && selectedField) {
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
            estimatedPopulationValue = sum;
        } else {
            estimatedPopulationValue = excelData.length;
        }

        // 2. Convertir errores a valores monetarios (ESTE ESTÁ BIEN)
        const tolerableErrorMonetary = errorType === "percentage"
            ? (tolerableError / 100) * estimatedPopulationValue
            : tolerableError;

        const expectedErrorMonetary = errorType === "percentage"
            ? (expectedError / 100) * estimatedPopulationValue
            : expectedError;

        // 3. Validaciones (ESTÁ BIEN)
        if (estimatedPopulationValue === 0) {
            return NextResponse.json({ error: "El valor de la población es cero." }, { status: 400 });
        }
        if (expectedErrorMonetary >= tolerableErrorMonetary) {
            return NextResponse.json({ error: "El error esperado debe ser menor que el error tolerable." }, { status: 400 });
        }

        // 4. Obtener factor de confianza CORREGIDO
        const currentConfidenceFactors = confidenceFactors[confidenceLevel];
        if (!currentConfidenceFactors) {
            return NextResponse.json({ error: "Nivel de confianza no válido." }, { status: 400 });
        }

        // Determinar índice basado en ERRORES ESPERADOS (no en porcentaje)
        const expectedErrorsCount = Math.min(Math.floor(expectedErrorMonetary / (tolerableErrorMonetary * 0.1)), 3);
        const confidenceFactor = currentConfidenceFactors[expectedErrorsCount] || currentConfidenceFactors[0];

        // 5. CÁLCULOS CORREGIDOS:

        // a) Tamaño de muestra (FÓRMULA CORRECTA)
        const newEstimatedSampleSize = Math.ceil(
            (estimatedPopulationValue * confidenceFactor) / tolerableErrorMonetary
        );

        // b) Intervalo muestral (FÓRMULA CORRECTA)
        const newSampleInterval = estimatedPopulationValue / newEstimatedSampleSize;
        //const newSampleInterval =tolerableErrorMonetary/confidenceFactor;

        // c) Suma de contaminaciones tolerables (FÓRMULA CORRECTA)
        const tolerableContaminationSum = tolerableErrorMonetary - expectedErrorMonetary;

        // d) Conclusión (TEXTO CORREGIDO)
        const conclusion =
            `La población podrá aceptarse a un nivel de confianza del ${confidenceLevel}% cuando no se observan más de ${expectedErrorsCount} error(es) en una muestra de tamaño ${newEstimatedSampleSize}. Este es el mínimo tamaño muestral que permite obtener la anterior conclusión.`;

        return NextResponse.json({
            estimatedPopulationValue,
            estimatedSampleSize: newEstimatedSampleSize,
            sampleInterval: newSampleInterval,
            tolerableContamination: tolerableContaminationSum, // ← NOMBRE ORIGINAL
            conclusion,
            confidenceFactorUsed: confidenceFactor,
            expectedErrorsCount: expectedErrorsCount,
        });
    } catch (error: any) {
        console.error('Error in planification API:', error);
        return NextResponse.json({ error: "Ocurrió un error en el servidor." }, { status: 500 });
    }
}