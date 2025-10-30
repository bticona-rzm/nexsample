import React, { useState, useEffect } from 'react';
import { readExcelFile } from '@/lib/apiClient';
import { HelpButton } from './HelpButtonEvaluation';
import {handleErrorChange, formatNumber, formatErrorValue} from '../../../../lib/apiClient';
import { useLog } from '@/contexts/LogContext'; // ✅ Agregar importación

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
    selectedField: string | null;
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
    selectedField
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

    // ✅ NUEVOS ESTADOS PARA VALORES ALTOS
    const [highValueHeaders, setHighValueHeaders] = useState<string[]>([]);
    const [highValueBookField, setHighValueBookField] = useState<string>('');
    const [highValueAuditedField, setHighValueAuditedField] = useState<string>('');
    const [highValueReferenceField, setHighValueReferenceField] = useState<string>('');
    const [highValueItems, setHighValueItems] = useState<any[]>([]);

    // ✅ Agregar hook de logs
    const { addLog } = useLog();

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
            const fileHeaders = selectedField ? [selectedField, 'AUDIT_AMT', 'REFERENCE'] : ['AUDIT_AMT', 'REFERENCE'];
            setHeaders(fileHeaders);
            
            if (selectedField && fileHeaders.includes(selectedField)) {
                setBookValueField(selectedField);
            } else if (fileHeaders.includes('AUDIT_AMT')) {
                setBookValueField(fileHeaders[0]);
            }
            
            if (fileHeaders.includes('AUDIT_AMT')) setAuditedValueField('AUDIT_AMT');
            if (fileHeaders.includes('REFERENCE')) setReferenceField('REFERENCE');

            if ((!selectedField || !fileHeaders.includes(selectedField)) && fileHeaders.length > 0) {
                setBookValueField(fileHeaders[0]);
            }

            // ✅ LOG: Archivo principal cargado
            addLog(
                'Usuario cargó archivo principal para evaluación',
                `Archivo: ${file.name}\nTamaño: ${(file.size / 1024 / 1024).toFixed(2)} MB`,
                'evaluación',
                'user'
            );

        } else {
            setMainFile(null);
            setHeaders([]);
            setBookValueField('');
            setAuditedValueField('');
            setReferenceField('');
        }
    };
    
    // ✅ FUNCIÓN MEJORADA PARA PROCESAR ARCHIVO DE VALORES ALTOS
    const handleHighValueFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setHighValueFile(file);
            
            try {
                const fileData = await readExcelFile(file);
                
                if (fileData.length > 0) {
                    const headers = Object.keys(fileData[0]);
                    setHighValueHeaders(headers);
                    
                    // Auto-seleccionar campos probables
                    if (headers.includes('BOOK_VALUE') || headers.includes('BOOK_VAL')) {
                        setHighValueBookField(headers.find(h => h.includes('BOOK')) || headers[0]);
                    } else if (headers.length > 0) {
                        setHighValueBookField(headers[0]);
                    }
                    
                    if (headers.includes('AUDITED_VALUE') || headers.includes('AUDIT_AMT')) {
                        setHighValueAuditedField(headers.find(h => h.includes('AUDIT')) || '');
                    }
                    
                    if (headers.includes('REFERENCE') || headers.includes('ID')) {
                        setHighValueReferenceField(headers.find(h => h.includes('REF') || h.includes('ID')) || '');
                    }

                    setHighValueItems(fileData);

                    // ✅ LOG: Archivo de valores altos cargado
                    addLog(
                        'Usuario cargó archivo de valores altos',
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

    // ✅ MANEJAR CAMBIO DE MÉTODO CON LOG
    const handleMethodChange = (method: boolean) => {
        setIsClassical(method);
        addLog(
            'Usuario cambió método de evaluación',
            `Nuevo método: ${method ? 'PPS Clásico' : 'Evaluación de Celda'}`,
            'evaluación',
            'user'
        );
    };

    // ✅ MANEJAR CAMBIO DE PRECISIÓN CON LOG
    const handlePrecisionChange = (enabled: boolean) => {
        setChangePrecision(enabled);
        addLog(
            'Usuario modificó configuración de precisión',
            `Cambiar precisión básica: ${enabled ? 'Activado' : 'Desactivado'}`,
            'evaluación',
            'user'
        );
    };

    // ✅ MANEJAR CAMBIO DE LÍMITE DE PRECISIÓN CON LOG
    const handlePrecisionLimitChange = (limit: 'upper' | 'upper-lower') => {
        setPrecisionLimit(limit);
        addLog(
            'Usuario cambió límite de precisión',
            `Nuevo límite: ${limit === 'upper' ? 'Superior' : 'Superior e Inferior'}`,
            'evaluación',
            'user'
        );
    };

    // ✅ MANEJAR CAMBIO DE VALOR DE PRECISIÓN CON LOG
    const handlePrecisionValueChange = (value: number) => {
        setPrecisionValue(value);
        addLog(
            'Usuario modificó valor de precisión básica',
            `Nuevo valor: ${value}%`,
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

    /**
     * FUNCIÓN CORREGIDA: Usa el campo seleccionado correctamente
     */
    const handleOkClick = async () => {
        // Validación mínima
        if (!mainFile || !bookValueField || !auditedValueField) {
            alert("Por favor, complete todos los campos requeridos");
            return;
        }

        // ✅ VALIDACIÓN PARA VALORES ALTOS SI SE USA ARCHIVO
        if (useHighValueFile && (!highValueBookField || !highValueAuditedField)) {
            alert("Por favor, complete los campos para el archivo de valores altos");
            return;
        }

        setIsLoading(true);

        try {
            // ✅ LOG: Inicio de evaluación
            addLog(
                'Iniciando evaluación Cell & Classical PPS',
                `Método: ${isClassical ? 'PPS Clásico' : 'Evaluación de Celda'}\nArchivo principal: ${mainFile.name}\nValores altos: ${useHighValueFile ? 'Sí' : 'No'}`,
                'evaluación',
                'system'
            );

            // 1. LEER Y PROCESAR ARCHIVO PRINCIPAL
            const fileData = await readExcelFile(mainFile);
            
            // 2. PREPARAR DATOS REALES DE MUESTRA
            const sampleData = fileData.map((row: any) => ({
                reference: row[referenceField]?.toString() || `item-${Math.random()}`,
                bookValue: parseFloat(row[bookValueField]) || 0,
                auditedValue: parseFloat(row[auditedValueField]) || 0
            }));

            // 3. ✅ PREPARAR DATOS DE VALORES ALTOS
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

            // 4. ✅ ENVIAR AL BACKEND CON VALORES ALTOS
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
                    bookValueField: bookValueField,
                    auditedValueField: auditedValueField,
                    selectedFieldFromPlanning: selectedField,
                    
                    // ✅ DATOS DE VALORES ALTOS
                    highValueItems: highValueData,
                    highValueTotal: highValueStats.total,
                    highValueCountResume: highValueStats.count,
                    
                    // Población excluyendo valores altos
                    populationExcludingHigh: estimatedPopulationValue - highValueStats.total
                }),
            });

            if (!response.ok) {
                throw new Error('Error en la evaluación');
            }

            const results = await response.json();
            
            // ✅ LOG: Evaluación completada exitosamente
            addLog(
                'Evaluación Cell & Classical PPS completada',
                `Elementos procesados: ${sampleData.length}\nValores altos: ${highValueStats.count}\nError más probable: ${results.errorMasProbableNeto}`,
                'evaluación',
                'system'
            );

            await onOk('cell-classical', {
                cellClassicalData: results.cellClassicalData,
                numErrores: results.numErrores,
                errorMasProbableBruto: results.errorMasProbableBruto,
                errorMasProbableNeto: results.errorMasProbableNeto,
                precisionTotal: results.precisionTotal,
                limiteErrorSuperiorBruto: results.limiteErrorSuperiorBruto,
                limiteErrorSuperiorNeto: results.limiteErrorSuperiorNeto,
                highValueCountResume: results.highValueCountResume,
                highValueTotal: results.highValueTotal,
                highValueErrors: results.highValueErrors,
                sampleSize: sampleData.length,
                highValueCount: highValueStats.count
            }); 

        } catch (error: any) {
            console.error("Error en evaluación:", error);
            
            // ✅ LOG: Error en evaluación
            addLog(
                'Error en evaluación Cell & Classical PPS',
                `Error: ${error.message}`,
                'evaluación',
                'system'
            );
            
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
                         <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-bold text-gray-800">Subir Archivo de Muestra</h3>
                            <HelpButton context="file-upload" />
                        </div>
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
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-bold text-gray-800">Método</h3>
                            <HelpButton context="cell-classical-method" />
                        </div>
                        <div className="flex space-x-4 mb-4 mt-2">
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    name="method"
                                    value="cell"
                                    checked={!isClassical}
                                    onChange={() => handleMethodChange(false)}
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
                                    onChange={() => handleMethodChange(true)}
                                    className="h-4 w-4 text-blue-600"
                                />
                                <span className="ml-2 text-sm text-gray-700">Evaluación de PPS Clásico</span>
                            </label>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-bold text-gray-800">Campos</h3>
                            <HelpButton context="field-selection" />
                        </div>
                        <div className="space-y-4 mt-2">
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
                                    {headers.map(header => (
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
                                    {headers.map(header => (
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
                                    {headers.map(header => (
                                        <option key={header} value={header}>{header}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Resto del componente permanece igual pero con handlers actualizados */}
                    <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-bold text-gray-800">Configuración de Muestra</h3>
                            <HelpButton context="sample-configuration" />
                        </div>
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
                                    onChange={(e) => handlePrecisionChange(e.target.checked)}
                                    className="h-4 w-4 text-blue-600 rounded"
                                />
                                <label className="text-sm font-medium text-gray-700">Cambiar la precisión básica del 100%:</label>
                                <input
                                    type="text"
                                    value={formatNumber(precisionValue)}
                                    onChange={(e) => handlePrecisionValueChange(Number(e.target.value))}
                                    disabled={!changePrecision}
                                    className={`block w-41 rounded-md border-gray-300 shadow-sm sm:text-sm text-center ${!changePrecision ? 'bg-gray-200 cursor-not-allowed' : ''}`}
                                />
                            </div>
                        </div>
                    </div>

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
                        <div className="space-y-4 mt-4">
                            <div className="flex items-center space-x-4">
                                <label className="text-sm font-medium text-gray-700 w-48">Book value field:</label>
                                <select className="block w-48 rounded-md border-gray-300 shadow-sm sm:text-sm"
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
                                    disabled={!useHighValueFile}
                                >
                                    <option value="">Selecciona una columna</option>
                                    {highValueHeaders.map(header => (
                                        <option key={header} value={header}>{header}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center space-x-4">
                                <label className="text-sm font-medium text-gray-700 w-48">Audited value field:</label>
                                <select className="block w-48 rounded-md border-gray-300 shadow-sm sm:text-sm"
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
                                    disabled={!useHighValueFile}
                                >
                                    <option value="">Selecciona una columna</option>
                                    {highValueHeaders.map(header => (
                                        <option key={header} value={header}>{header}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center space-x-4">
                                <label className="text-sm font-medium text-gray-700 w-48">Reference (optional):</label>
                                <select className="block w-48 rounded-md border-gray-300 shadow-sm sm:text-sm"
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
                                    disabled={!useHighValueFile}
                                >
                                    <option value="">Selecciona una columna</option>
                                    {highValueHeaders.map(header => (
                                        <option key={header} value={header}>{header}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-bold text-gray-800">Límites de Precisión</h3>
                            <HelpButton context="precision-limits" />
                        </div>
                        <div className="flex space-x-4 mt-2">
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    name="precision-limit"
                                    value="upper"
                                    checked={precisionLimit === 'upper'}
                                    onChange={() => handlePrecisionLimitChange('upper')}
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
                                    onChange={() => handlePrecisionLimitChange('upper-lower')}
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
                    <div className="flex justify-center">
                        <HelpButton 
                            context="general" 
                            className="bg-orange-400 hover:bg-orange-500 text-white font-semibold py-2 px-4 rounded-full shadow w-full" 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CellClassicalPPSForm;