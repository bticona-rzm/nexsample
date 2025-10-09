import React, { useState, useEffect } from 'react';
import { readExcelFile } from '@/lib/apiClient';

import {handleErrorChange, formatNumber, formatErrorValue} from '../../../../lib/apiClient';

// Props para el formulario de Cell & Classical PPS
interface CellClassicalPPSFormProps {
    onOk: (method: 'cell-classical', evaluationData?: any) => Promise<void>;
    confidenceLevel: number;
    precisionValue: number;
    setPrecisionValue: (value: number) => void;
    estimatedPopulationValue: number;
    estimatedSampleSize: number;
    sampleInterval: number;
    tolerableError: number;
    highValueLimit: number;
    selectedField: string | null; // ✅ MODIFICADO: acepta string | null
}

const CellClassicalPPSForm: React.FC<CellClassicalPPSFormProps> = ({ 
    onOk, 
    confidenceLevel, 
    precisionValue, 
    setPrecisionValue, 
    estimatedPopulationValue, 
    estimatedSampleSize, 
    sampleInterval,
    tolerableError,
    highValueLimit,
    selectedField // ✅ Ahora puede ser string | null
}) => {
    // Estados para la lógica del formulario
    const [isClassical, setIsClassical] = useState(false);
    const [precisionLimit, setPrecisionLimit] = useState<'upper' | 'upper-lower'>('upper');
    const [changePrecision, setChangePrecision] = useState(false);
    const [useHighValueFile, setUseHighValueFile] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Estados para el manejo de archivos y datos
    const [mainFile, setMainFile] = useState<File | null>(null);
    const [highValueFile, setHighValueFile] = useState<File | null>(null);
    const [headers, setHeaders] = useState<string[]>([]);
    
    // Estados para los campos pre-seleccionados
    const [bookValueField, setBookValueField] = useState<string>('');
    const [auditedValueField, setAuditedValueField] = useState<string>('');
    const [referenceField, setReferenceField] = useState<string>('');
    
    // Estados para los valores heredados de la pantalla de Planificación
    const [populationValue, setPopulationValue] = useState<number | null>(null);
    const [sampleSize, setSampleSize] = useState<number | null>(null);

    // Efecto para la lógica del método y para el manejo de archivos
    useEffect(() => {
        if (!isClassical) {
            setPrecisionLimit('upper');
        }
        setPopulationValue(estimatedPopulationValue); 
        setSampleSize(estimatedSampleSize); 
    }, [isClassical, estimatedPopulationValue, estimatedSampleSize]);

    // Función para procesar el archivo principal
    const handleMainFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setMainFile(file);
            
            // Simular la extracción de headers del archivo
            // En producción, esto vendría de readExcelFile
            const fileHeaders = selectedField ? [selectedField, 'AUDIT_AMT', 'REFERENCE'] : ['AUDIT_AMT', 'REFERENCE'];
            setHeaders(fileHeaders);
            
            // ✅ CORREGIDO: Manejar el caso cuando selectedField es null
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
            setMainFile(null);
            setHeaders([]);
            setBookValueField('');
            setAuditedValueField('');
            setReferenceField('');
        }
    };
    
    // Función para procesar el archivo de valores altos
    const handleHighValueFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setHighValueFile(file);
        } else {
            setHighValueFile(null);
        }
    };

    /**
     * FUNCIÓN CORREGIDA: Usa el campo seleccionado correctamente
     */
    const handleOkClick = async () => {
        // Validación mínima
        if (!mainFile || !bookValueField || !auditedValueField) {
            alert("Por favor, complete todos los campos requeridos");
            return;
        }

        setIsLoading(true);

        try {
            // 1. LEER Y PROCESAR ARCHIVO REAL
            const fileData = await readExcelFile(mainFile);
            
            // 2. PREPARAR DATOS REALES DE MUESTRA
            const sampleData = fileData.map((row: any) => ({
                reference: row[referenceField]?.toString() || `item-${Math.random()}`,
                bookValue: parseFloat(row[bookValueField]) || 0,
                auditedValue: parseFloat(row[auditedValueField]) || 0
            }));

            // 3. ENVIAR AL BACKEND REAL
            const response = await fetch('/api/mum/evaluation/cell-classical', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sampleData: sampleData,
                    sampleInterval: sampleInterval,
                    confidenceLevel: confidenceLevel,  
                    populationValue: estimatedPopulationValue,
                    tolerableError: tolerableError,
                    bookValueField: bookValueField, // ✅ Enviar el campo usado
                    auditedValueField: auditedValueField,
                    selectedFieldFromPlanning: selectedField, // ✅ Para debugging en backend
                    populationExcludingHigh: estimatedPopulationValue,
                    highValueTotal: 0,
                    highValueCountResume: 0
                }),
            });

            if (!response.ok) {
                throw new Error('Error en la evaluación');
            }

            const results = await response.json();

            // 4. MANEJAR RESULTADOS REALES
            console.log("Resultados evaluación REALES:", results);
            
            await onOk('cell-classical', {
                cellClassicalData: results.cellClassicalData,
                numErrores: results.numErrores,
                errorMasProbableBruto: results.errorMasProbableBruto,
                errorMasProbableNeto: results.errorMasProbableNeto,
                precisionTotal: results.precisionTotal,
                limiteErrorSuperiorBruto: results.limiteErrorSuperiorBruto,
                limiteErrorSuperiorNeto: results.limiteErrorSuperiorNeto,
                highValueCountResume: results.highValueCountResume
            }); 

        } catch (error: any) {
            console.error("Error en evaluación:", error);
            alert(`Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 rounded-lg shadow-md">
            <div className="flex">
                {/* Sección principal de formularios */}
                <div className="flex-1 space-y-6">

                    {/* Sección para subir el archivo principal */}
                    <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
                        <h3 className="text-lg font-bold text-gray-800">Subir Archivo de Muestra</h3>
                        <div className="flex items-center space-x-4 mt-2">
                            <input
                                id="main-file-input"
                                type="file"
                                onChange={handleMainFileChange}
                                className="hidden"
                            />
                            <button
                                onClick={() => document.getElementById('main-file-input')?.click()}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-md shadow"
                            >
                                Seleccionar archivo principal
                            </button>
                            <p className="text-sm text-gray-500">
                                {mainFile ? mainFile.name : "(Ningún archivo seleccionado)"}
                            </p>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
                        <h3 className="text-lg font-bold text-gray-800">Método</h3>
                        <div className="flex space-x-4 mb-4 mt-2">
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    name="method"
                                    value="cell"
                                    checked={!isClassical}
                                    onChange={() => setIsClassical(false)}
                                    className="h-4 w-4 text-blue-600"
                                />
                                <span className="ml-2 text-sm text-gray-700">Evaluación de Celda</span>
                            </label>
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    name="method"
                                    value="classical-pps"
                                    checked={isClassical}
                                    onChange={() => setIsClassical(true)}
                                    className="h-4 w-4 text-blue-600"
                                />
                                <span className="ml-2 text-sm text-gray-700">Evaluación de PPS Clásico</span>
                            </label>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
                        <h3 className="text-lg font-bold text-gray-800">Campos</h3>
                        <div className="space-y-4 mt-2">
                            <div className="flex items-center space-x-4">
                                <label className="text-sm font-medium text-gray-700 w-48">Book value field:</label>
                                <select 
                                    value={bookValueField}
                                    onChange={(e) => setBookValueField(e.target.value)}
                                    className="block w-48 rounded-md border-gray-300 shadow-sm sm:text-sm"
                                    disabled={headers.length === 0}
                                >
                                    <option value="">Selecciona una columna</option>
                                    {headers.map(header => (
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
                                    {headers.map(header => (
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
                                    {headers.map(header => (
                                        <option key={header} value={header}>{header}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
                        <h3 className="text-lg font-bold text-gray-800">Configuración de Muestra</h3>
                        <div className="space-y-4 mt-2">
                            <div className="flex items-center space-x-4">
                                <label className="text-sm font-medium text-gray-700 w-60">Nivel de confianza (%):</label>
                                <input 
                                    type="text" 
                                    value={formatNumber(confidenceLevel, 2)}
                                    disabled={true}
                                    className="block w-48 rounded-md border-gray-300 shadow-sm sm:text-sm text-center bg-gray-200 cursor-not-allowed"
                                />
                            </div>
                            <div className="flex items-center space-x-4">
                                <label className="text-sm font-medium text-gray-700 w-60">Valor de la población muestreada:</label>
                                <input 
                                    type="text" 
                                    value={populationValue !== null && populationValue !== undefined ? formatNumber(populationValue, 2) : ''}
                                    disabled={true} 
                                    className="block w-48 rounded-md border-gray-300 shadow-sm sm:text-sm text-center bg-gray-200 cursor-not-allowed" 
                                />
                            </div>
                            <div className="flex items-center space-x-4">
                                <label className="text-sm font-medium text-gray-700 w-60">Tamaño de la muestra:</label>
                                <input 
                                    type="text"
                                    value={sampleSize !== null && sampleSize !== undefined ? formatNumber(sampleSize,0) : ''}
                                    disabled={true} 
                                    className="block w-48 rounded-md border-gray-300 shadow-sm sm:text-sm text-center bg-gray-200 cursor-not-allowed" 
                                />
                            </div>
                            <div className="flex items-center space-x-4">
                                <input
                                    type="checkbox"
                                    checked={changePrecision}
                                    onChange={() => setChangePrecision(!changePrecision)}
                                    className="h-4 w-4 text-blue-600 rounded"
                                />
                                <label className="text-sm font-medium text-gray-700">Cambiar la precisión básica del 100%:</label>
                                <input
                                    type="text"
                                    value={formatNumber(precisionValue)}
                                    onChange={(e) => setPrecisionValue(Number(e.target.value))}
                                    disabled={!changePrecision}
                                    className={`block w-41 rounded-md border-gray-300 shadow-sm sm:text-sm text-center ${!changePrecision ? 'bg-gray-200 cursor-not-allowed' : ''}`}
                                />
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

                    <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
                        <h3 className="text-lg font-bold text-gray-800">Límites de Precisión</h3>
                        <div className="flex space-x-4 mt-2">
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    name="precision-limit"
                                    value="upper"
                                    checked={precisionLimit === 'upper'}
                                    onChange={() => setPrecisionLimit('upper')}
                                    disabled={!isClassical}
                                    className={`h-4 w-4 text-blue-600 ${!isClassical ? 'opacity-50 cursor-not-allowed' : ''}`}
                                />
                                <span className={`ml-2 text-sm text-gray-700 ${!isClassical ? 'opacity-50' : ''}`}>Superior</span>
                            </label>
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    name="precision-limit"
                                    value="upper-lower"
                                    checked={precisionLimit === 'upper-lower'}
                                    onChange={() => setPrecisionLimit('upper-lower')}
                                    disabled={!isClassical}
                                    className={`h-4 w-4 text-blue-600 ${!isClassical ? 'opacity-50 cursor-not-allowed' : ''}`}
                                />
                                <span className={`ml-2 text-sm text-gray-700 ${!isClassical ? 'opacity-50' : ''}`}>Superior e Inferior</span>
                            </label>
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

export default CellClassicalPPSForm;