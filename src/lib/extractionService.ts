// Este archivo contiene la lógica Pura: muestreo, cálculos y generación de buffers.

import * as XLSX from 'xlsx';

// Define la forma de una fila de datos para claridad interna
interface ExcelRow {
    [key: string]: any;
}

// Interfaz para el objeto de retorno de la extracción
interface ExtractionResult {
    sampleFileBase64: string;
    highValueFileBase64: string | null;
}

// Función auxiliar para generar el buffer de Excel y convertirlo a Base64
const createBase64Excel = (data: ExcelRow[], sheetName: string = "Hoja1"): string => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    // Usamos 'array' en el server para luego convertirlo a Base64
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    // Node.js Buffer is available in Next.js Serverless environment (API Routes)
    const buffer = Buffer.from(excelBuffer);
    return buffer.toString('base64');
};

// Función de Lógica de Negocio: Procesa los datos y realiza la extracción
export const executeExtraction = (params: {
    excelData: ExcelRow[];
    estimatedSampleSize: number;
    sampleInterval: number;
    highValueLimit: number;
    highValueManagement: "agregados" | "separado";
    sampleField: string;
    randomStartPoint: number;
    estimatedPopulationValue: number;
    extractionType: "intervaloFijo" | "seleccionCelda";
}): ExtractionResult => {
    
    const { 
        excelData, 
        estimatedSampleSize, 
        sampleInterval, 
        highValueLimit, 
        highValueManagement, 
        sampleField, 
        randomStartPoint, 
        estimatedPopulationValue, 
        extractionType 
    } = params;
    
    let sample: ExcelRow[] = [];
    
    // 1. Identificación de Valores Altos
    let highValues = excelData.filter(row => {
        const value = parseFloat(row[sampleField]);
        return !isNaN(value) && Math.abs(value) >= highValueLimit;
    });

    let remainingData = excelData.filter(row => {
        const value = parseFloat(row[sampleField]);
        return !isNaN(value) && Math.abs(value) < highValueLimit;
    });

    // 2. Lógica de Muestreo (MUS o MAS)
    if (extractionType === 'intervaloFijo') {
        // Muestreo MUS (Por Intervalo Fijo)
        const dataForSampling = highValueManagement === 'agregados' ? excelData : remainingData;

        // Se ordena por el campo de muestreo (fundamental para MUS)
        const sortedData = [...dataForSampling].sort((a, b) => {
            const valA = Math.abs(parseFloat(a[sampleField]));
            const valB = Math.abs(parseFloat(b[sampleField]));
            return valA - valB;
        });

        let cumulativeValue = 0;
        let nextSamplePoint = randomStartPoint;

        for (const row of sortedData) {
            const value = Math.abs(parseFloat(row[sampleField]));
            if (isNaN(value)) continue;

            cumulativeValue += value;
            if (cumulativeValue >= nextSamplePoint) {
                sample.push(row);
                nextSamplePoint += sampleInterval;
            }
        }
    } else if (extractionType === 'seleccionCelda') {
        // Muestreo Aleatorio Simple (MAS) de los registros restantes
        const remainingRecordsToSample = estimatedSampleSize - (highValueManagement === 'agregados' ? highValues.length : 0);
        
        const finalSampleCount = Math.max(0, Math.min(remainingRecordsToSample, remainingData.length));
        
        // Muestra Aleatoria
        const shuffledSample = [...remainingData].sort(() => 0.5 - Math.random());
        sample = shuffledSample.slice(0, finalSampleCount);

        // Si es 'agregados', se añaden los valores altos a la muestra
        if (highValueManagement === 'agregados') {
            sample = [...sample, ...highValues];
        }
    }

    // 3. Procesar y Agregar Columnas de Auditoría (Lógica de Negocio)
    const finalSample = sample.map(row => {
        const value = parseFloat(row[sampleField]);
        const finalInterval = extractionType === 'intervaloFijo' ? sampleInterval : highValueLimit;
        
        const mumRecno = Math.ceil(Math.abs(value) / finalInterval);
        const mumTotal = Math.ceil(estimatedPopulationValue / finalInterval);
        const mumHit = Math.abs(value) >= finalInterval;
        const mumRecHit = mumHit ? mumRecno : 0;
        const mumExcess = mumHit ? Math.abs(value) - finalInterval : 0;

        return {
            ...row,
            TOTAL: estimatedPopulationValue,
            AUDIT_AMT: value,
            MUM_RECNO: mumRecno,
            MUM_TOTAL: mumTotal,
            MUM_HIT: mumHit ? 'Y' : 'N',
            MUM_REC_HIT: mumRecHit,
            MUM_EXCESS: mumExcess,
            REFERENCE: row.REFERENCE || row.NUM_FACT || 'N/A'
        };
    });

    // 4. Generación de Archivos (Buffers)
    const sampleFileBase64 = createBase64Excel(finalSample, "Muestra");
    let highValueFileBase64: string | null = null;
    
    if (highValueManagement === 'separado' && highValues.length > 0) {
        // La tabla de Valores Altos también debe tener las columnas MUM
        const processedHighValues = finalSample.filter(row => Math.abs(row.AUDIT_AMT as number) >= highValueLimit);
        highValueFileBase64 = createBase64Excel(processedHighValues, "Valores Altos");
    }

    return { sampleFileBase64, highValueFileBase64 };
};