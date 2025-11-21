import { NextResponse } from 'next/server';
import { 
    getAttributesFactors,
    getAttributesFactorForConfidence,
    getCriticalDeviationForConfidence 
} from '@/utils/tables';

// ✅ LÓGICA DE NEGOCIO EN BACKEND
export function calcularSemillaIDEA(intervaloMuestreo: number, poblacionTotal: number): number {
    const timestamp = Date.now();
    const factorUnico = Math.floor(Math.random() * 10000);
    const semilla = (intervaloMuestreo * timestamp + factorUnico) % 1000000;
    return Math.floor(semilla);
}

export function calcularIntervaloMuestreo(poblacionSize: number, muestraSize: number): number {
    if (muestraSize <= 0 || poblacionSize <= 0) return 0;
    return poblacionSize / muestraSize;
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const dataFile = formData.get('file') as File | null;
        const dataString = formData.get('data') as string | null;

        if (!dataFile || !dataString) {
            return NextResponse.json({ 
                error: "Archivo y datos de planificación requeridos." 
            }, { status: 400 });
        }

        const planificationData = JSON.parse(dataString.toString());
        console.log("Planification Data:", planificationData);

        const { 
            populationSize, 
            tolerableDeviation, 
            confidenceLevel, 
            controlType, 
            expectedDeviation 
        } = planificationData;

        // Validaciones
        if (!populationSize || populationSize <= 0) {
            return NextResponse.json({ error: "El tamaño de la población debe ser mayor a 0." }, { status: 400 });
        }
        if (!tolerableDeviation || tolerableDeviation <= 0 || tolerableDeviation > 100) {
            return NextResponse.json({ error: "La desviación tolerable debe estar entre 0.01% y 100%." }, { status: 400 });
        }
        if (!confidenceLevel || confidenceLevel <= 0 || confidenceLevel > 100) {
            return NextResponse.json({ error: "El nivel de confianza debe estar entre 1% y 100%." }, { status: 400 });
        }

        // ✅ USAR TABLAS CENTRALIZADAS
        const baseFactor = getAttributesFactorForConfidence(confidenceLevel);
        console.log("Base Factor (desde tables.ts):", baseFactor);

        // Cálculos
        const tolerableDeviationRate = tolerableDeviation / 100;
        const expectedDeviationRate = expectedDeviation / 100;

        let divisor: number;
        
        if (controlType === 'beta' || !controlType) {
            divisor = tolerableDeviationRate;
        } else {
            divisor = tolerableDeviationRate - expectedDeviationRate;
        }

        if (divisor <= 0) {
            return NextResponse.json({ 
                error: `La desviación tolerable (${tolerableDeviation}%) debe ser mayor que la desviación esperada (${expectedDeviation}%).` 
            }, { status: 400 });
        }

        let calculatedSampleSize = Math.ceil(baseFactor / divisor);
        
        // Aplicar FPC si es significativo
        if (calculatedSampleSize > 0.05 * populationSize) {
            const fpc = Math.sqrt((populationSize - calculatedSampleSize) / (populationSize - 1));
            calculatedSampleSize = Math.ceil(calculatedSampleSize * fpc);
        }

        // Ajustes finales
        if (calculatedSampleSize > populationSize) {
            calculatedSampleSize = populationSize;
        }
        if (calculatedSampleSize < 1) {
            calculatedSampleSize = 1;
        }

        // ✅ USAR FUNCIÓN CENTRALIZADA
        const finalCriticalDeviation = getCriticalDeviationForConfidence(confidenceLevel);

        console.log("Resultados finales:", {
            muestra: calculatedSampleSize,
            desviacionesCriticas: finalCriticalDeviation,
            confianzaObjetivo: confidenceLevel
        });

        return NextResponse.json({ 
            calculatedSampleSize, 
            criticalDeviation: finalCriticalDeviation 
        });

    } catch (error) {
        console.error("Error en cálculo de planificación por atributos:", error);
        return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
    }
}