// /app/dashboard/atributos/components/constants.ts

export interface ConfidenceFactor {
    deviations: number; 
    factor: number;    
    confidence: number; // <<-- ¡DEBE SER NUMBER!
    target_deviation?: number; 
}

export const CONFIDENCE_FACTORS = [
    { deviations: 0, factor: 3.0, confidence: 95.00 },
    { deviations: 1, factor: 4.75, confidence: 94.97 },
    { deviations: 2, factor: 6.30, confidence: 94.99 },
    { deviations: 3, factor: 7.75, confidence: 94.99 },
    { deviations: 4, factor: 9.15, confidence: 94.99 },
    { deviations: 5, factor: 10.50, confidence: 94.99 },
    { deviations: 6, factor: 11.80, confidence: 94.99 },
    { deviations: 7, factor: 13.10, confidence: 94.99 },
    { deviations: 8, factor: 14.35, confidence: 94.99 },
    { deviations: 9, factor: 15.60, confidence: 94.99 },
    { deviations: 10, factor: 16.80, confidence: 94.99 },
];