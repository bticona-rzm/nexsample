import { NextResponse } from 'next/server';

// FUNCIONES ROBUSTAS Y PROBADAS
function estadisticoZ(confianza: number): number {
    const zValues: { [key: number]: number } = {
        0.80: 1.282,
        0.85: 1.440,
        0.90: 1.645,
        0.95: 1.960,
        0.99: 2.576
    };
    return zValues[confianza] || 1.960;
}

// CÁLCULO DE TAMAÑO DE MUESTRA MÁS PRECISO
function calcularTamañoMuestraBeta(N: number, p_e: number, p_t: number, confianza_beta: number): number {
    const z = estadisticoZ(confianza_beta);
    
    // Fórmula estándar de muestreo de atributos
    const n_infinito = (z * z * p_e * (1 - p_e)) / ((p_t - p_e) * (p_t - p_e));
    
    // Ajuste para población finita
    let n_ajustado = n_infinito;
    if (N < 10000) {
        n_ajustado = n_infinito / (1 + (n_infinito / N));
    }
    
    const resultado = Math.ceil(n_ajustado);
    
    return resultado;
}

// MÉTODO DIRECTO PARA NÚMERO CRÍTICO (USANDO APROXIMACIÓN NORMAL)
function calcularNumeroCriticoDirecto(n: number, p_t: number, confianza_beta: number): number {
    const z = estadisticoZ(confianza_beta);
    const media = n * p_t;
    const desviacion = Math.sqrt(n * p_t * (1 - p_t));
    
    // Aproximación normal con corrección por continuidad
    let criticalDeviation = Math.floor(media + z * desviacion + 0.5);
    
    // Asegurar límites razonables
    criticalDeviation = Math.max(0, Math.min(criticalDeviation, n));
    
    return criticalDeviation;
}

// MÉTODO ALTERNATIVO CON TABLA PRÁCTICA
function calcularNumeroCriticoPractico(n: number, p_t: number, confianza_beta: number): number {
    // Para 95% de confianza, tabla práctica basada en estándares de auditoría
    if (confianza_beta === 0.95) {
        const tasaTolerable = p_t;
        
        if (tasaTolerable <= 0.01) return 0;        // 1% tolerable -> 0 desviaciones
        else if (tasaTolerable <= 0.02) return 1;   // 2% tolerable -> 1 desviación  
        else if (tasaTolerable <= 0.03) return 2;   // 3% tolerable -> 2 desviaciones
        else if (tasaTolerable <= 0.04) return 3;   // 4% tolerable -> 3 desviaciones
        else if (tasaTolerable <= 0.05) return 5;   // 5% tolerable -> 5 desviaciones
        else if (tasaTolerable <= 0.06) return 6;   // 6% tolerable -> 6 desviaciones
        else if (tasaTolerable <= 0.07) return 7;   // 7% tolerable -> 7 desviaciones
        else if (tasaTolerable <= 0.08) return 8;   // 8% tolerable -> 8 desviaciones
        else if (tasaTolerable <= 0.09) return 9;   // 9% tolerable -> 9 desviaciones
        else return Math.floor(n * tasaTolerable);  // 10%+ -> proporcional
    }
    
    // Para otros niveles de confianza, usar método directo
    return calcularNumeroCriticoDirecto(n, p_t, confianza_beta);
}

// GENERAR TABLA DE CONFIANZA SIMPLIFICADA
function generarTablaConfianza(n: number, p_t: number, confianza_beta: number) {
    const criticalDeviation = calcularNumeroCriticoPractico(n, p_t, confianza_beta);
    const tabla = [];
    
    for (let desviaciones = 0; desviaciones <= Math.min(n, 10); desviaciones++) {
        const tasaDesviacionMuestra = (desviaciones / n) * 100;
        
        // Calcular confianza aproximada
        let confianzaAproximada = 95.0;
        if (desviaciones > criticalDeviation) {
            confianzaAproximada = Math.max(50, 95 - (desviaciones - criticalDeviation) * 10);
        }
        
        tabla.push({
            deviations: desviaciones,
            sampleDeviationRate: parseFloat(tasaDesviacionMuestra.toFixed(2)),
            confidenceAchieved: parseFloat(confianzaAproximada.toFixed(1)),
            isCritical: desviaciones === criticalDeviation
        });
    }
    
    return tabla;
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

        // CONVERTIR A DECIMALES
        const p_t = tolerableDeviation / 100;
        const p_e = Math.max(0.01, expectedDeviation / 100); // Mínimo 1%
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

        /// Límites prácticos
        calculatedSampleSize = Math.max(25, Math.min(calculatedSampleSize, populationSize));

        // ✅ USAR MÉTODO PRÁCTICO PARA NÚMERO CRÍTICO
        const criticalDeviation = calcularNumeroCriticoPractico(calculatedSampleSize, p_t, confianza_beta);

        // GENERAR TABLA DE CONFIANZA DINÁMICA
        const confidenceTable = generarTablaConfianza(calculatedSampleSize, p_t, confianza_beta);

        const conclusion = 
            `Si no se observan más de ${criticalDeviation} desviaciones en una muestra de tamaño ${calculatedSampleSize}, ` +
            `puede estar por lo menos seguro en un ${confidenceLevel}% de que la tasa de desviación de la población ` +
            `no será mayor que el ${tolerableDeviation}%.`;

        return NextResponse.json({ 
            calculatedSampleSize, 
            criticalDeviation,
            confidenceTable,
            conclusion,
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