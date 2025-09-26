// app/api/mum/planification/route.ts
import { NextResponse } from 'next/server';

// Factores de Confianza simplificados para el backend
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

        // 1. Calcular el valor total de la población
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
            // Si no se usa un campo de valor, la población es el número de registros
            estimatedPopulationValue = excelData.length;
        }

        // 2. Convertir los errores a valores monetarios si son porcentajes
        const tolerableErrorMonetary = errorType === "percentage"
            ? (tolerableError / 100) * estimatedPopulationValue
            : tolerableError;

        const expectedErrorMonetary = errorType === "percentage"
            ? (expectedError / 100) * estimatedPopulationValue
            : expectedError;

        // 3. Validaciones de negocio
        if (estimatedPopulationValue === 0) {
            return NextResponse.json({ error: "El valor de la población es cero." }, { status: 400 });
        }
        if (expectedErrorMonetary >= tolerableErrorMonetary) {
            return NextResponse.json({ error: "El error esperado debe ser menor que el error tolerable." }, { status: 400 });
        }

        // 4. Obtener el factor de confianza y calcular los resultados
        const currentConfidenceFactors = confidenceFactors[confidenceLevel];
        if (!currentConfidenceFactors) {
            return NextResponse.json({ error: "Nivel de confianza no válido." }, { status: 400 });
        }

        // Determinar el índice del factor de confianza basado en el error esperado
        const expectedErrorsCount = Math.min(Math.floor(expectedError / 10), 3);
        const confidenceFactor = currentConfidenceFactors?.[expectedErrorsCount] || confidenceFactors[95][0];

        // 5. Cálculos finales
        const newSampleInterval = tolerableErrorMonetary / confidenceFactor;
        const newEstimatedSampleSize = Math.ceil(estimatedPopulationValue / newSampleInterval);
        const newTolerableContamination = (confidenceFactor / newEstimatedSampleSize) * 100;

        const conclusion =
            `La población podrá aceptarse a un nivel de confianza del ${confidenceLevel}% cuando la proyección de los errores de la muestra no superen el ${newTolerableContamination.toFixed(2)}% del valor de la población.`;

        return NextResponse.json({
            estimatedPopulationValue,
            estimatedSampleSize: newEstimatedSampleSize,
            sampleInterval: newSampleInterval,
            tolerableContamination: newTolerableContamination,
            conclusion,
            minSampleSize: Math.ceil(newEstimatedSampleSize * 0.75),
        });
    } catch (error: any) {
        console.error('Error in planification API:', error);
        return NextResponse.json({ error: "Ocurrió un error en el servidor." }, { status: 500 });
    }
}