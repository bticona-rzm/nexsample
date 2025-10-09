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
}): any => {
    
    const { 
        excelData, 
        sampleInterval, 
        highValueManagement, 
        sampleField, 
        randomStartPoint,
        extractionFilename,
        highValueFilename
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
    
    console.log('Corrected sample interval:', correctedSampleInterval);
    console.log('Corrected random start:', correctedRandomStart);
    
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

    console.log('High values count:', highValues.length);
    console.log('Remaining data count:', remainingData.length);

    // 2. ACUMULACIÓN
    let cumulativeValue = 0;
    const accumulatedData: any[] = [];
    
    const dataForSampling = highValueManagement === 'agregados' 
        ? excelData
        : remainingData;
    
    console.log('Data for sampling count:', dataForSampling.length);

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

    console.log('Total cumulative value for sampling:', roundToInteger(cumulativeValue));

    // 3. ✅ CORRECCIÓN COMPLETA: SELECCIÓN SISTEMÁTICA
    let currentPosition = correctedRandomStart;
    const selectedItems: any[] = [];

    while (currentPosition <= cumulativeValue && selectedItems.length < params.estimatedSampleSize) {
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
            // Según IDEA, MUM_EXCESS parece ser: (valor del item - (intervalo - posición_relativa))
            // O podría ser: el exceso cuando el valor es mayor que el intervalo
            let mumExcess = 0;
            
            // Si el valor del item es mayor que el intervalo, calculamos el exceso
            if (absoluteValue > correctedSampleInterval) {
                mumExcess = roundToInteger(absoluteValue - correctedSampleInterval);
            } else {
                // Para valores menores, IDEA parece calcular algo diferente
                // Basado en los datos, podría ser la diferencia entre el valor y algún cálculo
                const relativePosition = currentPosition - selectedItem.cumulativeStart;
                mumExcess = roundToInteger(absoluteValue - relativePosition);
            }
            
            // ✅ ALTERNATIVA: Basado en el análisis de datos de IDEA
            // MUM_EXCESS parece relacionarse con la diferencia entre el valor y la posición
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

    console.log('Selected items count:', selectedItems.length);

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

    // 5. GENERACIÓN DE ARCHIVOS
    const sampleFileBase64 = createBase64Excel(finalSample, "Muestra");
    let highValueFileBase64: string | null = null;

    // PROCESAR VALORES ALTOS
    if (highValueManagement === 'separado') {
        if (highValues.length > 0) {
            console.log('✅ GENERANDO ARCHIVO DE VALORES ALTOS con', highValues.length, 'registros');
            
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
            
            highValueFileBase64 = createBase64Excel(processedHighValues, "Valores Altos");
        } else {
            console.log('✅ GENERANDO ARCHIVO DE VALORES ALTOS VACÍO');
            
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
            highValueFileBase64 = createBase64Excel(emptyHighValues, "Valores Altos");
        }
    }

    return { 
        sampleFileBase64, 
        highValueFileBase64,
        sampleFilename: extractionFilename,
        highValueFilename: highValueManagement === 'separado' ? highValueFilename : null
    };
};

