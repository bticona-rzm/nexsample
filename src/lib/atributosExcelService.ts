// /src/lib/atributosExcelService.ts
import * as XLSX from 'xlsx';

interface ExcelRow {
    [key: string]: any;
}

interface SampleMetadata {
    fechaGeneracion: string;
    tamanoMuestra: number;
    semillaUtilizada: number;
    poblacionTotal: number;
    metodoMuestreo: string;
    duplicadosPermitidos: boolean;
}

// Función para crear Excel con metadatos (adaptada de tu servicio MUM)
const createBase64ExcelWithMetadata = (
    data: ExcelRow[], 
    sheetName: string = "Muestra Aleatoria",
    metadata: SampleMetadata
): string => {
    const workbook = XLSX.utils.book_new();
    
    // ✅ HOJA 1: METADATOS (como en MUM)
    const metadataRows = [
        ['INFORMACIÓN DE LA MUESTRA ALEATORIA', '', '', ''],
        ['Fecha de generación:', metadata.fechaGeneracion, '', ''],
        ['Tamaño de muestra:', metadata.tamanoMuestra, '', ''],
        ['Semilla utilizada:', metadata.semillaUtilizada, '', ''],
        ['Población total:', metadata.poblacionTotal, '', ''],
        ['Método de muestreo:', metadata.metodoMuestreo, '', ''],
        ['Duplicados permitidos:', metadata.duplicadosPermitidos ? 'Sí' : 'No', '', ''],
        ['', '', '', ''],
        ['MUESTRA ALEATORIA GENERADA', '', '', ''] // Encabezado para los datos
    ];
    
    const metadataSheet = XLSX.utils.aoa_to_sheet(metadataRows);
    XLSX.utils.book_append_sheet(workbook, metadataSheet, "Metadatos");
    
    // ✅ HOJA 2: DATOS DE LA MUESTRA (como en MUM)
    if (data.length > 0) {
        // Agregar número de muestra como primera columna
        const dataWithSampleNumber = data.map((row, index) => ({
            '#_MUESTRA': index + 1,
            ...row
        }));
        
        const dataSheet = XLSX.utils.json_to_sheet(dataWithSampleNumber);
        XLSX.utils.book_append_sheet(workbook, dataSheet, sheetName);
    }
    
    // Generar archivo
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const buffer = Buffer.from(excelBuffer);
    return buffer.toString('base64');
};

// Función principal de exportación para Atributos
export const exportarMuestraAtributos = (params: {
    randomSample: ExcelRow[];
    sampleSize: number;
    seed: number;
    populationSize: number;
    allowDuplicates: boolean;
    outputFileName: string;
}): { base64: string; filename: string } => {
    
    const { 
        randomSample, 
        sampleSize, 
        seed, 
        populationSize, 
        allowDuplicates,
        outputFileName 
    } = params;
    
    // Metadatos (similar a las columnas de auditoría de MUM)
    const metadata: SampleMetadata = {
        fechaGeneracion: new Date().toLocaleString('es-ES'),
        tamanoMuestra: sampleSize,
        semillaUtilizada: seed,
        poblacionTotal: populationSize,
        metodoMuestreo: allowDuplicates ? 'Muestreo con reemplazo' : 'Muestreo sin reemplazo',
        duplicadosPermitidos: allowDuplicates
    };
    
    // Limpiar datos (remover _sampleInfo como en MUM)
    const cleanSample = randomSample.map(item => {
        const { _sampleInfo, ...cleanItem } = item;
        return cleanItem;
    });
    
    // Generar Excel (similar a executeExtraction de MUM)
    const base64 = createBase64ExcelWithMetadata(cleanSample, "Muestra Aleatoria", metadata);
    
    // Nombre de archivo con timestamp (como en MUM)
    const timestamp = new Date().getTime();
    const filename = `${outputFileName}_${timestamp}.xlsx`;
    
    return { base64, filename };
};

// Función para descargar el archivo (compatible con tu enfoque actual)
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