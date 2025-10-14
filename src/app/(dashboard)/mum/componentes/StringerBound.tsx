import React, { useState, useEffect } from 'react';
import { formatNumber, readExcelFile, StringerBoundService, StringerBoundClient } from '@/lib/apiClient';

interface StringerBoundFormProps {
    onOk: (method: 'stringer-bound') => Promise<void>; 
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
    selectedField 
}) => {
    const [initialFile, setInitialFile] = useState<File | null>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [selectedFileName, setSelectedFileName] = useState<string>('');
    const [highValueFile, setHighValueFile] = useState<File | null>(null);
    const [resultName, setResultName] = useState("Monetary Unit Sampling - Stringer Bound Evaluation");
    const [isLoading, setIsLoading] = useState(false);
    
    // ✅ CAMPOS DE COLUMNA - EXACTO COMO CELL CLASSICAL
    const [bookValueField, setBookValueField] = useState<string>('');
    const [auditedValueField, setAuditedValueField] = useState<string>('');
    const [referenceField, setReferenceField] = useState<string>('');
    
    const [useHighValueFile, setUseHighValueFile] = useState(false);
    
    // ✅ HEADERS - EXACTO COMO CELL CLASSICAL
    const [headers, setHeaders] = useState<string[]>([]);
    const [basicPrecision, setBasicPrecision] = useState(0);

    // ✅ ESTADOS PARA VALORES ALTOS - EXACTO COMO CELL CLASSICAL
    const [highValueHeaders, setHighValueHeaders] = useState<string[]>([]);
    const [highValueBookField, setHighValueBookField] = useState<string>('');
    const [highValueAuditedField, setHighValueAuditedField] = useState<string>('');
    const [highValueReferenceField, setHighValueReferenceField] = useState<string>('');
    const [highValueItems, setHighValueItems] = useState<any[]>([]);

    // Cálculo de precisión básica
    useEffect(() => {
        if (estimatedPopulationValue && confidenceLevel) {
            const precision = StringerBoundService.calculateBasicPrecision(
                confidenceLevel, 
                sampleInterval
            );
            setBasicPrecision(precision);
        }
    }, [estimatedPopulationValue, confidenceLevel, sampleInterval]);

    // ✅ FUNCIÓN PARA ARCHIVO PRINCIPAL - IDÉNTICA A CELL CLASSICAL
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const newFiles = Array.from(event.target.files || []);

        if (!initialFile && newFiles.length > 0) {
            const firstFile = newFiles[0];
            setInitialFile(firstFile);
            setSelectedFileName(firstFile.name);
            setFiles(newFiles.slice(1));
            
            try {
                // Leer el archivo para obtener headers reales
                const fileData = await readExcelFile(firstFile);
                
                if (fileData.length > 0) {
                    const realHeaders = Object.keys(fileData[0]);
                    setHeaders(realHeaders);
                    
                    console.log("📋 HEADERS REALES DEL ARCHIVO:", realHeaders);
                    
                    // ✅ SELECCIÓN AUTOMÁTICA - EXACTA COMO CELL CLASSICAL
                    if (selectedField && realHeaders.includes(selectedField)) {
                        setBookValueField(selectedField);
                    } else if (realHeaders.includes('AUDIT_AMT')) {
                        setBookValueField(realHeaders[0]); // Usar primer header disponible
                    }
                    
                    if (realHeaders.includes('AUDIT_AMT')) setAuditedValueField('AUDIT_AMT');
                    if (realHeaders.includes('REFERENCE')) setReferenceField('REFERENCE');

                    // Si no hay selectedField o no existe en los headers, usar el primero disponible
                    if ((!selectedField || !realHeaders.includes(selectedField)) && realHeaders.length > 0) {
                        setBookValueField(realHeaders[0]);
                        console.warn(selectedField ? 
                            `El campo seleccionado "${selectedField}" no se encontró en el archivo. Usando "${realHeaders[0]}" en su lugar.` :
                            `No se especificó un campo seleccionado. Usando "${realHeaders[0]}" como Book Value Field.`
                        );
                    }

                }
            } catch (error) {
                console.error("Error leyendo archivo:", error);
                // Fallback exacto como Cell Classical
                const defaultHeaders = selectedField ? [selectedField, 'AUDIT_AMT', 'REFERENCE'] : ['AUDIT_AMT', 'REFERENCE'];
                setHeaders(defaultHeaders);
                
                if (selectedField && defaultHeaders.includes(selectedField)) {
                    setBookValueField(selectedField);
                } else if (defaultHeaders.includes('AUDIT_AMT')) {
                    setBookValueField(defaultHeaders[0]);
                }
                
                if (defaultHeaders.includes('AUDIT_AMT')) setAuditedValueField('AUDIT_AMT');
                if (defaultHeaders.includes('REFERENCE')) setReferenceField('REFERENCE');
            }

        } else {
            const existingFileNames = new Set(files.map(file => file.name));
            if (initialFile) {
                existingFileNames.add(initialFile.name);
            }
            const uniqueNewFiles = newFiles.filter(newFile => !existingFileNames.has(newFile.name));
            setFiles([...files, ...uniqueNewFiles]);
        }

        event.target.value = ''; 
    };

    // ✅ FUNCIÓN PARA ARCHIVO DE VALORES ALTOS - IDÉNTICA A CELL CLASSICAL
    const handleHighValueFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setHighValueFile(file);
            
            try {
                // Leer y procesar el archivo de valores altos
                const fileData = await readExcelFile(file);
                
                // Extraer headers del archivo de valores altos
                if (fileData.length > 0) {
                    const headers = Object.keys(fileData[0]);
                    setHighValueHeaders(headers);
                    
                    console.log("📋 HEADERS REALES DE VALORES ALTOS:", headers);
                    
                    // ✅ AUTO-SELECCIÓN - EXACTA COMO CELL CLASSICAL
                    if (headers.includes('BOOK_VALUE') || headers.includes('BOOK_VAL')) {
                        setHighValueBookField(headers.find(h => h.includes('BOOK')) || headers[0]);
                    } else if (headers.length > 0) {
                        setHighValueBookField(headers[0]);
                    }
                    
                    if (headers.includes('AUDITED_VALUE') || headers.includes('AUDIT_AMT')) {
                        setHighValueAuditedField(headers.find(h => h.includes('AUDIT')) || '');
                    }
                    
                    setHighValueReferenceField('REFERENCE')

                    // ✅ GUARDAR LOS DATOS PARA ENVIAR AL BACKEND
                    setHighValueItems(fileData);
                }
                
            } catch (error) {
                console.error("Error procesando archivo de valores altos:", error);
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

    // ✅ FUNCIÓN PARA CALCULAR ESTADÍSTICAS DE VALORES ALTOS - IDÉNTICA A CELL CLASSICAL
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

    // ✅ FUNCIÓN handleOkClick - IDÉNTICA A CELL CLASSICAL
    const handleOkClick = async () => {
        if (!initialFile || !bookValueField || !auditedValueField) {
            alert("Por favor, complete todos los campos requeridos");
            return;
        }

        // ✅ VALIDACIÓN PARA VALORES ALTOS - EXACTA COMO CELL CLASSICAL
        if (useHighValueFile && (!highValueBookField || !highValueAuditedField)) {
            alert("Por favor, complete los campos para el archivo de valores altos");
            return;
        }

        setIsLoading(true);

        try {
            // 1. LEER Y PROCESAR ARCHIVO PRINCIPAL
            const fileData = await readExcelFile(initialFile);
            
            // 2. PREPARAR DATOS REALES DE MUESTRA
            const sampleData = fileData.map((row: any) => ({
                reference: row[referenceField]?.toString() || `item-${Math.random()}`,
                bookValue: parseFloat(row[bookValueField]) || 0,
                auditedValue: parseFloat(row[auditedValueField]) || 0
            }));

            // 3. ✅ PREPARAR DATOS DE VALORES ALTOS - EXACTO COMO CELL CLASSICAL
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

            // ✅ DEBUG
            console.log("📤 ENVIANDO AL BACKEND STRINGER BOUND:", {
                sampleDataCount: sampleData.length,
                highValueItemsCount: highValueData.length,
                bookValueField,
                auditedValueField, 
                referenceField,
                highValueBookField,
                highValueAuditedField,
                highValueReferenceField
            });

            // 4. ENVIAR AL BACKEND
            const results = await StringerBoundClient.evaluate({
                sampleData: sampleData,
                sampleInterval: sampleInterval,
                confidenceLevel: confidenceLevel,  
                populationValue: estimatedPopulationValue,
                tolerableError: tolerableError,
                highValueLimit: highValueLimit,
                
                // ✅ DATOS DE VALORES ALTOS - EXACTO COMO CELL CLASSICAL
                highValueItems: highValueData,
                highValueTotal: highValueStats.total,
                highValueCountResume: highValueStats.count,
                populationExcludingHigh: estimatedPopulationValue - highValueStats.total
            });

            console.log("✅ RESULTADOS STRINGER BOUND:", results);
            
            await onOk('stringer-bound');

        } catch (error: any) {
            console.error("❌ Error en evaluación:", error);
            alert(`Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveFile = (fileName: string) => {
        if (initialFile?.name !== fileName) {
            setFiles(files.filter(file => file.name !== fileName));
        }
    };

    const getHeadersForDropdown = () => {
        return headers;
    };

    // Función para el cálculo de la precisión básica
    const calculateBasicPrecision = () => {
        const reliabilityFactors = {
            80: 1.61,
            85: 1.90,
            90: 2.31,
            95: 3.00,
            99: 4.61,
        };
        
        const factor = reliabilityFactors[confidenceLevel as keyof typeof reliabilityFactors] || 3.00;
        const result = factor * sampleInterval;
        setBasicPrecision(result);
    };

    // Efecto para calcular la Precisión Básica
    useEffect(() => {
        if (estimatedPopulationValue && confidenceLevel) {
            calculateBasicPrecision();
        }
    }, [estimatedPopulationValue, confidenceLevel]);

    const allFiles = initialFile ? [initialFile, ...files] : [...files];

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex">
                <div className="flex-1 space-y-6">

                    {/* Archivos a evaluar */}
                    <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
                        <h3 className="text-lg font-bold text-gray-800">Archivos a evaluar</h3>
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
                        <div className="flex items-center space-x-4 mb-4">
                            <label className="text-sm font-medium text-gray-700 w-48">Nombre del archivo:</label>
                            <select
                                value={selectedFileName}
                                onChange={(e) => setSelectedFileName(e.target.value)}
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
                                onChange={(e) => setResultName(e.target.value)}
                                className="block flex-1 rounded-md border-gray-300 shadow-sm sm:text-sm"
                            />
                        </div>
                    </div>

                    {/* Campos de columna - ARCHIVO PRINCIPAL */}
                    <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
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
                                        onChange={(e) => setBookValueField(e.target.value)}
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
                                        onChange={(e) => setAuditedValueField(e.target.value)}
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
                                        onChange={(e) => setReferenceField(e.target.value)}
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

                    {/* ✅ MANEJO DE VALORES ALTOS - EXACTO COMO CELL CLASSICAL */}
                    <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
                        <h3 className="text-lg font-bold text-gray-800">Manejo de Valores Altos</h3>
                        <div className="flex items-center space-x-4 mt-2">
                            <input
                                type="checkbox"
                                checked={useHighValueFile}
                                onChange={(e) => setUseHighValueFile(e.target.checked)}
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
                        
                        <div className="space-y-4 mt-4 p-4 ">
                                <div className="flex items-center space-x-4">
                                    <label className="text-sm font-medium text-gray-700 w-48">Book value field:</label>
                                    <select 
                                        value={highValueBookField}
                                        onChange={(e) => setHighValueBookField(e.target.value)}
                                        className="block w-48 rounded-md border-gray-300 shadow-sm sm:text-sm"
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
                                        onChange={(e) => setHighValueAuditedField(e.target.value)}
                                        className="block w-48 rounded-md border-gray-300 shadow-sm sm:text-sm"
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
                                        onChange={(e) => setHighValueReferenceField(e.target.value)}
                                        className="block w-48 rounded-md border-gray-300 shadow-sm sm:text-sm"
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
                    <button className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-6 rounded-md shadow transition-colors">
                        Ayuda
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StringerBoundForm;