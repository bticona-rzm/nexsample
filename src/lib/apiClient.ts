// /lib/apiClient.ts

// --- Funciones de Muestreo por Atributos ---
type RandomSampleParams = {
    excelData: any[];
    calculatedSampleSize: number;
    startRandomNumber: number;
    startRecordToSelect: number;
    endRecordToSelect: number;
    allowDuplicates: boolean;
};

type EvaluationParams = {
    evaluatedSampleSize: number;
    observedDeviations: number;
    desiredConfidence: number;
};

export type ExcelRow = Record<string, string | number | null>; 

type PlanificationParams = {
    excelData: ExcelRow[];
    useFieldValue: boolean;
    selectedField: string | null;
    selectedPopulationType: "positive" | "negative" | "absolute";
    confidenceLevel: number;
    errorType: "importe" | "percentage";
    tolerableError: number;
    expectedError: number;
    modifyPrecision: boolean;
    precisionValue: number;
    populationSize: number;
    expectedDeviation: number;
    tolerableDeviation: number;
    alphaConfidenceLevel: number;
    controlType: string;
};

type PlanificationResult = {
    estimatedPopulationValue: number;
    estimatedSampleSize: number;
    sampleInterval: number;
    tolerableContamination: number;
    conclusion: string;
    minSampleSize: number;
};

/**
 * Función para cargar y procesar un archivo en el backend.
 * Nota: Esta función asume que tienes una ruta /api/atributos/upload
 * que maneja la lógica del servidor para leer el archivo.
 */
export const fetchData = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    // CORRECCIÓN CLAVE: La URL de subida DEBE apuntar a la ruta que estás definiendo abajo.
    const response = await fetch("/api/upload", { 
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Respuesta del servidor:", errorText);
        throw new Error('Error al cargar el archivo en el servidor.');
    }
    
    return response.json();
};

export async function calculatePlanification(
    planificationData: {
        populationSize: number;
        expectedDeviation: number;
        tolerableDeviation: number;
        confidenceLevel: number;
        alphaConfidenceLevel: number;
        controlType: string;
    },
    // Añade el archivo (File) como argumento
    dataFile: File | null 
) {
    if (!dataFile) {
        throw new Error('Debe proporcionar un archivo de datos para la planificación.');
    }
    
    // 1. Crear el FormData
    const formData = new FormData();
    
    // 2. Adjuntar el archivo
    formData.append('file', dataFile); // El backend esperará un campo llamado 'file'
    
    // 3. Adjuntar los metadatos JSON como un string (clave: 'data')
    // Es CRÍTICO que el backend sepa parsear este campo 'data' como JSON.
    formData.append('data', JSON.stringify(planificationData));

    // Nota: Cuando se usa FormData, NO se debe establecer 'Content-Type': 'application/json'
    const response = await fetch('/api/atributos/planification', {
        method: 'POST',
        // Headers ya no incluyen 'Content-Type', el navegador lo establece automáticamente
        body: formData, 
    });

    if (!response.ok) {
        const status = response.status;
        let errorMessage = 'El servidor no pudo procesar la solicitud.';

        try {
            // 1. Intenta parsear el cuerpo de la respuesta como JSON.
            const errorData = await response.json();
            
            // 2. Busca el mensaje de error real en la respuesta del servidor (backend).
            //    Asume que el backend usa campos comunes como 'message' o 'error'.
            errorMessage = errorData.message || errorData.error || errorMessage;
            
        } catch (e) {
            // Si falla el parseo (ej: la respuesta es un texto simple o HTML),
            // se mantiene el mensaje por defecto.
        }
        
        // Lanza un error mucho más informativo para el cliente y la consola.
        throw new Error(`Error en la planificación (HTTP ${status}): ${errorMessage}`);
    }

    return response.json();
}

/**
 * Función para generar la muestra aleatoria por atributos.
 */
export async function createRandomSample(sampleData: {
    calculatedSampleSize: number;
    startRandomNumber: number;
    startRecordToSelect: number;
    endRecordToSelect: number;
    allowDuplicates: boolean;
    excelData: any[];
}) {
    const response = await fetch('/api/atributos/aleatorio', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(sampleData),
    });

    if (!response.ok) {
        throw new Error('Error al generar la muestra aleatoria.');
    }

    return response.json();
}

/**
 * Función para evaluar la muestra por atributos.
 */

export const calculateEvaluation = async (params: EvaluationParams): Promise<EvaluationResult> => {
    const response = await fetch('/api/atributos/evaluar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Fallo en la evaluación del muestreo.');
    }

    return response.json();
};

/**
 * Función principal que llama a la API del servidor para realizar la evaluación completa.
 * @param data Los datos del formulario del frontend.
 * @returns Una promesa con los resultados de la evaluación.
 */
export const performEvaluation = async (data: EvaluationData): Promise<EvaluationResult> => {
    // LLAMADA AL ENDPOINT DEL SERVIDOR (URL ASUMIENDO LA RUTA DE CARPETA MUM)
    const response = await fetch('/api/mum/evaluation', { 
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data), // Envía los datos (incluyendo el contenido del archivo)
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Respuesta del servidor:", errorText);
        throw new Error(`Error al evaluar la muestra. Detalles: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result as EvaluationResult;
};

export const mumApi = {
    planification: async (params: PlanificationParams): Promise<PlanificationResult> => {
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
    // ... aquí se añadirán extraction y summary ...
    extraction: async (body: any): Promise<Blob> => {
        // Esta función retornará un blob/archivo, por lo que su implementación es diferente.
        // La dejaremos pendiente hasta implementar el route.ts de extraction.
        throw new Error("MUM Extraction not implemented yet.");
    },
    summary: async (body: any): Promise<any> => {
        // 1. Quitar el 'throw new Error()' para que el flujo no se detenga.
        // console.log("MUM Summary route called with body:", body); 
        
        await new Promise(resolve => setTimeout(resolve, 500)); // Simular retraso de red

        // Determinar el método de evaluación del body (asumiendo que viene en la solicitud)
        const evaluationMethod = body.evaluationMethod || 'cell-classical'; 
        const isCellClassical = evaluationMethod === 'cell-classical';

        const baseResults = {
            // Datos comunes a ambos métodos (con valores simulados)
            isEvaluationDone: true,
            confidenceLevel: body.confidenceLevel || 95.00, // Usar el valor enviado
            sampleInterval: 50000.00,
            precisionValue: 105510.51,
            populationExcludingHigh: 990000.00,
            populationIncludingHigh: 1500000.00,
            estimatedSampleSize: body.sampleSize || 100, // Usar el valor enviado
            numErrores: 2,
            errorMasProbableBruto: 8550.00,
            errorMasProbableNeto: -1500.00,
            precisionTotal: 105000.00,
            limiteErrorSuperiorBruto: 110000.00,
            limiteErrorSuperiorNeto: -95000.00,
            highValueCountResume: 5,
            // Los props que no vienen de 'results' deben ser manejados en el componente padre
            // Por eso, no se incluyen setActiveTab ni handleSummary aquí.
        };
        
        // **NOTA CLAVE:** highValueLimit y highValueTotal son cruciales,
        // pero son más relevantes en 'cell-classical'. Los simularemos.

        const responseResults = {
            isEvaluationDone: true,
            confidenceLevel: body.confidenceLevel || 95.00,
            sampleInterval: 50000.00,
            precisionValue: 105510.51,
            populationExcludingHigh: 990000.00,
            populationIncludingHigh: 1500000.00,
            estimatedSampleSize: body.sampleSize || 100,
            numErrores: 2,
            errorMasProbableBruto: 8550.00,
            errorMasProbableNeto: -1500.00,
            precisionTotal: 105000.00,
            limiteErrorSuperiorBruto: 110000.00,
            limiteErrorSuperiorNeto: -95000.00,

            // Datos específicos de Valores Altos (CRUCIALES para el error actual)
            // Se incluyen en ambos métodos por si el componente los usa en el Stringer Bound también, 
            // aunque son más relevantes para Cell/PPS Clásico.
            highValueLimit: 10000.00, 
            highValueCountResume: isCellClassical ? 5 : 0, 
            highValueTotal: isCellClassical ? 510000.00 : 0.00,
        };

        return {
            status: "success",
            method: evaluationMethod,
            results: responseResults
        };
    },
};

// Definimos la interfaz para los datos de entrada
interface EvaluationData {
    method: 'cell' | 'classical-pps';
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
    };
    highValueHandling: {
        isFile: boolean;
        filePath?: string;
        bookValueHigh?: string;
        auditedValueHigh?: string;
        referenceHigh?: string;
    };
    precisionLimits: 'upper' | 'upper-lower';
    resultName: string;
    // Aquí se incluirá la referencia al archivo Excel original
    // Por ejemplo, su contenido en un formato que puedas procesar
    excelFileContent: ArrayBuffer; 
}

// Interfaz para los resultados que devolverá la función de evaluación
interface EvaluationResult {
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
    sampleDeviationRate: number;
    unilateralUpperLimit: number;
    bilateralLowerLimit: number;
    bilateralUpperLimit: number;
}


export const estimateSample = async (data: {
    estimatedPopulationValue: number;
    confidenceLevel: number;
    tolerableError: number;
    expectedError: number;
    errorType: "importe" | "percentage"; // <--- ¡Añadir este campo!
}) => {
    const response = await fetch('/api/mum/planification', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    return response.json();
};




// ... otros tipos de Extraction y Summary ...

// --- Funciones de la API para MUM ---
// En tu apiClient.ts o utils
import * as XLSX from 'xlsx';

export const readExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                resolve(jsonData);
            } catch (error) {
                reject(new Error('Error leyendo archivo Excel: ' + error));
            }
        };
        
        reader.onerror = () => reject(new Error('Error leyendo archivo'));
        reader.readAsArrayBuffer(file);
    });
};