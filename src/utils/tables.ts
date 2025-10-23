// utils/tables.ts

// ✅ FACTORES BÁSICOS DE CONFIANZA (para todos los métodos)
export const confidenceFactors: { [confidenceLevel: number]: number } = {
    50: 0.70, 55: 0.80, 60: 0.92, 65: 1.06, 70: 1.21,
    75: 1.38, 80: 1.61, 85: 1.90, 90: 2.31, 95: 3.00,
    98: 3.75, 99: 4.61,
};

// ✅ FACTORES PARA MUESTREO POR ATRIBUTOS (Poisson)
export const attributesFactors: { deviations: number; factor: number; confidence: number }[] = [
    { deviations: 0, factor: 3.00, confidence: 95.00 },
    { deviations: 1, factor: 4.75, confidence: 94.97 },
    { deviations: 2, factor: 6.30, confidence: 94.99 },
    { deviations: 3, factor: 7.76, confidence: 94.99 },
    { deviations: 4, factor: 9.16, confidence: 94.99 },
    { deviations: 5, factor: 10.52, confidence: 94.99 },
    { deviations: 6, factor: 11.85, confidence: 94.99 },
    { deviations: 7, factor: 13.15, confidence: 94.99 },
    { deviations: 8, factor: 14.44, confidence: 94.99 },
    { deviations: 9, factor: 15.71, confidence: 94.99 },
    { deviations: 10, factor: 16.97, confidence: 94.99 },
];

// ✅ FACTORES MUS (Monetary Unit Sampling) para planificación
export const musPlanificationFactors: { [confidenceLevel: number]: number[] } = {
    75: [1.39, 1.85, 2.23, 2.57],
    80: [1.61, 2.09, 2.48, 2.83],
    85: [1.90, 2.39, 2.79, 3.16],
    90: [2.31, 2.80, 3.22, 3.61],
    95: [3.00, 3.47, 3.88, 4.25],
    99: [4.61, 4.98, 5.32, 5.64],
};

// ✅ FACTORES DE IDEA PARA CELL & CLASSICAL (completos)
export const ideaCellClassicalFactors: { [confidenceLevel: number]: number[] } = {
    80: [1.61, 3.00, 4.28, 5.52, 6.73, 7.91, 9.08, 10.24, 11.38, 12.52],
    85: [1.90, 3.38, 4.72, 5.99, 7.22, 8.43, 9.62, 10.80, 11.97, 13.13],
    90: [2.2504, 3.7790, 5.3332, 6.8774, 8.4164, 9.9151, 11.4279, 12.9302, 14.4330, 15.9344],
    95: [3.00, 4.75, 6.30, 7.76, 9.16, 10.52, 11.85, 13.15, 14.44, 15.71],
    99: [4.61, 6.64, 8.41, 10.05, 11.61, 13.11, 14.57, 16.00, 17.40, 18.78]
};

// ✅ FACTORES INCREMENTALES PARA CELL EVALUATION
export const incrementalFactors: { [confidenceLevel: number]: number[] } = {
    80: [1.61, 1.41, 1.28, 1.19, 1.13, 1.08, 1.04, 1.00, 0.97, 0.95],
    85: [1.90, 1.62, 1.44, 1.32, 1.23, 1.16, 1.11, 1.07, 1.04, 1.01],
    90: [2.31, 1.90, 1.61, 1.44, 1.33, 1.25, 1.19, 1.14, 1.10, 1.07],
    95: [3.00, 2.30, 1.94, 1.74, 1.60, 1.50, 1.42, 1.36, 1.31, 1.27],
    99: [4.61, 3.38, 2.76, 2.44, 2.24, 2.10, 1.99, 1.91, 1.84, 1.78]
};

// ✅ FACTORES PARA STRINGER BOUND
export const stringerBoundFactors: { [confidenceLevel: number]: number[] } = {
    80: [1.61, 0.67, 0.53, 0.45, 0.40, 0.36, 0.33, 0.31, 0.29, 0.27],
    85: [1.90, 0.75, 0.58, 0.49, 0.43, 0.39, 0.36, 0.33, 0.31, 0.29],
    90: [2.31, 0.85, 0.64, 0.54, 0.47, 0.42, 0.38, 0.35, 0.33, 0.31],
    95: [3.00, 1.00, 0.73, 0.60, 0.52, 0.46, 0.42, 0.39, 0.36, 0.34],
    99: [4.61, 1.36, 0.95, 0.77, 0.66, 0.58, 0.52, 0.48, 0.44, 0.41]
};

// ✅ INTERFACES BÁSICAS
export interface ProcessedError {
    reference: string;
    bookValue: number;
    auditedValue: number;
    error: number;
    tainting: number;
    isOverstatement: boolean;
    isUnderstatement: boolean;
    projectedError: number;
}

export interface StageData {
    stage: number;
    uelFactor: number;
    tainting: number;
    averageTainting: number;
    previousUEL: number;
    loadingPropagation: number;
    simplePropagation: number;
    maxStageUEL: number;
}

export interface AttributesConfidenceFactor {
    deviations: number;
    factor: number;
    confidence: number;
}

// ✅ FUNCIONES DE ACCESO A TABLAS (UNIFICADAS)

// Factores básicos de confianza
export const getConfidenceFactor = (confidenceLevel: number): number => {
    return confidenceFactors[confidenceLevel] || confidenceFactors[90];
};

// Factores para Muestreo por Atributos
export const getAttributesFactors = (): AttributesConfidenceFactor[] => {
    return attributesFactors;
};

export const getAttributesFactorForConfidence = (confidenceLevel: number): number => {
    const factor = attributesFactors.find(f => f.confidence >= confidenceLevel);
    return factor ? factor.factor : attributesFactors[0].factor;
};

export const getCriticalDeviationForConfidence = (confidenceLevel: number): number => {
    const factor = attributesFactors.find(f => f.confidence >= confidenceLevel);
    return factor ? factor.deviations : 0;
};

// Factores para MUS (Planificación)
export const getMusPlanificationFactors = (confidenceLevel: number): number[] => {
    return musPlanificationFactors[confidenceLevel] || musPlanificationFactors[90];
};

export const getMusPlanificationFactor = (confidenceLevel: number, expectedErrorsCount: number = 0): number => {
    const factors = getMusPlanificationFactors(confidenceLevel);
    return factors[Math.min(expectedErrorsCount, factors.length - 1)] || factors[0];
};

// Factores para Cell & Classical (ya existentes)
export const getCellClassicalFactors = (confidenceLevel: number): number[] => {
    return ideaCellClassicalFactors[confidenceLevel] || ideaCellClassicalFactors[90];
};

// Factores para Stringer Bound (ya existentes)
export const getStringerBoundFactors = (confidenceLevel: number): number[] => {
    return stringerBoundFactors[confidenceLevel] || stringerBoundFactors[90];
};

// Factores incrementales (ya existentes)
export const getIncrementalFactors = (confidenceLevel: number): number[] => {
    return incrementalFactors[confidenceLevel] || incrementalFactors[90];
};

// Niveles de confianza disponibles
export const getAvailableConfidenceLevels = (): number[] => {
    return Object.keys(confidenceFactors).map(Number).sort((a, b) => a - b);
};

export const getAvailableMusConfidenceLevels = (): number[] => {
    return Object.keys(musPlanificationFactors).map(Number).sort((a, b) => a - b);
};