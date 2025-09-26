// src/app/lib/mum/evaluation-interfaces.ts

// Configuración de la muestra enviada al backend
export interface SampleSettings {
    confidenceLevel: number;
    sampleInterval: number;
    highValueLimit: number;
    precisionValue: number; // Valor 'A' (precisión)
}

// Datos de entrada que el front-end enviará al back-end
export interface EvaluationInput {
    sampleSettings: SampleSettings;
    evaluationMethod: 'cell-classical' | 'stringer-bound'; // Clave para la lógica de negocio
    // Otros datos necesarios para la evaluación (ej. ID de sesión, ID de muestra, etc.)
}

// Resultados que el back-end devuelve
export interface EvaluationResult {
    confidenceLevel: number;
    sampleInterval: number;
    highValueLimit: number;
    precisionValue: number;
    populationExcludingHigh: number;
    highValueTotal: number;
    populationIncludingHigh: number;
    estimatedSampleSize: number;
    estimatedPopulationValue: number;
    numErrores: number; 
    errorMasProbableBruto: number; 
    errorMasProbableNeto: number; 
    precisionTotal: number; 
    limiteErrorSuperiorBruto: number; 
    limiteErrorSuperiorNeto: number; 
    highValueCountResume: number;
}