// /lib/apiClient.ts
import * as XLSX from 'xlsx';

// --- TIPOS UNIFICADOS ---

export type ExcelRow = Record<string, string | number | null>;

export type PopulationType = "positive" | "negative" | "absolute";
export type ErrorType = "importe" | "percentage";
export type PrecisionLimits = 'upper' | 'upper-lower';
export type EvaluationMethod = 'cell' | 'classical-pps' | 'stringer-bound';

// --- INTERFACES PRINCIPALES ---

interface BasePlanificationParams {
    confidenceLevel: number;
    errorType: ErrorType;
    tolerableError: number;
    expectedError: number;
}

export interface FetchDataResponse {
    headers: string[];
    data: ExcelRow[];
}

export interface MumPlanificationParams extends BasePlanificationParams {
    excelData: ExcelRow[];
    useFieldValue: boolean;
    selectedField: string | null;
    selectedPopulationType: PopulationType;
    modifyPrecision: boolean;
    precisionValue: number;
    populationSize: number;
    expectedDeviation: number;
    tolerableDeviation: number;
    alphaConfidenceLevel: number;
    controlType: string;
}

export interface IdeaPlanificationParams extends BasePlanificationParams {
    excelData: ExcelRow[];
    useFieldValue: boolean;
    selectedField: string | null;
    selectedPopulationType: PopulationType;
    estimatedPopulationValue?: number;
}

interface EvaluationParams {
    evaluatedSampleSize: number;
    observedDeviations: number;
    desiredConfidence: number;
}

export interface MumEvaluationData {
    method: EvaluationMethod;
    fields: {
        bookValue: string;
        auditedValue: string;
        reference?: string;
    };
    sampleSettings: {
        confidenceLevel: number;
        populationValue: number;
        sampleSize: number;
        precisionPricing?: number;
        sampleInterval?: number;
    };
    highValueHandling: {
        isFile: boolean;
        filePath?: string;
        bookValueHigh?: string;
        auditedValueHigh?: string;
        referenceHigh?: string;
        highValueItems?: any[];
    };
    precisionLimits: PrecisionLimits;
    resultName: string;
    sampleData: any[];
    populationExcludingHigh?: number;
    highValueTotal?: number;
    highValueCountResume?: number;
}

interface PlanificationResult {
    estimatedPopulationValue: number;
    estimatedSampleSize: number;
    sampleInterval: number;
    tolerableContamination: number;
    conclusion: string;
    minSampleSize: number;
    randomStartPoint?: number;
    highValueLimit?: number;
}

export interface EvaluationResult {
    confidenceLevel: number;
    sampleInterval: number;
    highValueLimit: number;
    precisionValue: number;
    populationExcludingHigh: number;
    highValueTotal: number;
    populationIncludingHigh: number;
    estimatedSampleSize: number;
    numErrores: number;
    errorMasProbableBruto: number;
    errorMasProbableNeto: number;
    precisionTotal: number;
    limiteErrorSuperiorBruto: number;
    limiteErrorSuperiorNeto: number;
    highValueCountResume: number;
    sampleDeviationRate?: number;
    unilateralUpperLimit?: number;
    bilateralLowerLimit?: number;
    bilateralUpperLimit?: number;
    // Datos específicos de métodos
    cellClassicalData?: any;
    stringerBoundData?: any;
}

// --- FUNCIONES DE ARCHIVOS ---

/**
 * Función para cargar y procesar un archivo en el backend
 */
/**
 * ✅ Función ORIGINAL - solo datos
 */
export const fetchData = async (file: File): Promise<ExcelRow[]> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", { 
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Respuesta del servidor:", errorText);
        throw new Error('Error al cargar el archivo en el servidor.');
    }
    
    const data = await response.json();
    return data as ExcelRow[];
};

/**
 * ✅ NUEVA función con headers y datos
 */
export const fetchDataWithHeaders = async (file: File): Promise<FetchDataResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", { 
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Respuesta del servidor:", errorText);
        throw new Error('Error al cargar el archivo en el servidor.');
    }
    
    const result = await response.json();
    
    // Si el backend ya devuelve headers, usarlos
    if (result.headers && result.data) {
        return {
            headers: result.headers,
            data: result.data as ExcelRow[]
        };
    } else {
        // Si no, extraer headers de los datos
        const data = result as ExcelRow[];
        const headers = data.length > 0 ? Object.keys(data[0]) : [];
        return {
            headers,
            data
        };
    }
};
/**
 * Leer archivo Excel directamente en el frontend
 */
export const readExcelFile = (file: File): Promise<ExcelRow[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                
                // ✅ CORRECCIÓN: Type assertion para unknown[] -> ExcelRow[]
                const typedData = jsonData as ExcelRow[];
                resolve(typedData);
                
            } catch (error) {
                reject(new Error('Error leyendo archivo Excel: ' + error));
            }
        };
        
        reader.onerror = () => reject(new Error('Error leyendo archivo'));
        reader.readAsArrayBuffer(file);
    });
};

// --- FUNCIONES DE FORMATEO ---

/**
 * Función para formatear números con separadores de miles y decimales
 */
export const formatNumber = (value: number, decimals: number = 2): string => {
    if (value === null || value === undefined || isNaN(value)) {
        return '0.00';
    }
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value);
};

/**
 * Parseo para formato inglés
 */
const parseFormattedNumber = (value: string): number => {
    if (!value) return 0;
    const cleanedValue = value.replace(/,/g, '');
    const parsed = parseFloat(cleanedValue);
    return isNaN(parsed) ? 0 : parsed;
};

/**
 * Función específica para errores que dependen del tipo
 */
export const formatErrorValue = (value: number, isPercentage: boolean): string => {
    return formatNumber(value, isPercentage ? 2 : 0);
};

/**
 * Función para manejar el cambio en los inputs de error
 */
export const handleErrorChange = (
    value: string, 
    setter: (value: number) => void, 
    isPercentage: boolean
): void => {
    const parsed = parseFormattedNumber(value);
    if (!isNaN(parsed)) {
        setter(parsed);
    }
};

// --- API CLIENT UNIFICADO ---

export const apiClient = {
    // ✅ MUESTREO POR ATRIBUTOS
    atributos: {
        planification: async (planificationData: any, dataFile: File | null) => {
            if (!dataFile) {
                throw new Error('Debe proporcionar un archivo de datos para la planificación.');
            }
            
            const formData = new FormData();
            formData.append('file', dataFile);
            formData.append('data', JSON.stringify(planificationData));

            const response = await fetch('/api/atributos/planification', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const status = response.status;
                let errorMessage = 'El servidor no pudo procesar la solicitud.';

                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } catch (e) {
                    // Mantener mensaje por defecto
                }
                
                throw new Error(`Error en la planificación (HTTP ${status}): ${errorMessage}`);
            }

            return response.json();
        },

        createRandomSample: async (sampleData: any) => {
            const response = await fetch('/api/atributos/aleatorio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sampleData),
            });

            if (!response.ok) {
                // ✅ CAPTURAR EL ERROR ESPECÍFICO DEL SERVIDOR
                let errorMessage = 'Error al generar la muestra aleatoria.';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                    console.error("❌ Error del servidor:", errorData);
                } catch (e) {
                    console.error("❌ Error parsing response:", e);
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            return response.json();
        },

        calculateEvaluation: async (params: EvaluationParams): Promise<EvaluationResult> => {
            const response = await fetch('/api/atributos/evaluar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Fallo en la evaluación del muestreo.');
            }

            return response.json();
        }
    },

    // ✅ MUESTREO DE UNIDADES MONETARIAS (MUM)
    mum: {
        // Planificación
        planification: async (params: MumPlanificationParams): Promise<PlanificationResult> => {
            const response = await fetch('/api/mum/planification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Fallo en la planificación del muestreo MUM.');
            }

            return response.json();
        },

        ideaPlanification: async (params: IdeaPlanificationParams): Promise<PlanificationResult> => {
            const response = await fetch('/api/idea/planification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Fallo en la planificación IDEA.');
            }

            return response.json();
        },

        // Extracción
        extraction: async (body: any): Promise<any> => {
            const response = await fetch('/api/mum/extraction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error en la extracción');
            }

            return response.json();
        },

        // Evaluación
        evaluate: async (data: MumEvaluationData): Promise<EvaluationResult> => {
            const response = await fetch('/api/mum/evaluation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Respuesta del servidor:", errorText);
                throw new Error(`Error al evaluar la muestra. Detalles: ${response.status} - ${errorText}`);
            }

            return response.json();
        },

        cellClassicalEvaluation: async (data: any): Promise<EvaluationResult> => {
            const response = await fetch('/api/mum/evaluation/cell-classical', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            
            if (!response.ok) {
                throw new Error('Error en evaluación Cell & Classical');
            }
            
            return response.json();
        },

        stringerBoundEvaluation: async (data: any): Promise<EvaluationResult> => {
            const response = await fetch('/api/mum/evaluation/stringer-bound', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error("❌ Error response:", errorData);
                throw new Error(errorData.error || 'Error en evaluación Stringer Bound');
            }
            
            return response.json();
        },

        // Resumen
        summary: async (body: any): Promise<any> => {
            const response = await fetch('/api/mum/summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error en el resumen');
            }

            return response.json();
        }
    },

    // ✅ ESTIMACIÓN DE MUESTRA (función auxiliar)
    estimateSample: async (data: {
        estimatedPopulationValue: number;
        confidenceLevel: number;
        tolerableError: number;
        expectedError: number;
        errorType: ErrorType;
    }) => {
        const response = await fetch('/api/mum/planification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error en la estimación de muestra');
        }

        return response.json();
    }
};

// --- ALIAS PARA BACKWARD COMPATIBILITY ---

/**
 * @deprecated Use apiClient.mum.evaluate instead
 */
export const performEvaluation = apiClient.mum.evaluate;

/**
 * @deprecated Use apiClient.mum.stringerBoundEvaluation instead  
 */
export const StringerBoundClient = {
    evaluate: apiClient.mum.stringerBoundEvaluation
};

/**
 * @deprecated Use apiClient.estimateSample instead
 */
export const estimateSample = apiClient.estimateSample;

/**
 * @deprecated Use apiClient.atributos.calculateEvaluation instead
 */
export const calculateEvaluation = apiClient.atributos.calculateEvaluation;

/**
 * @deprecated Use apiClient.atributos.createRandomSample instead
 */
export const createRandomSample = apiClient.atributos.createRandomSample;

/**
 * @deprecated Use apiClient.mum.planification instead
 */
export const mumApi = {
    planification: apiClient.mum.planification,
    extraction: apiClient.mum.extraction,
    summary: apiClient.mum.summary,
    cellClassicalEvaluation: apiClient.mum.cellClassicalEvaluation,
    stringerBoundEvaluation: apiClient.mum.stringerBoundEvaluation
};