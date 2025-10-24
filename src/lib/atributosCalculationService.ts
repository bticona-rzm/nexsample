// ✅ LÓGICA DE NEGOCIO SEPARADA
export function estadisticoZ(confianza: number): number {
    const zValues: { [key: number]: number } = {
        0.80: 1.282,
        0.85: 1.440,
        0.90: 1.645,
        0.95: 1.960,
        0.99: 2.576
    };
    return zValues[confianza] || 1.960;
}

export function calcularTamañoMuestraBeta(N: number, p_e: number, p_t: number, confianza_beta: number): number {
    const z = estadisticoZ(confianza_beta);
    const n_infinito = (z * z * p_e * (1 - p_e)) / ((p_t - p_e) * (p_t - p_e));
    let n_ajustado = n_infinito;
    if (N < 10000) {
        n_ajustado = n_infinito / (1 + (n_infinito / N));
    }
    return Math.ceil(n_ajustado);
}

// MÉTODO DIRECTO PARA NÚMERO CRÍTICO (USANDO APROXIMACIÓN NORMAL)
export function calcularNumeroCriticoDirecto(n: number, p_t: number, confianza_beta: number): number {
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
export function calcularNumeroCriticoPractico(n: number, p_t: number, confianza_beta: number): number {
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
export function generarTablaConfianza(n: number, p_t: number, confianza_beta: number) {
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
