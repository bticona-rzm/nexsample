import { NextResponse } from 'next/server';
import { jStat } from 'jstat';

// Constante para la precisión de la búsqueda (0.0001 = 0.01%)
const SEARCH_TOLERANCE = 0.0001; 

/**
 * Busca la tasa media de Poisson (lambda) que satisface P(X <= k) = P_target.
 * Se usa para encontrar los límites superiores de confianza.
 * @param k - Desviaciones observadas (observedDeviations)
 * @param P_target - Probabilidad acumulada deseada (e.g., 1 - alpha)
 */
const findLambdaUpper = (k: number, P_target: number): number => {
    // Si hay 0 desviaciones, usamos la solución analítica: -ln(1 - P_target)
    // Esto es mucho más estable y evita la búsqueda.
    if (k === 0) {
        return -Math.log(1 - P_target);
    }
    
    // Si k > 0, usamos búsqueda por bisección
    let low = 0;
    // Límite superior de búsqueda ajustado: (k + 1) * 3 veces el factor inicial, 
    // pero con un máximo de 1000 para prevenir valores absurdamente altos.
    let high = Math.min(1000, (k + 1) * 50); 
    let lambda = 0;

    for (let i = 0; i < 100; i++) { // Límite de 100 iteraciones para la convergencia
        lambda = (low + high) / 2;
        const cdf = jStat.poisson.cdf(k, lambda);
        
        if (Math.abs(cdf - P_target) < SEARCH_TOLERANCE) {
            return lambda;
        }
        
        if (cdf < P_target) {
            low = lambda; // Necesitamos un lambda mayor (mayor media -> menor cola superior)
        } else {
            high = lambda; // Necesitamos un lambda menor
        }
    }
    return lambda; // Devolver el mejor estimado
};

/**
 * Busca la tasa media de Poisson (lambda) que satisface P(X < k) = P_target.
 * Se usa para encontrar el límite inferior de confianza.
 * @param k - Desviaciones observadas (observedDeviations)
 * @param P_target - Probabilidad acumulada deseada (e.g., alpha/2)
 */
const findLambdaLower = (k: number, P_target: number): number => {
    // Si hay 0 desviaciones, el límite inferior de la tasa de error es 0.
    if (k <= 0) return 0;
    
    // Para P(X < k), usamos P(X <= k-1). 
    const k_prime = k - 1; 

    // Aquí usamos el algoritmo de búsqueda para el límite inferior (lambda_BUS), 
    // donde la probabilidad P_target está en la cola inferior.
    
    let low = 0;
    let high = Math.min(1000, (k_prime + 1) * 50); // Ajustamos el límite superior de la búsqueda
    let lambda = 0;

    for (let i = 0; i < 100; i++) {
        lambda = (low + high) / 2;
        // P_target ahora es la probabilidad de la cola *izquierda*
        const cdf = jStat.poisson.cdf(k_prime, lambda); 
        
        if (Math.abs(cdf - P_target) < SEARCH_TOLERANCE) {
            return lambda;
        }
        
        // En este caso, si cdf < P_target, el lambda es muy pequeño y necesitamos un lambda mayor
        if (cdf < P_target) {
            low = lambda; 
        } else {
            high = lambda; 
        }
    }
    return lambda; // Devolver el mejor estimado
};


export async function POST(request: Request) {
    try {
        const {
            evaluatedSampleSize,
            observedDeviations,
            desiredConfidence,
        } = await request.json() as {
            evaluatedSampleSize: number;
            observedDeviations: number;
            desiredConfidence: number;
        };

        if (evaluatedSampleSize <= 0) {
             return NextResponse.json({ error: "El tamaño de la muestra debe ser mayor a cero." }, { status: 400 });
        }

        // 1. Tasa de desviación de la muestra (porcentaje)
        const sampleDeviationRate = (observedDeviations / evaluatedSampleSize) * 100;

        // 2. Definición de Alfa
        const confidenceFactor = desiredConfidence / 100;
        const alpha = 1 - confidenceFactor;

        // --- CÁLCULO DE LÍMITES DE CONFIANZA ---
        // A. Límite unilateral superior
        // P(X <= observedDeviations | lambda_UL) = 1 - alpha
        const lambdaUL = findLambdaUpper(observedDeviations, 1 - alpha);
        const unilateralUpperLimit = (lambdaUL / evaluatedSampleSize) * 100;

        // B. Límites bilaterales
        const alphaBilateral = alpha / 2;
        
        // Límite Bilateral Superior: P(X <= observedDeviations | lambda_BUS) = 1 - alpha/2
        const lambdaBUS = findLambdaUpper(observedDeviations, 1 - alphaBilateral);
        const bilateralUpperLimit = (lambdaBUS / evaluatedSampleSize) * 100;

        // Límite Bilateral Inferior: P(X < observedDeviations | lambda_BLI) = alpha/2
        const lambdaBLI = findLambdaLower(observedDeviations, alphaBilateral);
        const bilateralLowerLimit = (lambdaBLI / evaluatedSampleSize) * 100;
        
        // Asegurar que el límite inferior no sea negativo
        const finalBilateralLowerLimit = Math.max(0, bilateralLowerLimit);

        return NextResponse.json({
            sampleDeviationRate,
            unilateralUpperLimit,
            bilateralLowerLimit: finalBilateralLowerLimit,
            bilateralUpperLimit,
        });
    } catch (error: any) {
        console.error("Error en la evaluación de la muestra:", error);
        return new NextResponse(JSON.stringify({
            message: "Error al evaluar la muestra.",
            error: error.message || "Error desconocido."
        }), { status: 500 });
    }
}