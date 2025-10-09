// utils/tables.ts

// ✅ TABLA CORREGIDA - Factores de confiabilidad de IDEA
export const confidenceFactors: { [confidenceLevel: number]: number } = {
    50: 0.70,
    55: 0.80,
    60: 0.92,
    65: 1.06,
    70: 1.21,
    75: 1.38,
    80: 1.61,  // ✅ Corregido: era 1.6
    85: 1.90,  // ✅ Corregido: era 1.9  
    90: 2.31,  // ✅ Corregido: era 2.3
    95: 3.00,  // ✅ Corregido: era 3.0
    98: 3.75,  // ✅ Corregido: era 3.7
    99: 4.61,  // ✅ Corregido: era 4.6
};

// ✅ NUEVA: Factores incrementales para Cell Evaluation (como IDEA)
export const incrementalFactors: { [confidenceLevel: number]: number[] } = {
    80: [1.61, 1.41, 1.28, 1.19, 1.13, 1.08, 1.04, 1.00, 0.97, 0.95],
    85: [1.90, 1.62, 1.44, 1.32, 1.23, 1.16, 1.11, 1.07, 1.04, 1.01],
    90: [2.31, 1.90, 1.61, 1.44, 1.33, 1.25, 1.19, 1.14, 1.10, 1.07],
    95: [3.00, 2.30, 1.94, 1.74, 1.60, 1.50, 1.42, 1.36, 1.31, 1.27],
    99: [4.61, 3.38, 2.76, 2.44, 2.24, 2.10, 1.99, 1.91, 1.84, 1.78]
};

// ✅ NUEVA: Factores para Stringer Bound
export const stringerBoundFactors: { [confidenceLevel: number]: number[] } = {
    80: [1.61, 0.67, 0.53, 0.45, 0.40, 0.36, 0.33, 0.31, 0.29, 0.27],
    85: [1.90, 0.75, 0.58, 0.49, 0.43, 0.39, 0.36, 0.33, 0.31, 0.29],
    90: [2.31, 0.85, 0.64, 0.54, 0.47, 0.42, 0.38, 0.35, 0.33, 0.31],
    95: [3.00, 1.00, 0.73, 0.60, 0.52, 0.46, 0.42, 0.39, 0.36, 0.34],
    99: [4.61, 1.36, 0.95, 0.77, 0.66, 0.58, 0.52, 0.48, 0.44, 0.41]
};

// Función para obtener el factor de confianza
export const getConfidenceFactor = (confidenceLevel: number): number => {
    return confidenceFactors[confidenceLevel] || confidenceFactors[90];
};

// ✅ NUEVA: Obtener factores incrementales
export const getIncrementalFactors = (confidenceLevel: number): number[] => {
    return incrementalFactors[confidenceLevel] || incrementalFactors[90];
};

// ✅ NUEVA: Obtener factores Stringer Bound
export const getStringerBoundFactors = (confidenceLevel: number): number[] => {
    return stringerBoundFactors[confidenceLevel] || stringerBoundFactors[90];
};

// Función para obtener los niveles de confianza disponibles
export const getAvailableConfidenceLevels = (): number[] => {
    return Object.keys(confidenceFactors).map(Number).sort((a, b) => a - b);
};

// ✅ NUEVA: Calcular Basic Precision como IDEA
export const calculateBasicPrecision = (confidenceLevel: number, sampleInterval: number): number => {
    const factor = getConfidenceFactor(confidenceLevel);
    return factor * sampleInterval;
};