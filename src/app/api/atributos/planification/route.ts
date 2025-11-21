import { NextResponse } from 'next/server';
import { 
    estadisticoZ, 
    calcularTamañoMuestraBeta, 
    calcularNumeroCriticoPractico,
    generarTablaConfianza 
} from '@/lib/atributosCalculationService';

export async function POST(request: Request) {
    try {
        // ✅ RECIBIR JSON DIRECTAMENTE (sin FormData)
        const formData = await request.formData();
        const dataFile = formData.get('file') as File | null;
        const dataString = formData.get('data') as string | null;

        if (!dataFile || !dataString) {
            return NextResponse.json({ 
                error: "Archivo y datos de planificación requeridos." 
            }, { status: 400 });
        }

        const planificationData = JSON.parse(dataString);

        const { 
            populationSize, 
            tolerableDeviation, 
            confidenceLevel, 
            controlType = 'beta',
            expectedDeviation = 0,
            alphaConfidenceLevel = 5
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

        // ✅ USAR SERVICIO PARA CÁLCULOS
        const p_t = tolerableDeviation / 100;
        const p_e = Math.max(0.01, expectedDeviation / 100);
        const confianza_beta = confidenceLevel / 100;

        // CÁLCULO DE TAMAÑO DE MUESTRA
        let calculatedSampleSize: number;
        
        if (controlType === 'beta-alpha') {
            const confianza_alfa = alphaConfidenceLevel / 100;
            const z_beta = estadisticoZ(confianza_beta);
            const z_alfa = estadisticoZ(confianza_alfa);
            
            const n_infinito = Math.pow(
                (z_alfa * Math.sqrt(p_e * (1 - p_e)) + z_beta * Math.sqrt(p_t * (1 - p_t))) / (p_t - p_e), 
                2
            );
            
            calculatedSampleSize = Math.ceil(n_infinito / (1 + (n_infinito - 1) / populationSize));
        } else {
            calculatedSampleSize = calcularTamañoMuestraBeta(populationSize, p_e, p_t, confianza_beta);
        }

        // Límites prácticos
        calculatedSampleSize = Math.max(25, Math.min(calculatedSampleSize, populationSize));

        // ✅ USAR SERVICIO PARA NÚMERO CRÍTICO
        const criticalDeviation = calcularNumeroCriticoPractico(calculatedSampleSize, p_t, confianza_beta);

        // ✅ CALCULAR SEMILLA EN BACKEND
        const intervalo = populationSize / calculatedSampleSize;
        const semillaCalculada = Math.floor((intervalo * Date.now() + Math.floor(Math.random() * 10000)) % 1000000);

        return NextResponse.json({ 
            calculatedSampleSize, 
            criticalDeviation,
            semillaCalculada, // ✅ SEMILLA DESDE BACKEND
            populationSize,
            tolerableDeviation,
            confidenceLevel,
            expectedDeviation
        });

    } catch (error) {
        console.error("❌ Error en cálculo de planificación por atributos:", error);
        return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
    }
}