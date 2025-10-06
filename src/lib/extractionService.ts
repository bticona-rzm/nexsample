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
    originalIndex: number; // ✅ NUEVO: Para guardar el índice original
    NUM_FACT?: string | number;
    REFERENCE?: string;
    [key: string]: any;
}

interface SelectedItem {
    item: AccumulatedItem;
    mumRecno: number; // ✅ CAMBIADO: musRecno → mumRecno
    mumTotal: number; // ✅ CAMBIADO: musTotal → mumTotal
    mumExcess: number; // ✅ CAMBIADO: musExcess → mumExcess
    mumHit: number; // ✅ NUEVO: Hit Point Within Cell
    mumRecHit: number; // ✅ NUEVO: Hit Point Within Record
    selectionPosition: number;
}

// Interfaz para el objeto de retorno de la extracción
interface ExtractionResult {
    sampleFileBase64: string;
    highValueFileBase64: string | null;
    sampleFilename: string;
    highValueFilename: string | null;
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
    extractionFilename: string;
    highValueFilename: string;
    
}): ExtractionResult => {
    
    const { 
        excelData, 
        sampleInterval, 
        highValueManagement, 
        sampleField, 
        randomStartPoint,
        highValueLimit // ✅ RECIBIR highValueLimit DEL FRONTEND
    } = params;
    
    console.log('=== EXTRACTION SERVICE DEBUG ===');
    console.log('Sample field:', sampleField);
    console.log('Sample interval:', sampleInterval);
    console.log('High value limit received:', highValueLimit);
    console.log('High value management:', highValueManagement);
    console.log('Total records:', excelData.length);
    
    // ✅ CORRECCIÓN: USAR HIGH_VALUE_LIMIT EN LUGAR DE SAMPLE_INTERVAL
    // Y MEJORAR DETECCIÓN DE VALORES ALTOS
    let highValues = excelData.filter(row => {
        const rawValue = row[sampleField];
        const value = parseFloat(rawValue);
        
        console.log(`Row value: ${rawValue} -> Parsed: ${value}, HighValueLimit: ${highValueLimit}, IsHigh: ${!isNaN(value) && Math.abs(value) >= highValueLimit}`);
        
        return !isNaN(value) && Math.abs(value) >= highValueLimit;
    });

    let remainingData = excelData.filter(row => {
        const rawValue = row[sampleField];
        const value = parseFloat(rawValue);
        return !isNaN(value) && Math.abs(value) < highValueLimit; // ✅ USAR highValueLimit
    });

    console.log('High values count:', highValues.length);
    console.log('Remaining data count:', remainingData.length);
    console.log('First few high values:', highValues.slice(0, 3).map(row => ({
        value: row[sampleField],
        parsed: parseFloat(row[sampleField])
    })));

    // 2. ACUMULACIÓN PARA MUESTREO MUS
    let cumulativeValue = 0;
    const accumulatedData: AccumulatedItem[] = [];
    
    const dataForSampling = highValueManagement === 'agregados' 
        ? excelData
        : remainingData;
    
    console.log('Data for sampling count:', dataForSampling.length);

    // Crear acumulación manteniendo el ORDEN ORIGINAL
    dataForSampling.forEach((row, originalIndex) => {
        const rawValue = row[sampleField];
        const value = parseFloat(rawValue);
        if (isNaN(value)) return;
        
        const absoluteValue = Math.abs(value);
        const startRange = cumulativeValue;
        cumulativeValue += absoluteValue;
        const endRange = cumulativeValue;
        
        accumulatedData.push({
            ...row,
            cumulativeStart: startRange,
            cumulativeEnd: endRange,
            originalValue: value,
            originalIndex: originalIndex + 1
        });
    });

    console.log('Total cumulative value for sampling:', cumulativeValue);

    // 3. SELECCIÓN SISTEMÁTICA
    let currentPosition = randomStartPoint;
    const selectedItems: SelectedItem[] = [];
    let mumTotalAccumulated = 0;

    while (currentPosition <= cumulativeValue && selectedItems.length < params.estimatedSampleSize) {
        const selectedItem = accumulatedData.find(item => 
            currentPosition >= item.cumulativeStart && currentPosition < item.cumulativeEnd
        );
        
        if (selectedItem && !selectedItems.some(s => s.item === selectedItem)) {
            const originalValue = selectedItem.originalValue;
            const absoluteValue = Math.abs(originalValue);
            
            mumTotalAccumulated += absoluteValue;
            const mumExcess = absoluteValue - sampleInterval;
            
            const cellSize = selectedItem.cumulativeEnd - selectedItem.cumulativeStart;
            const mumHit = cellSize > 0 ? 
                (currentPosition - selectedItem.cumulativeStart) / cellSize : 0;
            
            const mumRecHit = mumHit;
            
            selectedItems.push({
                item: selectedItem,
                mumRecno: selectedItem.originalIndex,
                mumTotal: Math.round(mumTotalAccumulated * 100) / 100,
                mumExcess: mumExcess > 0 ? Math.round(mumExcess * 100) / 100 : 0,
                mumHit: Math.round(mumHit * 100) / 100,
                mumRecHit: Math.round(mumRecHit * 100) / 100,
                selectionPosition: currentPosition
            });
        }
        currentPosition += sampleInterval;
    }

    console.log('Selected items count:', selectedItems.length);

    // 4. PROCESAR MUESTRA FINAL
    const finalSample = selectedItems.map(({ item, mumRecno, mumTotal, mumExcess, mumHit, mumRecHit }) => {
        const originalValue = item.originalValue;
        
        const { cumulativeStart, cumulativeEnd, originalValue: _, originalIndex, ...cleanItem } = item;
        
        return {
            ...cleanItem,
            MUM_REC: mumRecno,
            AUDIT_AMT: originalValue,
            MUM_TOTAL: mumTotal,
            MUM_HIT: mumHit,
            MUM_REC_HIT: mumRecHit,
            MUM_EXCESS: mumExcess,
            REFERENCE: item.NUM_FACT?.toString() || item.REFERENCE || 'N/A'
        };
    });

    // 5. GENERACIÓN DE ARCHIVOS
    const sampleFileBase64 = createBase64Excel(finalSample, "Muestra");
    let highValueFileBase64: string | null = null;

    // ✅ CORRECCIÓN: SIEMPRE generar archivo de valores altos cuando se solicita "separado"
    if (highValueManagement === 'separado') {
        if (highValues.length > 0) {
            console.log('✅ GENERANDO ARCHIVO DE VALORES ALTOS con', highValues.length, 'registros');
            
            const processedHighValues = highValues.map((row, index) => {
                const rawValue = row[sampleField];
                const value = parseFloat(rawValue);
                const absoluteValue = Math.abs(value);
                
                return {
                    ...row,
                    MUM_REC: index + 1,
                    AUDIT_AMT: value,
                    MUM_TOTAL: absoluteValue,
                    MUM_HIT: 1.0,
                    MUM_REC_HIT: 1.0,
                    MUM_EXCESS: Math.max(0, absoluteValue - sampleInterval),
                    REFERENCE: row.NUM_FACT?.toString() || row.REFERENCE || 'N/A'
                };
            });
            
            highValueFileBase64 = createBase64Excel(processedHighValues, "Valores Altos");
            console.log('✅ ARCHIVO DE VALORES ALTOS GENERADO (con datos)');
        } else {
            console.log('✅ GENERANDO ARCHIVO DE VALORES ALTOS VACÍO (sin datos)');
            
            // ✅ CREAR ARCHIVO VACÍO CON ESTRUCTURA CORRECTA
            // Tomar la estructura de columnas del primer registro para mantener consistencia
            const emptyHighValueRow: ExcelRow = {};
            
            if (excelData.length > 0) {
                // Copiar todas las columnas del primer registro pero sin datos
                Object.keys(excelData[0]).forEach(key => {
                    emptyHighValueRow[key] = ""; // Valores vacíos
                });
            }
            
            // ✅ AGREGAR COLUMNAS DE AUDITORÍA VACÍAS
            const emptyHighValuesWithAuditColumns = {
                ...emptyHighValueRow,
                MUM_REC: "",
                AUDIT_AMT: "",
                MUM_TOTAL: "",
                MUM_HIT: "",
                MUM_REC_HIT: "",
                MUM_EXCESS: "",
                REFERENCE: ""
            };
            
            // ✅ CREAR ARRAY VACÍO PERO CON LA ESTRUCTURA CORRECTA
            const emptyHighValues = [emptyHighValuesWithAuditColumns];
            
            highValueFileBase64 = createBase64Excel(emptyHighValues, "Valores Altos");
            console.log('✅ ARCHIVO DE VALORES ALTOS VACÍO GENERADO');
        }
    } else {
        console.log('❌ NO se generó archivo de valores altos. Modo:', highValueManagement);
    }

    return { 
        sampleFileBase64, 
        highValueFileBase64,
        sampleFilename: params.extractionFilename,
        highValueFilename: params.highValueFilename
    };
};