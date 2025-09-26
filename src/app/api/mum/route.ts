import { NextResponse } from 'next/server';
import { jStat } from 'jstat'; // Requerida para la distribución Normal/T
import { ExcelRow } from '../../../lib/apiClient'; // Importa el tipo de datos

// Función para calcular el f   actor de confianza Z (a partir de la distribución Normal Estándar)
// Se usa la función de error inversa (erfInv) o la CDF inversa de la Normal.
const getConfidenceFactorZ = (confidenceLevel: number): number => {
    const alpha = 1 - (confidenceLevel / 100);
    // Para el cálculo bilateral (MUM es bilateral), usamos 1 - alpha/2
    const p = 1 - (alpha / 2); 
    
    // Asumiendo N grande, usamos la distribución Normal (Z-score)
    // jStat.normal.inv(p, mean, stddev) -> mean=0, stddev=1 para Z-score
    return jStat.normal.inv(p, 0, 1);
};

export async function POST(request: Request) {
    try {
        const {
            excelData,
            useFieldValue,
            selectedField,
            confidenceLevel,
            tolerableError,
            expectedError,
            precisionValue, // Usada si modifyPrecision es true
        } = await request.json() as {
            excelData: ExcelRow[];
            useFieldValue: boolean;
            selectedField: string | null;
            selectedPopulationType: "positive" | "negative" | "absolute";
            confidenceLevel: number;
            errorType: "importe" | "percentage";
            tolerableError: number;
            expectedError: number;
            modifyPrecision: boolean;
            precisionValue: number;
        };

        if (!selectedField) {
            return NextResponse.json({ error: "Debe seleccionar un campo de valor para la población." }, { status: 400 });
        }

        // 1. CÁLCULO DEL VALOR ESTIMADO DE LA POBLACIÓN (PopulationValue)
        const populationValue = excelData.reduce((sum, row) => {
            const value = row[selectedField] as number;
            // MUM generalmente usa valores absolutos del campo para calcular el total
            return sum + Math.abs(value); 
        }, 0);

        // 2. CÁLCULO DE FACTORES
        const Z = getConfidenceFactorZ(confidenceLevel);
        
        // El factor de contaminación tolerable de MUM se basa en la tabla de Poisson (similar a Atributos)
        // para k=0 y el nivel de confianza unilateral (1 - alpha). 
        // Usaremos una aproximación simple para k=0 o una tabla/función más precisa si se requiere.
        // Aquí usaremos la solución analítica:
        const poissonFactor = -Math.log(1 - (confidenceLevel / 100)); // Factor de confiabilidad para 0 errores (similar a -ln(alfa))
        
        // 3. CÁLCULO DE LA MUESTRA ESTIMADA (n)
        // Fórmula básica: n = (Z^2 * Precision^2) / TolerableError^2
        // Pero en MUM se calcula en base a factores de error (Z-score * Factor de Desviación Esperada)
        
        // Factor de precisión (A) para MUM
        // A = Z * DesviaciónEstándarPoblacional + (FactorPoisson - Z) * ExpectedErrorRate
        // Como no tenemos desviación estándar de la población, usamos la fórmula simplificada o el factor de precisión manual.
        
        // Usaremos la fórmula estándar para el tamaño de la muestra de MUM:
        // n = [ Z_score * (TolerableContaminationFactor + ExpectedErrorRate) ] / (TolerableErrorRate - ExpectedErrorRate)
        
        // Para simplificar, asumiremos que 'precisionValue' (que el usuario puede modificar) es la Precisión Bruta Deseada.
        // n = PrecisionBrutaDeseada / (TolerableErrorRate - ExpectedErrorRate) * Factor_Ajuste_Z
        
        // Mejor usamos la fórmula estándar de la AICPA:
        const TolerableErrorRate = tolerableError / 100; // Asumiendo que viene en %
        const ExpectedErrorRate = expectedError / 100; // Asumiendo que viene en %
        
        // 4. CÁLCULO DEL TAMAÑO DE LA MUESTRA ESTIMADO (n)
        // La fórmula de n es: n = (Factor de Confiabilidad para Errores Esperados) / (Tasa de Error Tolerable - Tasa de Error Esperado)
        // El "Factor de Confiabilidad para Errores Esperados" (Reliability Factor for Expected Errors)
        // se busca en tablas (basado en Poisson) para el número de errores esperados (ExpectedErrorRate * n), 
        // pero lo simplificaremos usando el factor de cero errores (poissonFactor) + un ajuste.
        
        // Para simplificar, usaremos un factor de precisión basado en la desviación estándar de la población (que es el valor de la población en MUM),
        // y el factor de confiabilidad Z para el nivel de confianza.
        
        let minSampleSize = 0; // Muestra mínima (basada en el factor de cero errores)
        let estimatedSampleSize = 0;
        
        // El factor de confiabilidad inicial (para 0 errores)
        const reliabilityFactor = poissonFactor; 
        
        // Muestra Mínima (n_min): 
        // n_min = ReliabilityFactor (k=0) / TolerableErrorRate
        minSampleSize = reliabilityFactor / TolerableErrorRate;
        
        // Muestra Estimada (n_est):
        // Usamos el factor de confiabilidad Z (para el error esperado) en el numerador
        // Nota: En la práctica real de MUM, se usa un factor de Poisson para el Expected Error.
        // Para simularlo, usamos una fórmula generalizada:
        estimatedSampleSize = reliabilityFactor / (TolerableErrorRate - ExpectedErrorRate);

        // Si la muestra calculada es muy pequeña o negativa (error esperado > tolerable), 
        // ajustamos al tamaño mínimo o a un valor alto.
        if (estimatedSampleSize < minSampleSize || isNaN(estimatedSampleSize) || estimatedSampleSize < 0) {
            estimatedSampleSize = minSampleSize > 0 ? minSampleSize : excelData.length;
        }

        // 5. CÁLCULO DEL INTERVALO DE MUESTREO (IM)
        // IM = PopulationValue / EstimatedSampleSize
        const sampleInterval = populationValue / estimatedSampleSize;

        // 6. CONCLUSIÓN (Simplificada)
        let conclusion = "Muestra calculada exitosamente.";
        if (TolerableErrorRate <= ExpectedErrorRate) {
            conclusion = "El error esperado es igual o mayor que el error tolerable. Se requiere una muestra del 100% o la población debe ser revisada.";
            estimatedSampleSize = excelData.length;
            minSampleSize = excelData.length;
        }

        return NextResponse.json({
            estimatedPopulationValue: populationValue,
            estimatedSampleSize: Math.ceil(estimatedSampleSize), // Redondear hacia arriba
            sampleInterval: sampleInterval,
            tolerableContamination: (1 - (confidenceLevel / 100)), // Alfa
            conclusion: conclusion,
            minSampleSize: Math.ceil(minSampleSize),
        });

    } catch (error: any) {
        console.error("Error en la planificación de MUM:", error);
        return new NextResponse(JSON.stringify({
            message: "Error al planificar el muestreo MUM.",
            error: error.message
        }), { status: 500 });
    }
}