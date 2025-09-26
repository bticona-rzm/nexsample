import React, { useState, useEffect } from 'react';

interface StringerBoundFormProps {
    // onOk espera un argumento 'stringer-bound'
    onOk: (method: 'stringer-bound') => Promise<void>; 
    confidenceLevel: number;
    estimatedPopulationValue: number;
    estimatedSampleSize: number;
}

const StringerBoundForm: React.FC<StringerBoundFormProps> = ({ onOk, confidenceLevel, estimatedPopulationValue, estimatedSampleSize }) => {
    const [initialFile, setInitialFile] = useState<File | null>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [selectedFileName, setSelectedFileName] = useState<string>('');
    const [highValueFile, setHighValueFile] = useState<File | null>(null);
    const [resultName, setResultName] = useState("Monetary Unit Sampling - Stringer Bound Evaluation");
    
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
    const [basicPrecision, setBasicPrecision] = useState(0); // Nuevo estado para la precisión básica

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // 1. Obtener los archivos seleccionados ANTES de limpiar el valor del input
        const newFiles = Array.from(event.target.files || []);

        if (!initialFile && newFiles.length > 0) {
            setInitialFile(newFiles[0]);
            setSelectedFileName(newFiles[0].name);
            setFiles(newFiles.slice(1));
            // Lógica para precargar campos del primer archivo (simulada)
            const fileHeaders = ['TOTAL', 'AUDIT_AMT', 'REFERENCE', 'OTRA_COLUMNA'];
            setHeaders(fileHeaders);
            if (fileHeaders.includes('TOTAL')) setBookValueField('TOTAL');
            if (fileHeaders.includes('AUDIT_AMT')) setAuditedValueField('AUDIT_AMT');
            if (fileHeaders.includes('REFERENCE')) setReferenceField('REFERENCE');
        } else {
            const existingFileNames = new Set(files.map(file => file.name));
            if (initialFile) {
                existingFileNames.add(initialFile.name);
            }
            const uniqueNewFiles = newFiles.filter(newFile => !existingFileNames.has(newFile.name));
            setFiles([...files, ...uniqueNewFiles]);
        }

        // 2. Limpiar el valor del input AL FINAL para permitir la re-selección.
        // Esto es crucial para que el evento 'onChange' se dispare la próxima vez
        // que se seleccione el mismo archivo (aunque aquí lo filtra por nombre) o nuevos archivos.
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
                // En un escenario real, aquí se cargan los encabezados del archivo 'file'.
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

    const getHeadersForDropdown = () => {
        return headers; // Ahora usa el estado 'headers'
    };

    // Función para el cálculo de la precisión básica
    const calculateBasicPrecision = () => {
        const ppsFactors = {
            80: 1.61,
            90: 2.31,
            95: 2.996,
            99: 4.605,
        } as const;

        const factor = ppsFactors[confidenceLevel as keyof typeof ppsFactors] || 2.996;
        const result = estimatedPopulationValue * factor;
        setBasicPrecision(result);
    };

    // 1. Efecto para calcular la Precisión Básica (Este ya lo tenías)
    useEffect(() => {
        if (estimatedPopulationValue && confidenceLevel) {
            calculateBasicPrecision();
        }
    }, [estimatedPopulationValue, confidenceLevel]); // Dependencias del efecto

    // 2. NUEVO EFECTO: Auto-seleccionar los campos del archivo de Alto Valor
    useEffect(() => {
        // Solo pre-selecciona si la opción está activa Y ya tenemos encabezados cargados
        if (useHighValueFile && headers.length > 0) {
            // Lógica de Pre-selección similar a la del archivo principal
            if (headers.includes('TOTAL')) setHighValueBookValueField('TOTAL');
            if (headers.includes('AUDIT_AMT')) setHighValueAuditedValueField('AUDIT_AMT');
            if (headers.includes('REFERENCE')) setHighValueReferenceField('REFERENCE');
        } else if (!useHighValueFile) {
            // Opcional: Limpiar los campos si el usuario desactiva la opción
            setHighValueBookValueField('');
            setHighValueAuditedValueField('');
            setHighValueReferenceField('');
        }
    }, [useHighValueFile, headers]); // Se ejecuta cuando cambia el uso o los encabezados


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
                                type="number" 
                                min="1" 
                                max="100" 
                                value={confidenceLevel || ''}
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
                                    <label className="text-sm font-medium text-gray-700 w-48">Valor de la población muestreada:</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        value={estimatedPopulationValue.toFixed(2)}
                                        disabled={true}
                                        className="block w-30 rounded-md border-gray-300 shadow-sm sm:text-sm text-center bg-gray-200 cursor-not-allowed" 
                                    />
                                </div>
                                <div className="flex items-center space-x-4">
                                    <label className="text-sm font-medium text-gray-700 w-48">Tamaño de la muestra:</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        value={estimatedSampleSize.toFixed(2)}
                                        disabled={true}
                                        className="block w-30 rounded-md border-gray-300 shadow-sm sm:text-sm text-center bg-gray-200 cursor-not-allowed" 
                                    />
                                </div>
                                <div className="flex items-center space-x-4">
                                    <label className="text-sm font-medium text-gray-700 w-48">Precisión Básica de la Fijación de Precios:</label>
                                    <input 
                                        type="number"
                                        value={basicPrecision.toFixed(2)} // Vinculamos el valor al nuevo estado
                                        disabled={true} // Se llena automáticamente, por lo que debe ser de solo lectura
                                        className="block w-30 rounded-md border-gray-300 shadow-sm sm:text-sm text-center bg-gray-200 cursor-not-allowed"
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
                                    value={bookValueField}
                                    onChange={(e) => setBookValueField(e.target.value)}
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
                                    value={auditedValueField}
                                    onChange={(e) => setAuditedValueField(e.target.value)}
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
                                    value={referenceField}
                                    onChange={(e) => setReferenceField(e.target.value)}
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
                        // CORRECCIÓN 1: Pasar el argumento requerido
                        onClick={() => onOk('stringer-bound')}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md shadow transition-colors"
                    >
                        Ok
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