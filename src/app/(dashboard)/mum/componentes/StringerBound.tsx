import React, { useState, useEffect } from 'react';
import { formatNumber, readExcelFile, mumApi } from '@/lib/apiClient';
import { HelpButton } from './HelpButtonEvaluation';
import { useLog } from '@/contexts/LogContext'; // ✅ Agregar importación

interface StringerBoundFormProps {
    onOk: (method: 'stringer-bound', result?: any) => Promise<void>; 
    confidenceLevel: number;
    estimatedPopulationValue: number;
    estimatedSampleSize: number;
    sampleInterval: number;
    tolerableError: number;  
    highValueLimit: number;
    precisionValue: number;
    setPrecisionValue: (value: number) => void;
    selectedField: string | null;
}

const StringerBoundForm: React.FC<StringerBoundFormProps> = ({ 
    onOk, 
    confidenceLevel, 
    estimatedPopulationValue, 
    estimatedSampleSize, 
    sampleInterval, 
    tolerableError, 
    highValueLimit, 
    precisionValue, 
    setPrecisionValue,
    selectedField,
}) => {
    const [initialFile, setInitialFile] = useState<File | null>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [selectedFileName, setSelectedFileName] = useState<string>('');
    const [highValueFile, setHighValueFile] = useState<File | null>(null);
    const [resultName, setResultName] = useState("Monetary Unit Sampling - Stringer Bound Evaluation");
    const [isLoading, setIsLoading] = useState(false);
    
    const [bookValueField, setBookValueField] = useState<string>('');
    const [auditedValueField, setAuditedValueField] = useState<string>('');
    const [referenceField, setReferenceField] = useState<string>('');
    
    const [useHighValueFile, setUseHighValueFile] = useState(false);
    
    const [headers, setHeaders] = useState<string[]>([]);
    const [basicPrecision, setBasicPrecision] = useState(0);

    const [highValueHeaders, setHighValueHeaders] = useState<string[]>([]);
    const [highValueBookField, setHighValueBookField] = useState<string>('');
    const [highValueAuditedField, setHighValueAuditedField] = useState<string>('');
    const [highValueReferenceField, setHighValueReferenceField] = useState<string>('');
    const [highValueItems, setHighValueItems] = useState<any[]>([]);

    // ✅ Agregar hook de logs
    const { addLog } = useLog();

    // Cálculo de precisión básica
    useEffect(() => {
        if (estimatedPopulationValue && confidenceLevel) {
            const reliabilityFactors = {
                80: 1.61,
                85: 1.90,
                90: 2.31,
                95: 3.00,
                99: 4.61,
            };
            
            const factor = reliabilityFactors[confidenceLevel as keyof typeof reliabilityFactors] || 3.00;
            const precision = factor * sampleInterval;
            setBasicPrecision(precision);
        }
    }, [estimatedPopulationValue, confidenceLevel, sampleInterval]);

    // ✅ FUNCIÓN PARA ARCHIVO PRINCIPAL CON LOGS
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const newFiles = Array.from(event.target.files || []);

        if (!initialFile && newFiles.length > 0) {
            const firstFile = newFiles[0];
            setInitialFile(firstFile);
            setSelectedFileName(firstFile.name);
            setFiles(newFiles.slice(1));
            
            try {
                const fileData = await readExcelFile(firstFile);
                
                if (fileData.length > 0) {
                    const realHeaders = Object.keys(fileData[0]);
                    setHeaders(realHeaders);
                    
                    if (selectedField && realHeaders.includes(selectedField)) {
                        setBookValueField(selectedField);
                    } else if (realHeaders.includes('AUDIT_AMT')) {
                        setBookValueField(realHeaders[0]);
                    }
                    
                    if (realHeaders.includes('AUDIT_AMT')) setAuditedValueField('AUDIT_AMT');
                    if (realHeaders.includes('REFERENCE')) setReferenceField('REFERENCE');

                    if ((!selectedField || !realHeaders.includes(selectedField)) && realHeaders.length > 0) {
                        setBookValueField(realHeaders[0]);
                    }

                    // ✅ LOG: Archivo principal cargado
                    addLog(
                        'Usuario cargó archivo principal para Stringer Bound',
                        `Archivo: ${firstFile.name}\nElementos: ${fileData.length}\nCampos: ${realHeaders.length}`,
                        'evaluación',
                        'user'
                    );
                }
            } catch (error) {
                console.error("Error leyendo archivo:", error);
                const defaultHeaders = selectedField ? [selectedField, 'AUDIT_AMT', 'REFERENCE'] : ['AUDIT_AMT', 'REFERENCE'];
                setHeaders(defaultHeaders);
                
                if (selectedField && defaultHeaders.includes(selectedField)) {
                    setBookValueField(selectedField);
                } else if (defaultHeaders.includes('AUDIT_AMT')) {
                    setBookValueField(defaultHeaders[0]);
                }
                
                if (defaultHeaders.includes('AUDIT_AMT')) setAuditedValueField('AUDIT_AMT');
                if (defaultHeaders.includes('REFERENCE')) setReferenceField('REFERENCE');

                // ✅ LOG: Error al procesar archivo
                addLog(
                    'Error al procesar archivo principal',
                    `Archivo: ${firstFile.name}\nError: ${error}`,
                    'evaluación',
                    'system'
                );
            }

        } else {
            const existingFileNames = new Set(files.map(file => file.name));
            if (initialFile) {
                existingFileNames.add(initialFile.name);
            }
            const uniqueNewFiles = newFiles.filter(newFile => !existingFileNames.has(newFile.name));
            setFiles([...files, ...uniqueNewFiles]);

            // ✅ LOG: Archivos adicionales cargados
            if (uniqueNewFiles.length > 0) {
                addLog(
                    'Usuario agregó archivos adicionales',
                    `Archivos: ${uniqueNewFiles.map(f => f.name).join(', ')}`,
                    'evaluación',
                    'user'
                );
            }
        }

        event.target.value = ''; 
    };

    // ✅ FUNCIÓN PARA ARCHIVO DE VALORES ALTOS CON LOGS
    const handleHighValueFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setHighValueFile(file);
            
            try {
                const fileData = await readExcelFile(file);
                
                if (fileData.length > 0) {
                    const headers = Object.keys(fileData[0]);
                    setHighValueHeaders(headers);

                    let selectedBookField = bookValueField;
                    
                    if (!headers.includes(selectedBookField)) {
                        console.warn(`El campo "${selectedBookField}" no existe en el archivo de valores altos. Buscando alternativas...`);
                        
                        const alternativeField = headers.find(header => 
                            header.toUpperCase().includes(selectedBookField.toUpperCase()) ||
                            selectedBookField.toUpperCase().includes(header.toUpperCase())
                        );
                        
                        if (alternativeField) {
                            selectedBookField = alternativeField;
                        } else if (headers.length > 0) {
                            selectedBookField = headers[0];
                        }
                    }

                    let selectedAuditedField = '';
                    let selectedReferenceField = '';

                    headers.forEach(header => {
                        const upperHeader = header.toUpperCase();
                        
                        if (!selectedAuditedField && (
                            upperHeader.includes('AUDIT_AMT') ||  
                            upperHeader.includes('AUDIT') ||
                            upperHeader.includes('AUDITED') ||
                            upperHeader.includes('VERIFICADO') ||
                            upperHeader.includes('REVISADO')
                        )) {
                            selectedAuditedField = header;
                        }
                        
                        if (!selectedReferenceField && (
                            upperHeader.includes('REF') || 
                            upperHeader.includes('ID') ||
                            upperHeader.includes('REFERENCE')
                        )) {
                            selectedReferenceField = header;
                        }
                    });

                    if (!selectedAuditedField) {
                        selectedAuditedField = headers.find(h => 
                            h.toUpperCase().includes('AUDIT_AMT') || 
                            h.toUpperCase().includes('AUDITED_VALUE')
                        ) || '';
                    }

                    if (!selectedReferenceField) {
                        selectedReferenceField = headers.find(h => 
                            h.toUpperCase().includes('REFERENCE') || 
                            h.toUpperCase().includes('ID')
                        ) || '';
                    }

                    setHighValueBookField(selectedBookField);
                    setHighValueAuditedField(selectedAuditedField);
                    setHighValueReferenceField(selectedReferenceField);

                    setHighValueItems(fileData);

                    // ✅ LOG: Archivo de valores altos cargado
                    addLog(
                        'Usuario cargó archivo de valores altos para Stringer Bound',
                        `Archivo: ${file.name}\nElementos: ${fileData.length}\nCampos detectados: ${headers.length}`,
                        'evaluación',
                        'user'
                    );
                }
            } catch (error) {
                console.error("Error procesando archivo de valores altos:", error);
                addLog(
                    'Error al cargar archivo de valores altos',
                    `Archivo: ${file.name}\nError: ${error}`,
                    'evaluación',
                    'system'
                );
                alert("Error al procesar el archivo de valores altos");
            }
        } else {
            setHighValueFile(null);
            setHighValueHeaders([]);
            setHighValueBookField('');
            setHighValueAuditedField('');
            setHighValueReferenceField('');
            setHighValueItems([]);
        }
    };

    // ✅ FUNCIÓN PARA CALCULAR ESTADÍSTICAS DE VALORES ALTOS
    const calculateHighValueStats = (items: any[]) => {
        if (!items || items.length === 0) {
            return { total: 0, count: 0 };
        }

        const total = items.reduce((sum, item) => {
            const bookValue = parseFloat(item[highValueBookField]) || 0;
            return sum + bookValue;
        }, 0);

        return {
            total: Math.round(total * 100) / 100,
            count: items.length
        };
    };

    // ✅ MANEJAR CAMBIO DE NOMBRE DE RESULTADO CON LOG
    const handleResultNameChange = (name: string) => {
        setResultName(name);
        addLog(
            'Usuario modificó nombre del resultado',
            `Nuevo nombre: ${name}`,
            'evaluación',
            'user'
        );
    };

    // ✅ MANEJAR CAMBIO DE GESTIÓN DE VALORES ALTOS CON LOG
    const handleHighValueManagementChange = (enabled: boolean) => {
        setUseHighValueFile(enabled);
        addLog(
            'Usuario modificó gestión de valores altos',
            `Archivo separado para valores altos: ${enabled ? 'Activado' : 'Desactivado'}`,
            'evaluación',
            'user'
        );
    };

    // ✅ CORREGIR handleOkClick CON LOGS
    const handleOkClick = async () => {
    try {
        // ✅ AGREGAR VALIDACIÓN COMPLETA ANTES DEL LOG
        if (!initialFile || !bookValueField || !auditedValueField) {
            alert("Por favor, complete todos los campos requeridos");
            return;
        }

        if (useHighValueFile && (!highValueBookField || !highValueAuditedField)) {
            alert("Por favor, complete los campos para el archivo de valores altos");
            return;
        }

        setIsLoading(true);

        // ✅ LOG: Inicio de evaluación - CON VALIDACIÓN SEGURA
        addLog(
            'Iniciando evaluación Stringer Bound',
            `Archivo principal: ${initialFile.name}\nArchivos adicionales: ${files.length}\nValores altos: ${useHighValueFile ? 'Sí' : 'No'}`,
            'evaluación',
            'system'
        );

        // 1. LEER Y PROCESAR ARCHIVO PRINCIPAL
        const fileData = await readExcelFile(initialFile);
        
        // 2. PREPARAR DATOS REALES DE MUESTRA
        const processedSampleData = fileData.map((row: any) => ({
            reference: row[referenceField]?.toString() || `item-${Math.random()}`,
            bookValue: parseFloat(row[bookValueField]) || 0,
            auditedValue: parseFloat(row[auditedValueField]) || 0
        }));

        // 3. PREPARAR DATOS DE VALORES ALTOS
        let highValueData: any[] = [];
        let highValueStats = { total: 0, count: 0 };

        if (useHighValueFile && highValueItems.length > 0) {
            highValueData = highValueItems.map((row: any) => ({
                reference: row[highValueReferenceField]?.toString() || `high-value-${Math.random()}`,
                bookValue: parseFloat(row[highValueBookField]) || 0,
                auditedValue: parseFloat(row[highValueAuditedField]) || 0
            }));

            highValueStats = calculateHighValueStats(highValueItems);
        }

        // ✅ VALIDACIONES CRÍTICAS
        if (!processedSampleData || processedSampleData.length === 0) {
            throw new Error("No hay datos de muestra para evaluar");
        }

        if (!sampleInterval || sampleInterval <= 0) {
            throw new Error("Intervalo de muestreo no válido");
        }

        // ✅ CALCULAR populationExcludingHigh CORRECTAMENTE
        const populationExcludingHighValue = estimatedPopulationValue - highValueStats.total;

        // 4. PREPARAR DATOS PARA EL BACKEND
        const evaluationData = {
            sampleData: processedSampleData,
            sampleInterval: Number(sampleInterval),
            confidenceLevel: Number(confidenceLevel),
            populationValue: Number(estimatedPopulationValue),
            highValueItems: highValueData,
            populationExcludingHigh: Number(populationExcludingHighValue),
            highValueTotal: Number(highValueStats.total),
            highValueCountResume: Number(highValueStats.count),
            tolerableError: Number(tolerableError),
            highValueLimit: Number(highValueLimit)
        };

        // ✅ SOLO UNA LLAMADA A LA API
        const result = await mumApi.stringerBoundEvaluation(evaluationData);

        // ✅ LOG: Evaluación completada exitosamente
        addLog(
            'Evaluación Stringer Bound completada',
            `Elementos procesados: ${processedSampleData.length}\nValores altos: ${highValueStats.count}\nResultado generado: ${resultName}`,
            'evaluación',
            'system'
        );

        // ✅ PASAR EL RESULTADO AL PADRE SIN LLAMAR A addLog
        await onOk('stringer-bound', {
            ...result,
            // ✅ AGREGAR INFORMACIÓN ADICIONAL PARA EVITAR DUPLICACIÓN
            sampleSize: processedSampleData.length,
            highValueCount: highValueStats.count
        });

    } catch (error: any) {
        console.error("❌ Error detallado en handleOkClick:", {
            message: error.message,
            stack: error.stack
        });
        
        // ✅ LOG: Error en evaluación
        addLog(
            'Error en evaluación Stringer Bound',
            `Error: ${error.message}`,
            'evaluación',
            'system'
        );
        
        alert(`Error en evaluación: ${error.message}`);
    } finally {
        setIsLoading(false);
    }
};

    const handleRemoveFile = (fileName: string) => {
        if (initialFile?.name !== fileName) {
            setFiles(files.filter(file => file.name !== fileName));
            addLog(
                'Usuario eliminó archivo',
                `Archivo: ${fileName}`,
                'evaluación',
                'user'
            );
        }
    };

    const getHeadersForDropdown = () => {
        return headers;
    };

    const allFiles = initialFile ? [initialFile, ...files] : [...files];

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex">
                <div className="flex-1 space-y-6">

                    {/* Archivos a evaluar */}
                    <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-bold text-gray-800">Archivos a evaluar</h3>
                            <HelpButton context="stringer-files-config" />
                        </div>
                        <div className="mt-4">
                            <input
                                type="file"
                                multiple
                                onChange={handleFileChange}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            <ul className="mt-2 space-y-1">
                                {allFiles.map(file => (
                                    <li key={file.name} className="flex items-center justify-between text-sm text-gray-700">
                                        <span>{file.name}</span>
                                        {file.name !== initialFile?.name && (
                                            <button
                                                onClick={() => handleRemoveFile(file.name)}
                                                className="ml-2 text-red-500 hover:text-red-700"
                                            >
                                                (Eliminar)
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Opciones de configuración */}
                    <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-bold text-gray-800">Configuración de Evaluación</h3>
                            <HelpButton context="stringer-result-config" />
                        </div>
                        <div className="flex items-center space-x-4">
                            <label className="text-sm font-medium text-gray-700 w-48">Nivel de confianza (%):</label>
                            <input 
                                type="text" 
                                value={formatNumber(confidenceLevel,2) || ''}
                                disabled={true}
                                className="block w-30 rounded-md border-gray-300 shadow-sm sm:text-sm text-center bg-gray-200 cursor-not-allowed"
                            />
                        </div>
                    </div>

                    {/* Secciones restantes */}
                    <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-bold text-gray-800">Configuración de Archivos</h3>
                            <HelpButton context="stringer-files-config" />
                        </div>
                        <div className="flex items-center space-x-4 mb-4">
                            <label className="text-sm font-medium text-gray-700 w-48">Nombre del archivo:</label>
                            <select
                                value={selectedFileName}
                                onChange={(e) => {
                                    setSelectedFileName(e.target.value);
                                    addLog(
                                        'Usuario seleccionó archivo principal',
                                        `Archivo: ${e.target.value}`,
                                        'evaluación',
                                        'user'
                                    );
                                }}
                                disabled={allFiles.length === 0}
                                className={`block flex-1 rounded-md border-gray-300 shadow-sm sm:text-sm ${allFiles.length === 0 ? 'bg-gray-200 cursor-not-allowed' : ''}`}
                            >
                                {allFiles.map(file => (
                                    <option key={file.name} value={file.name}>{file.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center space-x-4">
                            <label className="text-sm font-medium text-gray-700 w-48">Nombre del resultado:</label>
                            <input
                                type="text"
                                value={resultName}
                                onChange={(e) => handleResultNameChange(e.target.value)}
                                className="block flex-1 rounded-md border-gray-300 shadow-sm sm:text-sm"
                            />
                        </div>
                    </div>

                    {/* Campos de columna - ARCHIVO PRINCIPAL */}
                    <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-bold text-gray-800">Configuración de Campos y Parámetros</h3>
                            <HelpButton context="stringer-basic-precision" />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            {/* Columna izquierda */}
                             <div className="space-y-4">
                                <div className="flex items-center space-x-4">
                                    <label className="text-sm font-medium text-gray-700 w-68">Valor de la población muestreada:</label>
                                    <input 
                                        type="text" 
                                        value={formatNumber(estimatedPopulationValue,2)}
                                        disabled={true}
                                        className="block w-40 rounded-md border-gray-300 shadow-sm sm:text-sm text-center bg-gray-200 cursor-not-allowed" 
                                    />
                                </div>
                                <div className="flex items-center space-x-4">
                                    <label className="text-sm font-medium text-gray-700 w-68">Tamaño de la muestra:</label>
                                    <input 
                                        type="text" 
                                        value={formatNumber(estimatedSampleSize,2)}
                                        disabled={true}
                                        className="block w-40 rounded-md border-gray-300 shadow-sm sm:text-sm text-center bg-gray-200 cursor-not-allowed" 
                                    />
                                </div>
                                <div className="flex items-center space-x-4">
                                    <label className="text-sm font-medium text-gray-700 w-68">Precisión Básica de la Fijación de Precios:</label>
                                    <input 
                                        type="text"
                                        value={formatNumber(basicPrecision,2)}
                                        disabled={true}
                                        className="block w-40 rounded-md border-gray-300 shadow-sm sm:text-sm text-center bg-gray-200 cursor-not-allowed"
                                    />
                                </div>
                            </div>
                            {/* Columna derecha */}
                            <div className="space-y-4">
                                <div className="flex items-center space-x-4">
                                    <label className="text-sm font-medium text-gray-700 w-48">Book value field:</label>
                                    <select
                                        value={bookValueField}
                                        onChange={(e) => {
                                            setBookValueField(e.target.value);
                                            addLog(
                                                'Usuario cambió campo de book value',
                                                `Nuevo campo: ${e.target.value}`,
                                                'evaluación',
                                                'user'
                                            );
                                        }}
                                        className="block w-48 rounded-md border-gray-300 shadow-sm sm:text-sm"
                                        disabled={headers.length === 0}
                                    >
                                        <option value="">Selecciona una columna</option>
                                        {getHeadersForDropdown().map(header => (
                                            <option key={header} value={header}>{header}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <label className="text-sm font-medium text-gray-700 w-48">Audited value field:</label>
                                    <select
                                        value={auditedValueField}
                                        onChange={(e) => {
                                            setAuditedValueField(e.target.value);
                                            addLog(
                                                'Usuario cambió campo de audited value',
                                                `Nuevo campo: ${e.target.value}`,
                                                'evaluación',
                                                'user'
                                            );
                                        }}
                                        className="block w-48 rounded-md border-gray-300 shadow-sm sm:text-sm"
                                        disabled={headers.length === 0}
                                    >
                                        <option value="">Selecciona una columna</option>
                                        {getHeadersForDropdown().map(header => (
                                            <option key={header} value={header}>{header}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <label className="text-sm font-medium text-gray-700 w-48">Reference (optional):</label>
                                    <select
                                        value={referenceField}
                                        onChange={(e) => {
                                            setReferenceField(e.target.value);
                                            if (e.target.value) {
                                                addLog(
                                                    'Usuario cambió campo de referencia',
                                                    `Nuevo campo: ${e.target.value}`,
                                                    'evaluación',
                                                    'user'
                                                );
                                            }
                                        }}
                                        className="block w-48 rounded-md border-gray-300 shadow-sm sm:text-sm"
                                        disabled={headers.length === 0}
                                    >
                                        <option value="">Selecciona una columna</option>
                                        {getHeadersForDropdown().map(header => (
                                            <option key={header} value={header}>{header}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ✅ MANEJO DE VALORES ALTOS */}
                    <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-bold text-gray-800">Manejo de Valores Altos</h3>
                            <HelpButton context="high-value-management" />
                        </div>
                        <div className="flex items-center space-x-4 mt-2">
                            <input
                                type="checkbox"
                                checked={useHighValueFile}
                                onChange={(e) => handleHighValueManagementChange(e.target.checked)}
                                className="h-4 w-4 text-blue-600 rounded"
                            />
                            <label className="text-sm font-medium text-gray-700">Los elementos de valor alto están en un archivo</label>
                            <button
                                onClick={() => document.getElementById('high-value-file-input')?.click()}
                                disabled={!useHighValueFile}
                                className={`bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-md shadow ${
                                    !useHighValueFile ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                            >
                                Seleccionar archivo de valores altos
                            </button>
                            <input
                                id="high-value-file-input"
                                type="file"
                                onChange={handleHighValueFileChange}
                                className="hidden"
                            />
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                            Archivo de valores altos: {highValueFile ? highValueFile.name : "(Ningún archivo seleccionado)"}
                            {highValueItems.length > 0 && ` - ${highValueItems.length} elementos cargados`}
                        </p>
                        
                        <div className="space-y-4 mt-4 p-4">
                            <div className="flex items-center space-x-4">
                                <label className="text-sm font-medium text-gray-700 w-48">Book value field:</label>
                                <select 
                                    value={highValueBookField}
                                    onChange={(e) => {
                                        setHighValueBookField(e.target.value);
                                        addLog(
                                            'Usuario cambió campo de book value para valores altos',
                                            `Nuevo campo: ${e.target.value}`,
                                            'evaluación',
                                            'user'
                                        );
                                    }}
                                    disabled={!useHighValueFile || highValueHeaders.length === 0}
                                    className={`block w-48 rounded-md border-gray-300 shadow-sm sm:text-sm ${
                                        !useHighValueFile || highValueHeaders.length === 0 ? 'bg-gray-200 cursor-not-allowed' : ''
                                    }`}
                                >
                                    <option value="">Selecciona una columna</option>
                                    {highValueHeaders.map(header => (
                                        <option key={header} value={header}>{header}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center space-x-4">
                                <label className="text-sm font-medium text-gray-700 w-48">Audited value field:</label>
                                <select 
                                    value={highValueAuditedField}
                                    onChange={(e) => {
                                        setHighValueAuditedField(e.target.value);
                                        addLog(
                                            'Usuario cambió campo de audited value para valores altos',
                                            `Nuevo campo: ${e.target.value}`,
                                            'evaluación',
                                            'user'
                                        );
                                    }}
                                    disabled={!useHighValueFile || highValueHeaders.length === 0}
                                    className={`block w-48 rounded-md border-gray-300 shadow-sm sm:text-sm ${
                                        !useHighValueFile || highValueHeaders.length === 0 ? 'bg-gray-200 cursor-not-allowed' : ''
                                    }`}
                                >
                                    <option value="">Selecciona una columna</option>
                                    {highValueHeaders.map(header => (
                                        <option key={header} value={header}>{header}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center space-x-4">
                                <label className="text-sm font-medium text-gray-700 w-48">Reference (optional):</label>
                                <select 
                                    value={highValueReferenceField}
                                    onChange={(e) => {
                                        setHighValueReferenceField(e.target.value);
                                        if (e.target.value) {
                                            addLog(
                                                'Usuario cambió campo de referencia para valores altos',
                                                `Nuevo campo: ${e.target.value}`,
                                                'evaluación',
                                                'user'
                                            );
                                        }
                                    }}
                                    disabled={!useHighValueFile || highValueHeaders.length === 0}
                                    className={`block w-48 rounded-md border-gray-300 shadow-sm sm:text-sm ${
                                        !useHighValueFile || highValueHeaders.length === 0 ? 'bg-gray-200 cursor-not-allowed' : ''
                                    }`}
                                >
                                    <option value="">Selecciona una columna</option>
                                    {highValueHeaders.map(header => (
                                        <option key={header} value={header}>{header}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Columna de botones a la derecha */}
                <div className="ml-8 flex flex-col justify-start space-y-4">
                    <button
                        onClick={handleOkClick}
                        disabled={isLoading}
                        className={`font-semibold py-2 px-6 rounded-md shadow transition-colors ${
                            isLoading 
                                ? 'bg-blue-400 cursor-not-allowed' 
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                    >
                        {isLoading ? 'Procesando...' : 'Ok'}
                    </button>
                    <button className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-6 rounded-md shadow transition-colors">
                        Cancelar
                    </button>
                    
                    <div className="flex justify-center">
                        <HelpButton 
                            context="stringer-bound-method" 
                            className="bg-orange-400 hover:bg-orange-500 text-white font-semibold py-2 px-4 rounded-full shadow w-full" 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StringerBoundForm;