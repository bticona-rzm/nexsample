import React, { useState, useEffect } from 'react';
import { formatNumber, readExcelFile } from '@/lib/apiClient';

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
    selectedField: string | null; // ✅ NUEVA PROP: campo seleccionado en planificación
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
    selectedField // ✅ RECIBIR el campo seleccionado
}) => {
    const [initialFile, setInitialFile] = useState<File | null>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [selectedFileName, setSelectedFileName] = useState<string>('');
    const [highValueFile, setHighValueFile] = useState<File | null>(null);
    const [resultName, setResultName] = useState("Monetary Unit Sampling - Stringer Bound Evaluation");
    const [isLoading, setIsLoading] = useState(false);
    
    // CAMPOS DE COLUMNA PARA EL ARCHIVO PRINCIPAL
    const [bookValueField, setBookValueField] = useState('');
    const [auditedValueField, setAuditedValueField] = useState('');
    const [referenceField, setReferenceField] = useState('');
    
    // ESTADO PARA ARCHIVOS DE ALTO VALOR
    const [useHighValueFile, setUseHighValueFile] = useState(false);
    const [highValueFileName, setHighValueFileName] = useState<string | null>(null);
    
    // CORRECCIÓN: CAMPOS DE COLUMNA SEPARADOS PARA EL ARCHIVO DE ALTO VALOR
    const [highValueBookValueField, setHighValueBookValueField] = useState<string>('');
    const [highValueAuditedValueField, setHighValueAuditedValueField] = useState<string>('');
    const [highValueReferenceField, setHighValueReferenceField] = useState<string>('');
    
    // Nuevo estado para los encabezados
    const [headers, setHeaders] = useState<string[]>([]);
    const [basicPrecision, setBasicPrecision] = useState(0);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // 1. Obtener los archivos seleccionados ANTES de limpiar el valor del input
        const newFiles = Array.from(event.target.files || []);

        if (!initialFile && newFiles.length > 0) {
            setInitialFile(newFiles[0]);
            setSelectedFileName(newFiles[0].name);
            setFiles(newFiles.slice(1));
            
            // ✅ CORREGIDO: Usar selectedField en lugar de 'TOTAL'
            const fileHeaders = selectedField ? [selectedField, 'AUDIT_AMT', 'REFERENCE'] : ['AUDIT_AMT', 'REFERENCE'];
            setHeaders(fileHeaders);
            
            // ✅ CORREGIDO: Usar selectedField para bookValueField
            if (selectedField && fileHeaders.includes(selectedField)) {
                setBookValueField(selectedField);
            } else if (fileHeaders.includes('AUDIT_AMT')) {
                setBookValueField(fileHeaders[0]); // Usar primer header disponible
            }
            
            if (fileHeaders.includes('AUDIT_AMT')) setAuditedValueField('AUDIT_AMT');
            if (fileHeaders.includes('REFERENCE')) setReferenceField('REFERENCE');

            // Si no hay selectedField o no existe en los headers, usar el primero disponible
            if ((!selectedField || !fileHeaders.includes(selectedField)) && fileHeaders.length > 0) {
                setBookValueField(fileHeaders[0]);
                console.warn(selectedField ? 
                    `El campo seleccionado "${selectedField}" no se encontró en el archivo. Usando "${fileHeaders[0]}" en su lugar.` :
                    `No se especificó un campo seleccionado. Usando "${fileHeaders[0]}" como Book Value Field.`
                );
            }

        } else {
            const existingFileNames = new Set(files.map(file => file.name));
            if (initialFile) {
                existingFileNames.add(initialFile.name);
            }
            const uniqueNewFiles = newFiles.filter(newFile => !existingFileNames.has(newFile.name));
            setFiles([...files, ...uniqueNewFiles]);
        }

        // 2. Limpiar el valor del input AL FINAL
        event.target.value = ''; 
    };

    const handleHighValueFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        
        if (file) {
            setHighValueFile(file);
            setHighValueFileName(file.name); 
            
            // **CORRECCIÓN 2: Lógica de pre-selección si se sube el archivo de alto valor.**
            // Asume que el archivo de Alto Valor tiene los mismos encabezados (headers) y copia la selección del principal.
            if (headers.length > 0) {
                 if (bookValueField) setHighValueBookValueField(bookValueField);
                 if (auditedValueField) setHighValueAuditedValueField(auditedValueField);
                 if (referenceField) setHighValueReferenceField(referenceField);
            } else {
                // Fallback o lógica si el archivo de alto valor tiene encabezados únicos y el principal no tiene
                const highValueHeaders = ['MONTO', 'VALOR_AUDITADO', 'ID_TRANSACCION'];
                if (highValueHeaders.includes('MONTO')) setHighValueBookValueField('MONTO');
                if (highValueHeaders.includes('VALOR_AUDITADO')) setHighValueAuditedValueField('VALOR_AUDITADO');
            }

        } else {
            setHighValueFile(null);
            setHighValueFileName(null);
        }
        
        event.target.value = '';
    };

    const handleRemoveFile = (fileName: string) => {
        if (initialFile?.name !== fileName) {
            setFiles(files.filter(file => file.name !== fileName));
        }
    };

    const handleOkClick = async () => {
        if (!initialFile || !bookValueField || !auditedValueField) {
            alert("Por favor, complete todos los campos requeridos");
            return;
        }

        setIsLoading(true);

        try {
            // 1. LEER ARCHIVO REAL
            const fileData = await readExcelFile(initialFile);
            
            // 2. PROCESAR DATOS
            const sampleData = fileData.map((row: any) => ({
                reference: row[referenceField]?.toString() || `item-${Math.random()}`,
                bookValue: parseFloat(row[bookValueField]) || 0, // ✅ Usa el campo correcto
                auditedValue: parseFloat(row[auditedValueField]) || 0
            }));

            // 3. ENVIAR AL BACKEND STRINGER BOUND
            const response = await fetch('/api/mum/evaluation/stringer-bound', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sampleData,
                    sampleInterval,
                    confidenceLevel,
                    populationValue: estimatedPopulationValue,
                    tolerableError,
                    highValueLimit,
                    bookValueField: bookValueField, // ✅ Enviar el campo usado
                    auditedValueField: auditedValueField,
                    selectedFieldFromPlanning: selectedField // ✅ Para debugging en backend
                }),
            });

            if (!response.ok) throw new Error('Error en evaluación Stringer Bound');
            
            const results = await response.json();
            console.log("Resultados Stringer Bound:", results);
            console.log("Campo seleccionado en planificación:", selectedField); // ✅ Para debugging
            console.log("Campo usado para Book Value:", bookValueField);
            
            await onOk('stringer-bound');

        } catch (error: any) {
            console.error("Error en evaluación:", error);
            alert(`Error: ${error.message}`);
        } finally {
            setIsLoading(false);
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

    // 1. Efecto para calcular la Precisión Básica
    useEffect(() => {
        if (estimatedPopulationValue && confidenceLevel) {
            calculateBasicPrecision();
        }
    }, [estimatedPopulationValue, confidenceLevel]);

    // 2. NUEVO EFECTO: Auto-seleccionar los campos del archivo de Alto Valor
    useEffect(() => {
        // Solo pre-selecciona si la opción está activa Y ya tenemos encabezados cargados
        if (useHighValueFile && headers.length > 0) {
            // ✅ CORREGIDO: Usar lógica similar con selectedField
            if (selectedField && headers.includes(selectedField)) {
                setHighValueBookValueField(selectedField);
            } else if (headers.includes('AUDIT_AMT')) {
                setHighValueBookValueField(headers[0]);
            }
            if (headers.includes('AUDIT_AMT')) setHighValueAuditedValueField('AUDIT_AMT');
            if (headers.includes('REFERENCE')) setHighValueReferenceField('REFERENCE');
        } else if (!useHighValueFile) {
            // Opcional: Limpiar los campos si el usuario desactiva la opción
            setHighValueBookValueField('');
            setHighValueAuditedValueField('');
            setHighValueReferenceField('');
        }
    }, [useHighValueFile, headers, selectedField]);

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
                                className={`bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-md shadow ${!useHighValueFile ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                        </p>
                        <div className="space-y-4 mt-4">
                            <div className="flex items-center space-x-4">
                                <label className="text-sm font-medium text-gray-700 w-48">Book value field:</label>
                                <select className="block w-48 rounded-md border-gray-300 shadow-sm sm:text-sm"
                                    value={highValueBookValueField}
                                    onChange={(e) => setHighValueBookValueField(e.target.value)}
                                    disabled={!useHighValueFile}
                                >
                                    <option value="">Selecciona una columna</option>
                                    {headers.map(header => (
                                        <option key={header} value={header}>{header}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center space-x-4">
                                <label className="text-sm font-medium text-gray-700 w-48">Audited value field:</label>
                                <select className="block w-48 rounded-md border-gray-300 shadow-sm sm:text-sm"
                                    value={highValueAuditedValueField}
                                    onChange={(e) => setHighValueAuditedValueField(e.target.value)}
                                    disabled={!useHighValueFile}
                                >
                                    <option value="">Selecciona una columna</option>
                                    {headers.map(header => (
                                        <option key={header} value={header}>{header}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center space-x-4">
                                <label className="text-sm font-medium text-gray-700 w-48">Reference (optional):</label>
                                <select className="block w-48 rounded-md border-gray-300 shadow-sm sm:text-sm"
                                    value={highValueReferenceField}
                                    onChange={(e) => setHighValueReferenceField(e.target.value)}
                                    disabled={!useHighValueFile}
                                >
                                    <option value="">Selecciona una columna</option>
                                    {headers.map(header => (
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