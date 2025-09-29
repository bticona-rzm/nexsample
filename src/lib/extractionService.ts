// Este archivo contiene la lógica Pura: muestreo, cálculos y generación de buffers.

import * as XLSX from 'xlsx';

// Define la forma de una fila de datos para claridad interna
interface ExcelRow {
    [key: string]: any;
    NUM_FACT?: string | number;
    REFERENCE?: string;
}

// Interfaces para el proceso de selección
interface AccumulatedItem {
    cumulativeStart: number;
    cumulativeEnd: number;
    originalValue: number;
    NUM_FACT?: string | number;
    REFERENCE?: string;
    [key: string]: any; // Para otras propiedades del row original
}

interface SelectedItem {
    item: AccumulatedItem;
    musRecno: number;
    musTotal: number;
    musExcess: number;
    selectionPosition: number;
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
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
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
        sampleInterval, 
        highValueManagement, 
        sampleField, 
        randomStartPoint 
    } = params;
    
    // 1. IDENTIFICACIÓN DE VALORES ALTOS
    let highValues = excelData.filter(row => {
        const value = parseFloat(row[sampleField]);
        return !isNaN(value) && Math.abs(value) >= sampleInterval;
    });

    let remainingData = excelData.filter(row => {
        const value = parseFloat(row[sampleField]);
        return !isNaN(value) && Math.abs(value) < sampleInterval;
    });

    // 2. ACUMULACIÓN PARA MUESTREO MUS
    let cumulativeValue = 0;
    const accumulatedData: AccumulatedItem[] = [];
    
    const dataForSampling = highValueManagement === 'agregados' 
        ? excelData
        : remainingData;
    
    // Crear acumulación manteniendo el ORDEN ORIGINAL
    for (const row of dataForSampling) {
        const value = parseFloat(row[sampleField]);
        if (isNaN(value)) continue;
        
        const absoluteValue = Math.abs(value);
        const startRange = cumulativeValue;
        cumulativeValue += absoluteValue;
        const endRange = cumulativeValue;
        
        accumulatedData.push({
            ...row,
            cumulativeStart: startRange,
            cumulativeEnd: endRange,
            originalValue: value // Guardar valor original con signo
        });
    }

    // 3. SELECCIÓN SISTEMÁTICA
    let currentPosition = randomStartPoint;
    const selectedItems: SelectedItem[] = []; // ✅ TIPADO EXPLÍCITO
    let musRecno = 1;
    let musTotalAccumulated = 0;

    while (currentPosition <= cumulativeValue && selectedItems.length < params.estimatedSampleSize) {
        const selectedItem = accumulatedData.find(item => 
            currentPosition >= item.cumulativeStart && currentPosition < item.cumulativeEnd
        );
        
        if (selectedItem && !selectedItems.some(s => s.item === selectedItem)) {
            const originalValue = selectedItem.originalValue;
            const absoluteValue = Math.abs(originalValue);
            
            // ✅ CÁLCULOS CORREGIDOS según tu ejemplo
            musTotalAccumulated += absoluteValue;
            const musExcess = absoluteValue - sampleInterval;
            
            selectedItems.push({
                item: selectedItem,
                musRecno: musRecno++,
                musTotal: musTotalAccumulated,
                musExcess: musExcess > 0 ? musExcess : 0,
                selectionPosition: currentPosition
            });
        }
        currentPosition += sampleInterval;
    }

    // 4. ✅ CORRECCIÓN: PROCESAR MUESTRA FINAL (SEGÚN TU EJEMPLO)
    const finalSample = selectedItems.map(({ item, musRecno, musTotal, musExcess }) => {
        const originalValue = item.originalValue;
        const absoluteValue = Math.abs(originalValue);
        
        // ✅ LIMPIAR COLUMNAS INTERNAS
        const { cumulativeStart, cumulativeEnd, originalValue: _, ...cleanItem } = item;
        
        // ✅ EXTRAER COLUMNA TOTAL ORIGINAL SI EXISTE
        const originalTotal = cleanItem.TOTAL;
        delete cleanItem.TOTAL; // Removerla para reordenar
        
        return {
            // ✅ COLUMNAS ORIGINALES DEL EXCEL (SIN TOTAL)
            ...cleanItem,
            
            // ✅ COLUMNA TOTAL ORIGINAL AL FINAL DE LAS COLUMNAS ORIGINALES
            TOTAL: originalTotal !== undefined ? originalTotal : originalValue,
            
            // ✅ COLUMNAS DE AUDITORÍA (NUEVAS)
            AUDIT_AMT: originalValue,
            MUS_RECNO: musRecno,
            MUS_TOTAL: Math.round(musTotal * 100) / 100,
            MUS_EXCESS: Math.round(musExcess * 100) / 100,
            REFERENCE: item.NUM_FACT?.toString() || item.REFERENCE || 'N/A'
        };
    });


    // 5. GENERACIÓN DE ARCHIVOS
    const sampleFileBase64 = createBase64Excel(finalSample, "Muestra");
    let highValueFileBase64: string | null = null;

    if (highValueManagement === 'separado' && highValues.length > 0) {
        // Para valores altos en archivo separado, usar misma estructura
        const processedHighValues = highValues.map((row, index) => {
            const value = parseFloat(row[sampleField]);
            const absoluteValue = Math.abs(value);
            // ✅ MISMAS CORRECCIONES PARA VALORES ALTOS
            const originalTotal = row.TOTAL;
            delete row.TOTAL;
            
            return {
                ...row,
                TOTAL: originalTotal !== undefined ? originalTotal : value,
                AUDIT_AMT: value,
                MUS_RECNO: index + 1,
                MUS_TOTAL: absoluteValue, // Para valores altos, el total es su propio valor
                MUS_EXCESS: absoluteValue - sampleInterval,
                REFERENCE: row.NUM_FACT?.toString() || row.REFERENCE || 'N/A'
            };
        });
        highValueFileBase64 = createBase64Excel(processedHighValues, "Valores Altos");
    }

    return { sampleFileBase64, highValueFileBase64 };
};