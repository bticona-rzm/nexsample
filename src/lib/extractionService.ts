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
    originalIndex: number;
    NUM_FACT?: string | number;
    REFERENCE?: string;
    [key: string]: any;
}

interface SelectedItem {
    item: AccumulatedItem;
    mumRecno: number;
    mumTotal: number;
    mumExcess: number;
    mumHit: number;
    mumRecHit: number;
    selectionPosition: number;
}

// Interfaz para metadatos (similar a Atributos)
interface ExtractionMetadata {
    fechaGeneracion: string;
    tamanoMuestra: number;
    tamanoPoblacion: number;
    intervaloMuestreo: number;
    puntoInicioAleatorio: number;
    limiteValorAlto: number;
    gestionValoresAltos: string;
    campoMuestreo: string;
    tipoExtraccion: string;
    valorPoblacionalEstimado: number;
    semillaUtilizada?: number;
}

// Interfaz para el objeto de retorno de la extracción
interface ExtractionResult {
    sampleFileBase64: string;
    highValueFileBase64: string | null;
    sampleFilename: string;
    highValueFilename: string | null;
}

// ✅ FUNCIÓN MEJORADA: Crear Excel con metadatos (como en Atributos)
const createBase64ExcelWithMetadata = (
    data: ExcelRow[], 
    sheetName: string = "Muestra",
    metadata: ExtractionMetadata,
    isHighValues: boolean = false
): string => {
    const workbook = XLSX.utils.book_new();
    
    // ✅ HOJA 1: DATOS DE LA MUESTRA
    if (data.length > 0) {
        const dataSheet = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, dataSheet, sheetName);
    } 

    // ✅ HOJA 2: METADATOS (como en Atributos)
    const metadataRows = [
        ['INFORMACIÓN DE LA EXTRACCIÓN MUM', '', '', ''],
        ['Fecha de generación:', metadata.fechaGeneracion, '', ''],
        ['Tamaño de muestra:', metadata.tamanoMuestra, '', ''],
        ['Tamaño de población:', metadata.tamanoPoblacion, '', ''],
        ['Intervalo de muestreo:', metadata.intervaloMuestreo, '', ''],
        ['Punto de inicio aleatorio:', metadata.puntoInicioAleatorio, '', ''],
        ['Límite para valores altos:', metadata.limiteValorAlto, '', ''],
        ['Gestión de valores altos:', metadata.gestionValoresAltos, '', ''],
        ['Campo de muestreo:', metadata.campoMuestreo, '', ''],
        ['Tipo de extracción:', metadata.tipoExtraccion, '', ''],
        ['Valor poblacional estimado:', metadata.valorPoblacionalEstimado, '', ''],
        ['', '', '', ''],
        [isHighValues ? 'VALORES ALTOS IDENTIFICADOS' : 'MUESTRA SISTEMÁTICA GENERADA', '', '', ''] // Encabezado para los datos
    ];
    
    const metadataSheet = XLSX.utils.aoa_to_sheet(metadataRows);
    XLSX.utils.book_append_sheet(workbook, metadataSheet, "Metadatos");
    
    // Generar archivo
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const buffer = Buffer.from(excelBuffer);
    return buffer.toString('base64');
};

// Función auxiliar para redondear como IDEA
const roundLikeIDEA = (value: number): number => {
    return Math.round(value * 100) / 100;
};

// Función para redondear a entero como IDEA
const roundToInteger = (value: number): number => {
    return Math.round(value);
};

// Función para generar punto de inicio aleatorio como IDEA
const generateRandomStartLikeIDEA = (sampleInterval: number): number => {
    const random = Math.random() * (sampleInterval - 1) + 1;
    return roundToInteger(random);
};

export const executeExtraction = (params: {
    excelData: any[];
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
    seed?: number; // ✅ NUEVO: Semilla para reproducibilidad
    returnData?: boolean; // ✅ NUEVO: Para modo previsualización
}): any => {
    
    const { 
        excelData, 
        estimatedSampleSize,
        sampleInterval, 
        highValueManagement, 
        sampleField, 
        randomStartPoint,
        estimatedPopulationValue,
        extractionType,
        extractionFilename,
        highValueFilename,
        seed,
        returnData = false // ✅ Valor por defecto
    } = params;
    
    // ✅ CORRECCIÓN: USAR ENTEROS COMO IDEA
    const correctedSampleInterval = roundToInteger(sampleInterval);
    const correctedHighValueLimit = correctedSampleInterval;
    
    let correctedRandomStart = randomStartPoint;
    if (!randomStartPoint || randomStartPoint <= 0 || randomStartPoint >= correctedSampleInterval) {
        correctedRandomStart = generateRandomStartLikeIDEA(correctedSampleInterval);
    } else {
        correctedRandomStart = roundToInteger(randomStartPoint);
    }
    
    // ✅ METADATOS (similar a Atributos)
    const metadata: ExtractionMetadata = {
        fechaGeneracion: new Date().toLocaleString('es-ES'),
        tamanoMuestra: estimatedSampleSize,
        tamanoPoblacion: excelData.length,
        intervaloMuestreo: correctedSampleInterval,
        puntoInicioAleatorio: correctedRandomStart,
        limiteValorAlto: correctedHighValueLimit,
        gestionValoresAltos: highValueManagement === 'agregados' ? 'Incluidos en muestra' : 'Archivo separado',
        campoMuestreo: sampleField,
        tipoExtraccion: extractionType === 'intervaloFijo' ? 'Intervalo Fijo' : 'Selección por Celda',
        valorPoblacionalEstimado: estimatedPopulationValue,
        semillaUtilizada: seed
    };

    // DETECCIÓN DE VALORES ALTOS
    let highValues = excelData.filter((row: any) => {
        const rawValue = row[sampleField];
        const value = parseFloat(rawValue);
        return !isNaN(value) && Math.abs(value) >= correctedHighValueLimit;
    });

    let remainingData = excelData.filter((row: any) => {
        const rawValue = row[sampleField];
        const value = parseFloat(rawValue);
        return !isNaN(value) && Math.abs(value) < correctedHighValueLimit;
    });

    // 2. ACUMULACIÓN
    let cumulativeValue = 0;
    const accumulatedData: any[] = [];
    
    const dataForSampling = highValueManagement === 'agregados' 
        ? excelData
        : remainingData;

    // Crear acumulación con valores enteros
    dataForSampling.forEach((row: any, originalIndex: number) => {
        const rawValue = row[sampleField];
        const value = parseFloat(rawValue);
        if (isNaN(value)) return;
        
        const absoluteValue = Math.abs(value);
        const startRange = cumulativeValue;
        cumulativeValue += absoluteValue;
        const endRange = cumulativeValue;
        
        accumulatedData.push({
            ...row,
            cumulativeStart: roundToInteger(startRange),
            cumulativeEnd: roundToInteger(endRange),
            originalValue: value,
            originalIndex: originalIndex + 1,
            absoluteValue: roundToInteger(absoluteValue)
        });
    });

    // 3. ✅ CORRECCIÓN COMPLETA: SELECCIÓN SISTEMÁTICA
    let currentPosition = correctedRandomStart;
    const selectedItems: any[] = [];

    while (currentPosition <= cumulativeValue && selectedItems.length < estimatedSampleSize) {
        const selectedItem = accumulatedData.find((item: any) => 
            currentPosition >= item.cumulativeStart && currentPosition < item.cumulativeEnd
        );
        
        if (selectedItem && !selectedItems.some((s: any) => s.item.originalIndex === selectedItem.originalIndex)) {
            const originalValue = selectedItem.originalValue;
            const absoluteValue = selectedItem.absoluteValue;
            
            // ✅ CORRECCIÓN: MUM_TOTAL ES LA POSICIÓN ACTUAL (ENTERO)
            const mumTotal = roundToInteger(currentPosition);
            
            // ✅ CORRECCIÓN: MUM_HIT - IDEA usa valores específicos
            const mumHit = roundToInteger(selectedItem.cumulativeStart);
            
            // ✅ CORRECCIÓN: MUM_REC_HIT - IDEA usa valores específicos diferentes a MUM_HIT
            const mumRecHit = roundToInteger(currentPosition - selectedItem.cumulativeStart);
            
            // ✅ CORRECCIÓN: MUM_EXCESS - CÁLCULO CORREGIDO
            let mumExcess = 0;
            
            // Si el valor del item es mayor que el intervalo, calculamos el exceso
            if (absoluteValue > correctedSampleInterval) {
                mumExcess = roundToInteger(absoluteValue - correctedSampleInterval);
            } else {
                // Para valores menores, IDEA parece calcular algo diferente
                const relativePosition = currentPosition - selectedItem.cumulativeStart;
                mumExcess = roundToInteger(absoluteValue - relativePosition);
            }
            
            // ✅ ALTERNATIVA: Basado en el análisis de datos de IDEA
            const mumExcessAlternative = roundToInteger(absoluteValue - mumRecHit);
            
            // Usamos la alternativa que parece coincidir mejor con IDEA
            mumExcess = Math.max(0, mumExcessAlternative);
            
            selectedItems.push({
                item: selectedItem,
                mumRecno: selectedItem.originalIndex,
                mumTotal: mumTotal,
                mumHit: mumHit,
                mumRecHit: mumRecHit,
                mumExcess: mumExcess,
                selectionPosition: roundToInteger(currentPosition)
            });
        }
        
        currentPosition = roundToInteger(currentPosition + correctedSampleInterval);
    }

    // 4. ✅ CORRECCIÓN: PROCESAR MUESTRA FINAL
    const finalSample = selectedItems.map(({ item, mumRecno, mumTotal, mumExcess, mumHit, mumRecHit }) => {
        const originalValue = item.originalValue;
        
        // Limpiar columnas internas
        const { cumulativeStart, cumulativeEnd, originalValue: _, originalIndex, absoluteValue: __, ...cleanItem } = item;
        
        return {
            // Primero todas las columnas originales del Excel
            ...cleanItem,
            
            // ✅ COLUMNAS DE AUDITORÍA EN ORDEN CORRECTO
            AUDIT_AMT: roundLikeIDEA(originalValue),
            MUM_REC: mumRecno,
            MUM_TOTAL: mumTotal,
            MUM_HIT: mumHit,
            MUM_REC_HIT: mumRecHit,
            MUM_EXCESS: mumExcess,
            REFERENCE: item.NUM_FACT?.toString() || item.REFERENCE || ''
        };
    });

    // 5. ✅ GENERACIÓN MEJORADA DE ARCHIVOS CON METADATOS
    const sampleFileBase64 = createBase64ExcelWithMetadata(finalSample, "Muestra", metadata);
    let highValueFileBase64: string | null = null;

    // ✅ NUEVO: Devolver datos procesados si está en modo preview
    if (returnData) {
        return {
            sampleFileBase64,
            highValueFileBase64,
            sampleFilename: extractionFilename,
            highValueFilename: highValueManagement === 'separado' ? highValueFilename : null,
            // ✅ DATOS PROCESADOS PARA PREVIEW
            processedData: finalSample,
            previewInfo: {
                totalRecords: finalSample.length,
                populationSize: excelData.length,
                sampleSize: estimatedSampleSize,
                interval: correctedSampleInterval,
                randomStart: correctedRandomStart
            }
        };
    }

    // PROCESAR VALORES ALTOS
    if (highValueManagement === 'separado') {
        if (highValues.length > 0) {
            
            const processedHighValues = highValues.map((row: any, index: number) => {
                const rawValue = row[sampleField];
                const value = parseFloat(rawValue);
                const absoluteValue = Math.abs(value);
                
                return {
                    ...row,
                    AUDIT_AMT: roundLikeIDEA(value),
                    MUM_REC: index + 1,
                    MUM_TOTAL: roundToInteger(absoluteValue),
                    MUM_HIT: 1,
                    MUM_REC_HIT: 1,
                    MUM_EXCESS: roundToInteger(Math.max(0, absoluteValue - correctedSampleInterval)),
                    REFERENCE: row.NUM_FACT?.toString() || row.REFERENCE || ''
                };
            });
            
            // ✅ ARCHIVO DE VALORES ALTOS CON METADATOS
            highValueFileBase64 = createBase64ExcelWithMetadata(
                processedHighValues, 
                "Valores Altos", 
                metadata,
                true // Indicar que es archivo de valores altos
            );
        } else {
            
            const emptyHighValueRow: any = {};
            
            if (excelData.length > 0) {
                Object.keys(excelData[0]).forEach(key => {
                    emptyHighValueRow[key] = "";
                });
            }
            
            const emptyHighValuesWithAuditColumns = {
                ...emptyHighValueRow,
                AUDIT_AMT: "",
                MUM_REC: "",
                MUM_TOTAL: "",
                MUM_HIT: "",
                MUM_REC_HIT: "",
                MUM_EXCESS: "",
                REFERENCE: ""
            };
            
            const emptyHighValues = [emptyHighValuesWithAuditColumns];
            
            // ✅ ARCHIVO VACÍO DE VALORES ALTOS CON METADATOS
            highValueFileBase64 = createBase64ExcelWithMetadata(
                emptyHighValues, 
                "Valores Altos", 
                metadata,
                true
            );
        }
    }

    return { 
        sampleFileBase64, 
        highValueFileBase64,
        sampleFilename: extractionFilename,
        highValueFilename: highValueManagement === 'separado' ? highValueFilename : null
    };
};

// ✅ FUNCIÓN PARA DESCARGA (compatible con ambos sistemas)
export const descargarExcelDesdeBase64 = (base64: string, filename: string) => {
    try {
        // Convertir base64 a blob
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        
        // Crear enlace de descarga
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        
        link.click();
        
        // Limpiar
        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }, 100);
        
        return true;
        
    } catch (error) {
        console.error('❌ Error al descargar Excel:', error);
        return false;
    }
};