// /api/atributos/evaluar/route.ts - VERSIÓN MEJORADA
import { NextResponse } from 'next/server';
import { jStat } from 'jstat';

// ✅ CONSTANTES MEJORADAS
const SEARCH_TOLERANCE = 1e-6; // Mayor precisión
const MAX_ITERATIONS = 1000;   // Más iteraciones para convergencia
const MAX_LAMBDA = 1000;       // Límite razonable para lambda

/**
 * ✅ FUNCIÓN MEJORADA - Límite superior de Poisson
 * Encuentra lambda tal que P(X ≤ k) = targetProbability
 */
const findPoissonUpperLimit = (k: number, targetProbability: number): number => {
    // ✅ CASO ESPECIAL: k = 0 (solución analítica)
    if (k === 0) {
        return -Math.log(1 - targetProbability);
    }
    
    // ✅ BÚSQUEDA POR BISECCIÓN MEJORADA
    let lowerBound = 0;
    let upperBound = Math.min(MAX_LAMBDA, (k + 1) * 10);
    let lambda = 0;

    for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
        lambda = (lowerBound + upperBound) / 2;
        const currentCDF = jStat.poisson.cdf(k, lambda);
        const error = currentCDF - targetProbability;
        
        if (Math.abs(error) < SEARCH_TOLERANCE) {
            return lambda;
        }
        
        if (error < 0) {
            lowerBound = lambda; // CDF muy pequeño, necesitamos lambda mayor
        } else {
            upperBound = lambda; // CDF muy grande, necesitamos lambda menor
        }
    }
    
    console.warn(`Búsqueda de límite superior no convergió después de ${MAX_ITERATIONS} iteraciones`);
    return lambda;
};

/**
 * ✅ FUNCIÓN MEJORADA - Límite inferior de Poisson  
 * Encuentra lambda tal que P(X ≤ k-1) = targetProbability
 */
const findPoissonLowerLimit = (k: number, targetProbability: number): number => {
    // ✅ CASO ESPECIAL: k = 0 (límite inferior es 0)
    if (k === 0) {
        return 0;
    }
    
    // Para límite inferior: P(X ≤ k-1) = targetProbability
    const kAdjusted = k - 1;
    
    let lowerBound = 0;
    let upperBound = Math.min(MAX_LAMBDA, (kAdjusted + 1) * 10);
    let lambda = 0;

    for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
        lambda = (lowerBound + upperBound) / 2;
        const currentCDF = jStat.poisson.cdf(kAdjusted, lambda);
        const error = currentCDF - targetProbability;
        
        if (Math.abs(error) < SEARCH_TOLERANCE) {
            return lambda;
        }
        
        if (error < 0) {
            lowerBound = lambda; // CDF muy pequeño
        } else {
            upperBound = lambda; // CDF muy grande
        }
    }
    
    console.warn(`Búsqueda de límite inferior no convergió después de ${MAX_ITERATIONS} iteraciones`);
    return lambda;
};

/**
 * ✅ FUNCIÓN VALIDACIÓN - Verifica parámetros de entrada
 */
const validateEvaluationParameters = (
    evaluatedSampleSize: number, 
    observedDeviations: number, 
    desiredConfidence: number
): string | null => {
    if (!evaluatedSampleSize || evaluatedSampleSize <= 0) {
        return "El tamaño de la muestra evaluada debe ser mayor a 0.";
    }
    
    if (observedDeviations < 0) {
        return "El número de desviaciones observadas no puede ser negativo.";
    }
    
    if (observedDeviations > evaluatedSampleSize) {
        return `Las desviaciones observadas (${observedDeviations}) no pueden exceder el tamaño de la muestra (${evaluatedSampleSize}).`;
    }
    
    if (!desiredConfidence || desiredConfidence <= 0 || desiredConfidence >= 100) {
        return "El nivel de confianza debe estar entre 0.01% y 99.99%.";
    }
    
    return null;
};

export async function POST(request: Request) {
    try {
        const {
            evaluatedSampleSize,
            observedDeviations,
            desiredConfidence,
        } = await request.json();

        // ✅ VALIDACIÓN MEJORADA
        const validationError = validateEvaluationParameters(
            evaluatedSampleSize, 
            observedDeviations, 
            desiredConfidence
        );
        
        if (validationError) {
            return NextResponse.json({ error: validationError }, { status: 400 });
        }

        // ✅ 1. TASA DE DESVIACIÓN DE LA MUESTRA
        const sampleDeviationRate = (observedDeviations / evaluatedSampleSize) * 100;

        // ✅ 2. CÁLCULO DE PARÁMETROS ESTADÍSTICOS
        const confidenceLevel = desiredConfidence / 100;
        const alpha = 1 - confidenceLevel;
        
        // ✅ 3. LÍMITES DE CONFIANZA MEJORADOS
        
        // A. Límite Unilateral Superior (Upper Limit)
        // P(X ≤ observedDeviations) = 1 - alpha
        const lambdaUL = findPoissonUpperLimit(observedDeviations, 1 - alpha);
        const unilateralUpperLimit = (lambdaUL / evaluatedSampleSize) * 100;

        // B. Límites Bilaterales
        const alphaHalf = alpha / 2;
        
        // Límite Bilateral Superior
        // P(X ≤ observedDeviations) = 1 - alpha/2
        const lambdaBUS = findPoissonUpperLimit(observedDeviations, 1 - alphaHalf);
        const bilateralUpperLimit = (lambdaBUS / evaluatedSampleSize) * 100;

        // Límite Bilateral Inferior
        // P(X ≤ observedDeviations - 1) = alpha/2
        const lambdaBLI = findPoissonLowerLimit(observedDeviations, alphaHalf);
        const bilateralLowerLimit = Math.max(0, (lambdaBLI / evaluatedSampleSize) * 100);

        // ✅ 4. RESULTADOS CON PRECISIÓN CONTROLADA
        const results = {
            // Datos de entrada
            inputParameters: {
                sampleSize: evaluatedSampleSize,
                observedDeviations,
                confidenceLevel: desiredConfidence
            },
            // Resultados principales
            sampleDeviationRate: Math.round(sampleDeviationRate * 100) / 100,
            unilateralUpperLimit: Math.round(unilateralUpperLimit * 100) / 100,
            bilateralLowerLimit: Math.round(bilateralLowerLimit * 100) / 100,
            bilateralUpperLimit: Math.round(bilateralUpperLimit * 100) / 100,
            // Información adicional
            statisticalParameters: {
                alpha,
                alphaHalf,
                lambdaUL: Math.round(lambdaUL * 1000) / 1000,
                lambdaBUS: Math.round(lambdaBUS * 1000) / 1000,
                lambdaBLI: Math.round(lambdaBLI * 1000) / 1000
            }
        };

        console.log("Resultados de evaluación:", results);

        return NextResponse.json(results);

    } catch (error: any) {
        console.error("Error en evaluación de muestra:", error);
        return NextResponse.json({ 
            error: "Error interno del servidor durante la evaluación estadística.",
            details: error.message 
        }, { status: 500 });
    }
}