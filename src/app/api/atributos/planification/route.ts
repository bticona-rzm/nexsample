import { NextResponse } from 'next/server';

// Factores de Confianza basados en MUS (Classical PPS)
const CONFIDENCE_FACTORS_MUS: { 
    [confidenceLevel: number]: number[] 
} = {
    90: [2.31, 3.89, 5.33, 6.69],
    95: [3.00, 4.75, 6.30, 7.76],
    99: [4.61, 6.64, 8.41, 10.05],
};

export async function POST(request: Request) {
    try {
        const { 
            estimatedPopulationValue, 
            confidenceLevel, 
            errorType, 
            tolerableError, 
            expectedError,
            // ¡NUEVOS CAMPOS REQUERIDOS!
            excelData,
            useFieldValue,
        } = await request.json() as {
            estimatedPopulationValue: number;
            confidenceLevel: 90 | 95 | 99; 
            errorType: "importe" | "percentage"; 
            tolerableError: number;
            expectedError: number;
            // AÑADIR TIPOS PARA LOS DATOS RECIBIDOS
            excelData: any[]; // Usamos 'any[]' temporalmente o importamos 'ExcelRow[]'
            useFieldValue: boolean;
        };

        let finalPopulationValue: number;

        // 1. Determinar el Valor Final de la Población
        if (useFieldValue) {
            // Si se usa un campo de valor, se utiliza el valor calculado por el cliente
            // (que es el "estimatedPopulationValue" que ya viene en el payload).
            finalPopulationValue = estimatedPopulationValue;

        } else {
            // Si NO se usa un campo de valor, la población es el número de registros
            if (!excelData || !Array.isArray(excelData)) {
                return NextResponse.json({ error: "Datos de Excel no proporcionados o inválidos." }, { status: 400 });
            }
            // ESTA ES LA LÍNEA QUE FALLABA. Ahora 'excelData' debería estar definido.
            finalPopulationValue = excelData.length;
        }

        if (finalPopulationValue <= 0) {
            return NextResponse.json({ error: "El valor de la población debe ser mayor que cero." }, { status: 400 });
        }

        if (estimatedPopulationValue <= 0) {
            return NextResponse.json({ error: "El valor de la población debe ser mayor que cero." }, { status: 400 });
        }
        
        const currentConfidenceFactors = CONFIDENCE_FACTORS_MUS[confidenceLevel];
        if (!currentConfidenceFactors) {
            return NextResponse.json({ error: "Nivel de confianza no válido. Debe ser 90, 95 o 99." }, { status: 400 });
        }

        // 1. Convertir Errores a Valor Monetario
        const tolerableErrorMonetary = errorType === "percentage"
            ? (tolerableError / 100) * estimatedPopulationValue
            : tolerableError;
        
        const expectedErrorMonetary = errorType === "percentage"
            ? (expectedError / 100) * estimatedPopulationValue
            : expectedError;

        if (expectedErrorMonetary >= tolerableErrorMonetary) {
            return NextResponse.json({ error: "El error esperado debe ser menor que el error tolerable." }, { status: 400 });
        }
        
        // El factor de confianza se basa en el Error Esperado (para 0, 1, 2, 3 desviaciones esperadas)
        // La lógica del componente era: expectedErrorsCount = Math.min(Math.floor(expectedError / 10), 3)
        // Esto asume que el `expectedError` es un porcentaje y lo clasifica en 4 categorías:
        // 0-9.9%: factor[0] | 10-19.9%: factor[1] | 20-29.9%: factor[2] | 30%+: factor[3]
        
        // Para que sea más simple y alineado con MUS, usaremos el factor para 0 desviaciones (el primero).
        // Si el cliente necesita la lógica compleja (basada en el error esperado), el componente ya la tiene, 
        // pero para la **Planificación** inicial, usualmente se usa el factor de 0 desviaciones.
        
        const expectedErrorsCount = Math.min(Math.floor(expectedError / 10), currentConfidenceFactors.length - 1);
        const confidenceFactor = currentConfidenceFactors[expectedErrorsCount];

        // 2. Calcular Intervalo Muestral (Sampling Interval - SI)
        // SI = Error Tolerable Monetario / Factor de Confianza
        const sampleInterval = tolerableErrorMonetary / confidenceFactor;

        // 3. Calcular Tamaño de la Muestra (Estimated Sample Size - n)
        // n = Valor de Población / Intervalo Muestral
        const estimatedSampleSize = Math.ceil(estimatedPopulationValue / sampleInterval);

        // 4. Calcular Contaminación Tolerable (Tolerable Misstatement - TM)
        // TM = (Factor de Confianza / Tamaño de la Muestra) * 100%
        const tolerableContamination = (confidenceFactor / estimatedSampleSize) * 100;
        
        // 5. Conclusión
        const conclusion = 
            `La población podrá aceptarse a un nivel de confianza del ${confidenceLevel}% cuando la proyección de los errores de la muestra no superen el ${tolerableContamination.toFixed(2)}% del valor de la población.`;


        return NextResponse.json({
            estimatedSampleSize: estimatedSampleSize,
            sampleInterval: sampleInterval,
            tolerableContamination: tolerableContamination,
            minSampleSize: Math.ceil(estimatedSampleSize * 0.75), // Para dar un mínimo
            conclusion: conclusion,
        });

    } catch (error) {
        console.error("Error en el cálculo de planificación:", error);
        return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
    }
}