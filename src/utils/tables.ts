// utils/tables.ts

// ✅ FACTORES UNIFICADOS PARA TODOS LOS MÉTODOS
export const confidenceFactors: { [confidenceLevel: number]: number } = {
    50: 0.70,
    55: 0.80,
    60: 0.92,
    65: 1.06,
    70: 1.21,
    75: 1.38,
    80: 1.61,
    85: 1.90,
    90: 2.31,
    95: 3.00,
    98: 3.75,
    99: 4.61,
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

// ✅ INTERFACES UNIFICADAS
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

export interface HighValueErrors {
    count: number;
    overstatementCount: number;
    understatementCount: number;
    overstatementAmount: number;
    understatementAmount: number;
    totalErrorAmount: number;
}

// ✅ FUNCIONES UNIFICADAS

// Obtener factores para Cell & Classical
export const getCellClassicalFactors = (confidenceLevel: number): number[] => {
    return ideaCellClassicalFactors[confidenceLevel] || ideaCellClassicalFactors[90];
};

// Obtener factores para Stringer Bound
export const getStringerBoundFactors = (confidenceLevel: number): number[] => {
    return stringerBoundFactors[confidenceLevel] || stringerBoundFactors[90];
};

// Obtener factores incrementales
export const getIncrementalFactors = (confidenceLevel: number): number[] => {
    return incrementalFactors[confidenceLevel] || incrementalFactors[90];
};

// Función para obtener el factor de confianza básico
export const getConfidenceFactor = (confidenceLevel: number): number => {
    return confidenceFactors[confidenceLevel] || confidenceFactors[90];
};

// Función para obtener los niveles de confianza disponibles
export const getAvailableConfidenceLevels = (): number[] => {
    return Object.keys(confidenceFactors).map(Number).sort((a, b) => a - b);
};

// ✅ CALCULAR BASIC PRECISION (unificada)
export const calculateBasicPrecision = (confidenceLevel: number, sampleInterval: number): number => {
    const factor = getConfidenceFactor(confidenceLevel);
    return Math.round(factor * sampleInterval * 100) / 100;
};

// ✅ FUNCIÓN PARA DETECTAR ERRORES (unificada)
export const detectErrors = (sampleData: any[], sampleInterval: number): ProcessedError[] => {
    return sampleData
        .filter((item: any) => {
            const bookValue = Number(item.bookValue);
            const auditedValue = Number(item.auditedValue);
            
            if (isNaN(bookValue) || isNaN(auditedValue) || bookValue === 0) {
                return false;
            }
            
            const error = bookValue - auditedValue;
            return Math.abs(error) > (bookValue * 0.01) || Math.abs(error) > 0.01;
        })
        .map((item: any) => {
            const bookValue = Number(item.bookValue);
            const auditedValue = Number(item.auditedValue);
            const error = bookValue - auditedValue;
            const tainting = Math.min(Math.abs(error) / bookValue, 1);
            const projectedError = tainting * sampleInterval;
            
            return {
                reference: item.reference,
                bookValue,
                auditedValue,
                error,
                tainting: Math.round(tainting * 10000) / 10000,
                isOverstatement: error > 0,
                isUnderstatement: error < 0,
                projectedError: Math.round(projectedError * 100) / 100
            };
        });
};

// ✅ CALCULAR ERRORES EN ELEMENTOS DE VALOR ALTO (unificada)
export const calculateHighValueErrors = (highValueItems: any[]): HighValueErrors => {
    if (!highValueItems || highValueItems.length === 0) {
        return {
            count: 0,
            overstatementCount: 0,
            understatementCount: 0,
            overstatementAmount: 0,
            understatementAmount: 0,
            totalErrorAmount: 0
        };
    }

    const highValueErrors = highValueItems.filter((item: any) => {
        const bookValue = Number(item.bookValue);
        const auditedValue = Number(item.auditedValue);
        return !isNaN(bookValue) && !isNaN(auditedValue) && 
               Math.abs(bookValue - auditedValue) > 0.01;
    });

    const overstatementErrors = highValueErrors.filter((item: any) => 
        Number(item.bookValue) > Number(item.auditedValue)
    );
    const understatementErrors = highValueErrors.filter((item: any) => 
        Number(item.bookValue) < Number(item.auditedValue)
    );

    const overstatementAmount = overstatementErrors.reduce((sum: number, item: any) => 
        sum + (Number(item.bookValue) - Number(item.auditedValue)), 0
    );
    const understatementAmount = understatementErrors.reduce((sum: number, item: any) => 
        sum + (Number(item.auditedValue) - Number(item.bookValue)), 0
    );

    return {
        count: highValueErrors.length,
        overstatementCount: overstatementErrors.length,
        understatementCount: understatementErrors.length,
        overstatementAmount: Math.round(overstatementAmount * 100) / 100,
        understatementAmount: Math.round(understatementAmount * 100) / 100,
        totalErrorAmount: Math.round((overstatementAmount + understatementAmount) * 100) / 100
    };
};

// ✅ CALCULAR PRECISIÓN TOTAL (unificada)
export const calculatePrecisionTotal = (upperErrorLimit: number, mostLikelyError: number): number => {
    return Math.round((upperErrorLimit - mostLikelyError) * 100) / 100;
};

// ✅ CALCULAR PRECISION GAP WIDENING (unificada)
export const calculatePrecisionGapWidening = (
    upperErrorLimit: number, 
    basicPrecision: number, 
    mostLikelyError: number
): number => {
    const pgw = upperErrorLimit - basicPrecision - mostLikelyError;
    return Math.round(pgw * 100) / 100;
};