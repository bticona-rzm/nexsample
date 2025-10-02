// utils/tables.ts

// Tabla de factores de confianza para 0 errores esperados
export const confidenceFactors: { [confidenceLevel: number]: number } = {
    50: 0.7,
    55: 0.8,
    60: 0.9,
    65: 1.1,
    70: 1.2,
    75: 1.4,
    80: 1.6,
    85: 1.9,
    90: 2.3,
    95: 3.0,
    98: 3.7,
    99: 4.6,
};

// Función para obtener el factor de confianza
export const getConfidenceFactor = (confidenceLevel: number): number => {
    return confidenceFactors[confidenceLevel] || confidenceFactors[90]; // Default 90%
};

// Función para obtener los niveles de confianza disponibles
export const getAvailableConfidenceLevels = (): number[] => {
    return Object.keys(confidenceFactors).map(Number).sort((a, b) => a - b);
};