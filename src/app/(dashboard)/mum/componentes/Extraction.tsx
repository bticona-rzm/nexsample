// En Extraction.tsx - agrega la importación de useState
import React, { useEffect, useState, useRef, useCallback} from 'react'; // Agregar useState aquí
import { saveAs } from 'file-saver';
import { useLog } from '@/contexts/LogContext';
import { HistoryPanel } from '@/components/mum/HistoryPanel';
import {handleErrorChange, formatNumber, formatErrorValue} from '../../../../lib/apiClient';
import { HelpButton } from './HelpButtonExtraction';
import Visualizer from './../../atributos/componentes/Visualizer';

// ✅ Función debounce helper
function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}


// Define the shape of a single row in your Excel data
interface ExcelRow {
    [key: string]: any;
}

// Interface for the component's properties
interface ExtractionProps {
    isPlanificacionDone: boolean;
    excelData: ExcelRow[];
    headers: string[];
    extractionType: "intervaloFijo" | "seleccionCelda";
    setExtractionType: React.Dispatch<React.SetStateAction<"intervaloFijo" | "seleccionCelda">>;
    highValueManagement: "agregados" | "separado";
    setHighValueManagement: React.Dispatch<React.SetStateAction<"agregados" | "separado">>;
    highValueFilename: string;
    setHighValueFilename: React.Dispatch<React.SetStateAction<string>>;
    sampleInterval: number;
    sampleField: string | null;
    setSampleField: React.Dispatch<React.SetStateAction<string | null>>;
    randomStartPoint: number;
    setRandomStartPoint: React.Dispatch<React.SetStateAction<number>>;
    modifyHighValueLimit: boolean;
    setModifyHighValueLimit: React.Dispatch<React.SetStateAction<boolean>>;
    highValueCount: number;
    setHighValueCount: React.Dispatch<React.SetStateAction<number>>;
    highValueLimit: number;
    setHighValueLimit: React.Dispatch<React.SetStateAction<number>>;
    selectedTableType: "positive" | "negative" | "absolute";
    setSelectedTableType: React.Dispatch<React.SetStateAction<"positive" | "negative" | "absolute">>;
    positiveTotal: number;
    setPositiveTotal: React.Dispatch<React.SetStateAction<number>>;
    positiveRecords: number;
    setPositiveRecords: React.Dispatch<React.SetStateAction<number>>;
    negativeTotal: number;
    setNegativeTotal: React.Dispatch<React.SetStateAction<number>>;
    negativeRecords: number;
    setNegativeRecords: React.Dispatch<React.SetStateAction<number>>;
    absoluteTotal: number;
    setAbsoluteTotal: React.Dispatch<React.SetStateAction<number>>;
    absoluteRecords: number;
    setAbsoluteRecords: React.Dispatch<React.SetStateAction<number>>;
    estimatedSampleSize: number;
    extractionFilename: string;
    setExtractionFilename: React.Dispatch<React.SetStateAction<string>>;
    setIsExtraccionDone: React.Dispatch<React.SetStateAction<boolean>>;
    setActiveTab: React.Dispatch<React.SetStateAction<string>>;
    selectedField: string | null;
    setSelectedField: (value: string | null) => void;
    excelFilename: string;
    estimatedPopulationValue: number;
    populationRecords: number;
    handleExtraction: () => void; // Nueva prop
    onOpenHistory?: () => void; // ✅ Agregar esta prop
}

const Extraction: React.FC<ExtractionProps> = ({
    isPlanificacionDone,
    excelData,
    headers,
    extractionType,
    setExtractionType,
    highValueManagement,
    setHighValueManagement,
    highValueFilename,
    setHighValueFilename,
    sampleInterval,
    sampleField,
    setSampleField,
    randomStartPoint,
    setRandomStartPoint,
    modifyHighValueLimit,
    setModifyHighValueLimit,
    highValueCount,
    setHighValueCount,
    highValueLimit,
    setHighValueLimit,
    selectedTableType,
    setSelectedTableType,
    positiveTotal,
    setPositiveTotal,
    positiveRecords,
    setPositiveRecords,
    negativeTotal,
    setNegativeTotal,
    negativeRecords,
    setNegativeRecords,
    absoluteTotal,
    setAbsoluteTotal,
    absoluteRecords,
    setAbsoluteRecords,
    estimatedSampleSize,
    extractionFilename,
    setExtractionFilename,
    setIsExtraccionDone,
    setActiveTab,
    selectedField,
    setSelectedField,
    excelFilename,
    estimatedPopulationValue,
    populationRecords,
    handleExtraction, // Nueva prop
}) => {
    const [showHistory, setShowHistory] = useState(false); // Ahora useState está importado
    const { addLog } = useLog();
    const hasInitializedField = useRef(false); // ✅ NUEVO: controlar ejecución única

    // ✅ PASO 1: AGREGAR ESTADOS PARA PREVISUALIZACIÓN
    const [showPreview, setShowPreview] = useState(false);
    const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
    const [previewData, setPreviewData] = useState<ExcelRow[]>([]);
    const [isPreviewReady, setIsPreviewReady] = useState(false);

    // ✅ PASO 2: AGREGAR ESTA FUNCIÓN EN Extraction.tsx
    const handlePreviewExtraction = async () => {
        if (!isFormValid) {
            alert("Por favor completa todos los parámetros requeridos antes de previsualizar.");
            return;
        }

        setIsGeneratingPreview(true);
        addLog(
            'Usuario solicitó previsualización de extracción MUM',
            `Tipo: ${extractionType}\nCampo: ${sampleField}\nIntervalo: ${sampleInterval}`,
            'extracción',
            'user'
        );

        try {
            // ✅ LLAMAR AL SERVICIO REAL EN MODO PREVIEW
            const previewResult = await fetch('/api/mum/extraction', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    excelData,
                    estimatedSampleSize,
                    sampleInterval,
                    highValueLimit,
                    highValueManagement,
                    sampleField: sampleField || '',
                    randomStartPoint,
                    estimatedPopulationValue,
                    extractionType,
                    extractionFilename: "preview_" + extractionFilename,
                    highValueFilename: "preview_" + highValueFilename,
                    isPreview: true // ✅ Flag para modo previsualización
                })
            });

            if (!previewResult.ok) {
                const errorData = await previewResult.json();
                throw new Error(errorData.error || 'Error en el servidor');
            }

            const result = await previewResult.json();
            
            // ✅ USAR LOS DATOS REALES DEL ALGORITMO MUM
            if (result.processedData && result.processedData.length > 0) {
                setPreviewData(result.processedData);
                setIsPreviewReady(true);
                setShowPreview(true);
                
                addLog(
                    'Previsualización de extracción generada exitosamente',
                    `Registros en previsualización: ${result.processedData.length}\nMuestra real del algoritmo MUM`,
                    'extracción',
                    'system'
                );
            } else {
                throw new Error('No se generaron datos en la previsualización');
            }

        } catch (error) {
            console.error("Error al generar previsualización:", error);
            
            // ✅ FALLBACK: Usar simulación temporal
            const mockPreviewData = excelData.slice(0, Math.min(10, excelData.length));
            setPreviewData(mockPreviewData);
            setIsPreviewReady(true);
            setShowPreview(true);
            
            addLog(
                'Previsualización generada en modo simulación',
                `Usando primeros 10 registros como fallback. Error: ${error}`,
                'extracción',
                'error'
            );
            
            alert("Se está mostrando una previsualización simulada. Los datos reales pueden variar.");
        } finally {
            setIsGeneratingPreview(false);
        }
    };

    // ✅ PASO 2.1: Función para cerrar previsualización
    const handleClosePreview = () => {
        setShowPreview(false);
        addLog(
            'Usuario cerró previsualización de extracción',
            `Registros previsualizados: ${previewData.length}`,
            'extracción',
            'user'
        );
    };

    // ✅ PASO 3: AGREGAR ESTA VALIDACIÓN EN Extraction.tsx
    const isFormValid = sampleField && 
                    sampleInterval > 0 && 
                    randomStartPoint > 0 && 
                    extractionFilename.trim() !== '';

    // ✅ Debounced log functions - se ejecutan solo después de 1 segundo sin cambios
    const debouncedLogHighValueFilename = useCallback(
        debounce((newName: string) => {
            addLog(
                'Usuario modificó nombre archivo valores altos',
                `Nuevo nombre: ${newName}`,
                'extracción',
                'user'
            );
        }, 1000), // 1 segundo de delay
        [addLog]
    );

     const debouncedLogExtractionFilename = useCallback(
        debounce((newName: string) => {
            addLog(
                'Usuario modificó nombre de archivo de extracción',
                `Nuevo nombre: ${newName}`,
                'extracción',
                'user'
            );
        }, 1000), // 1 segundo de delay
        [addLog]
    );

    const debouncedLogRandomStartPoint = useCallback(
        debounce((newValue: string) => {
            addLog(
                'Usuario modificó punto de inicio aleatorio',
                `Nuevo valor: ${newValue}`,
                'extracción',
                'user'
            );
        }, 1000), // 1 segundo de delay
        [addLog]
    );

    const debouncedLogHighValueLimit = useCallback(
        debounce((newValue: string) => {
            addLog(
                'Usuario modificó monto de valor alto',
                `Nuevo monto: ${newValue}`,
                'extracción',
                'user'
            );
        }, 1000), // 1 segundo de delay
        [addLog]
    );

    const calculateTableValues = () => {
        if (!sampleField || !excelData || excelData.length === 0) {
            setPositiveTotal(0);
            setPositiveRecords(0);
            setNegativeTotal(0);
            setNegativeRecords(0);
            setAbsoluteTotal(0);
            setAbsoluteRecords(0);
            return;
        }

        let positiveSum = 0;
        let positiveCount = 0;
        let negativeSum = 0;
        let negativeCount = 0;
        let absoluteSum = 0;
        let absoluteCount = 0;

        excelData.forEach(row => {
            const value = parseFloat(row[sampleField]);
            if (!isNaN(value)) {
                if (value > 0) {
                    positiveSum += value;
                    positiveCount++;
                } else if (value < 0) {
                    negativeSum += value;
                    negativeCount++;
                }
                absoluteSum += Math.abs(value);
                absoluteCount++;
            }
        });

        setPositiveTotal(positiveSum);
        setPositiveRecords(positiveCount);
        setNegativeTotal(negativeSum);
        setNegativeRecords(negativeCount);
        setAbsoluteTotal(absoluteSum);
        setAbsoluteRecords(absoluteCount);
    };

    
    // Efecto para inicializar con el campo heredado
    useEffect(() => {
        if (selectedField && isPlanificacionDone && !sampleField && !hasInitializedField.current) {
            setSampleField(selectedField);
            hasInitializedField.current = true; // ✅ Marcar como ejecutado
            
            addLog(
                'Campo heredado de planificación aplicado',
                `Campo seleccionado automáticamente: ${selectedField}`,
                'extracción',
                'system' 
            );
        }
    }, [selectedField, isPlanificacionDone, sampleField]); // ✅ Este se ejecuta una vez

    // ✅ CORREGIDO: Separar el efecto de cálculos
    useEffect(() => {
        if (sampleField && excelData.length > 0 && hasInitializedField.current) {
            // Función corregida para IDEA
            const generateIDEARandom = (seed: number) => {
                const a = 1103515245;
                const c = 12345;
                const m = Math.pow(2, 31);
                
                let currentSeed = seed;
                
                return function() {
                    currentSeed = (a * currentSeed + c) % m;
                    return currentSeed / m;
                };
            };

            // ✅ CALCULAR DENTRO DEL EFFECT
            const seed = sampleInterval;
            const ideRandom = generateIDEARandom(seed);
            const newRandomStartPoint = Math.floor(ideRandom() * sampleInterval) + 1;
            
            // ✅ ACTUALIZAR EL ESTADO
            setRandomStartPoint(newRandomStartPoint);

            const newHighValueLimit = sampleInterval;
            if (!modifyHighValueLimit) {
                setHighValueLimit(newHighValueLimit);
            }

            calculateTableValues();
            
            const highValueRecords = excelData.filter(row => {
                const value = parseFloat(row[sampleField]);
                return !isNaN(value) && Math.abs(value) >= sampleInterval;
            });
            setHighValueCount(highValueRecords.length);

            addLog(
                'Cálculos de extracción con semilla',
                `Campo: ${sampleField}\nSemilla: ${sampleInterval}\nPunto inicio: ${newRandomStartPoint}\nValores altos: ${highValueRecords.length}`,
                'extracción',
                'system'
            );
        }
    }, [sampleField, excelData, sampleInterval, modifyHighValueLimit]); // ✅ Dependencias correctas

    // ✅ CORRECCIÓN: Mejorar el texto informativo sobre valores altos
    const getHighValueText = () => {
        if (!sampleField || !excelData.length) return null;
        
        const highValueRecords = excelData.filter(row => {
            const value = parseFloat(row[sampleField]);
            return !isNaN(value) && Math.abs(value) >= sampleInterval;
        });

        const highValueTotal = highValueRecords.reduce((sum, row) => {
            const value = parseFloat(row[sampleField]);
            return sum + Math.abs(value);
        }, 0);

        return (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 font-medium">
                    📊 Resumen de valores altos:
                </p>
                <ul className="mt-2 text-sm text-blue-700 space-y-1">
                    <li>• <strong>{formatNumber(highValueRecords.length, 0)}</strong> elementos con valor ≥ {formatNumber(sampleInterval, 2)}</li>
                    <li>• Total de valores altos: {formatNumber(highValueTotal, 2)}</li>
                    <li>• Representan el {((highValueTotal / estimatedPopulationValue) * 100).toFixed(1)}% de la población</li>
                    {highValueRecords.length > 0 && (
                        <li className="text-blue-600 font-medium">
                            ✅ Estos elementos tendrán 100% de probabilidad de selección
                        </li>
                    )}
                </ul>
            </div>
        );
    };

    const renderExtraccion = () => {
        if (!isPlanificacionDone) {
            return (
                <div className="p-4 text-center text-gray-500">
                    Debe completar la Planificación para poder acceder a la Extracción.
                </div>
            );
        }
        return (
            <div className="flex space-x-6 p-4 h-[calc(100vh-80px)]">
                {/* Left Column: Extraction Controls */}
                <div className="flex-1 space-y-6 overflow-y-auto pr-2">
                    {/* Extraction Type and High Value Management */}
                    <div className="bg-gray-50 p-6 rounded-lg shadow-inner flex space-x-8">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-bold text-gray-800">Tipo de extracción</h3>
                                <HelpButton context="extraction-type" />
                            </div>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    value="intervaloFijo"
                                    checked={extractionType === 'intervaloFijo'}
                                    onChange={() => {
                                        setExtractionType('intervaloFijo');
                                        addLog(
                                            'Usuario cambió tipo de extracción',
                                            'Nuevo tipo: Intervalo fijo',
                                            'extracción',
                                            'user' // ✅ LOG DEL USUARIO
                                        );
                                    }}
                                    className="h-4 w-4 text-blue-600"
                                />
                                <span className="text-sm text-gray-700">Intervalo fijo</span>
                            </label>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    value="seleccionCelda"
                                    checked={extractionType === 'seleccionCelda'}
                                    onChange={(e) => {
                                        setExtractionType('seleccionCelda');
                                        addLog(
                                            'Usuario cambió tipo de extracción',
                                            'Nuevo tipo: Selección de celda',
                                            'extracción',
                                            'user' // ✅ LOG DEL USUARIO
                                        );
                                    }}
                                    className="h-4 w-4 text-blue-600"
                                />
                                <span className="text-sm text-gray-700">Selección de celda</span>
                            </label>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-bold text-gray-800">Gestión de valores altos</h3>
                                <HelpButton context="high-value-management" />
                            </div>
                            <label className="flex items-center space-x-2 mb-2">
                                <input
                                    type="radio"
                                    value="agregados"
                                    checked={highValueManagement === 'agregados'}
                                    onChange={(e) => {
                                        setHighValueManagement('agregados');
                                        addLog(
                                            'Usuario cambió gestión de valores altos',
                                            'Nueva gestión: Valores altos como agregados',
                                            'extracción',
                                            'user' // ✅ LOG DEL USUARIO
                                        );
                                    }}
                                    className="h-4 w-4 text-blue-600"
                                />
                                <span className="text-sm text-gray-700">Valores altos como agregados a la muestra</span>
                            </label>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    value="separado"
                                    checked={highValueManagement === 'separado'}
                                    onChange={(e) => {
                                        setHighValueManagement('separado');
                                        addLog(
                                            'Usuario cambió gestión de valores altos',
                                            'Nueva gestión: Archivo separado',
                                            'extracción',
                                            'user' // ✅ LOG DEL USUARIO
                                        );
                                    }}
                                    className="h-4 w-4 text-blue-600"
                                />
                                <span className="ml-2 text-sm text-gray-700">En un archivo por separado</span>
                            </label>
                            {highValueManagement === 'separado' && (
                                <div className="mt-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Nombre del archivo de valor alto:
                                        </label>
                                    </div>
                                    <input
                                        type="text"
                                        value={highValueFilename}
                                        onChange={(e) => {
                                            setHighValueFilename(e.target.value);
                                            if (e.target.value.trim() !== '') {
                                                // ✅ REEMPLAZAR: Usar la función debounced
                                                debouncedLogHighValueFilename(e.target.value);
                                            }
                                        }}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                                        placeholder="ej. valores_altos.xlsx"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Extraction Parameters */}
                    <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-800">Parámetros de Extracción</h3>
                            <HelpButton context="extraction-parameters" />
                        </div>
                        <div className="flex items-center space-x-8 mb-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Campo numérico para la muestra:
                                    </label>
                                    <HelpButton context="sample-field" />
                                </div>
                                <select
                                    value={sampleField || selectedField || ""}
                                    onChange={(e) => {
                                        setSampleField(e.target.value);
                                        addLog(
                                            'Usuario cambió campo de muestra',
                                            `Nuevo campo seleccionado: ${e.target.value}`,
                                            'extracción',
                                            'user' // ✅ LOG DEL USUARIO
                                        );
                                    }}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                                >
                                    <option value="">Seleccionar campo...</option>
                                    {headers.filter(h => !isNaN(Number(excelData[0]?.[h]))).map(header => (
                                        <option key={header} value={header}>
                                            {header}
                                        </option>
                                    ))}
                                </select>
                                {selectedField && !sampleField && (
                                    <p className="mt-1 text-xs text-blue-600">
                                        Campo heredado de Planificación: <strong>{selectedField}</strong>
                                    </p>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Intervalo muestral:
                                    </label>
                                </div>
                                <input
                                    type="text"
                                    value={formatNumber(sampleInterval, 2)}
                                    disabled
                                    className="mt-1 block w-full rounded-md border-gray-300 bg-gray-200 cursor-not-allowed shadow-sm sm:text-sm"
                                />
                            </div>
                        </div>
                        <div className="flex items-center space-x-8">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Punto de inicio aleatorio:
                                    </label>
                                    {/* ✅ AQUÍ AGREGAMOS EL BOTÓN DE AYUDA */}
                                    <HelpButton context="random-start" />
                                </div>
                                <input
                                    type="text"
                                    value={formatNumber(randomStartPoint, 2)} // 0 decimales para enteros
                                    onChange={(e) => {
                                        // Usar handleErrorChange que ya sabe parsear formato español
                                        handleErrorChange(e.target.value, setRandomStartPoint, false);
                                        if (e.target.value.trim() !== '') {
                                            // ✅ REEMPLAZAR: Usar la función debounced
                                            debouncedLogRandomStartPoint(e.target.value);
                                        }
                                    }}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                                />
                            </div>
                            <div className="flex-1 flex items-center mt-6">
                                <input
                                    type="checkbox"
                                    checked={modifyHighValueLimit}
                                    onChange={(e) => {
                                        setModifyHighValueLimit(e.target.checked);
                                        addLog(
                                            'Usuario modificó configuración de valor alto',
                                            `Modificar límite de valor alto: ${e.target.checked ? 'Activado' : 'Desactivado'}`,
                                            'extracción',
                                            'user' // ✅ LOG DEL USUARIO
                                        );
                                    }}
                                    className="h-4 w-4 text-blue-600 rounded"
                                />
                                <div className="flex items-center gap-2 ml-2">
                                    <label className="text-sm font-medium text-gray-700">
                                        Monto de valor alto:
                                    </label>
                                    <HelpButton context="high-value-limit" />
                                </div>
                                <input
                                    type="text"
                                    value={formatNumber(highValueLimit, 2)}
                                    onChange={(e) => {
                                        handleErrorChange(e.target.value, setHighValueLimit, false);
                                        if (e.target.value.trim() !== '' && modifyHighValueLimit) {
                                            // ✅ REEMPLAZAR: Usar la función debounced
                                            debouncedLogHighValueLimit(e.target.value);
                                        }
                                    }}
                                    disabled={!modifyHighValueLimit}
                                    className={`ml-2 block w-48 rounded-md border-gray-300 shadow-sm sm:text-sm text-right ${!modifyHighValueLimit && 'bg-gray-200 cursor-not-allowed'}`}
                                />
                            </div>
                        </div>
                        {getHighValueText()}
                    </div>

                    {/* Value Table */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Resumen de Valores</h3>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tipo de valor
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Total
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Registros
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                <tr>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="radio"
                                            value="positive"
                                            checked={selectedTableType === 'positive'}
                                            onChange={() => {
                                                setSelectedTableType('positive');
                                                addLog(
                                                    'Usuario seleccionó tipo de valor',
                                                    'Tipo seleccionado: Valores positivos',
                                                    'extracción',
                                                    'user' // ✅ LOG DEL USUARIO
                                                );
                                            }}
                                            className="h-4 w-4 text-blue-600"
                                        />
                                        <span className="ml-2 text-sm text-gray-900">Valores positivos</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatNumber(positiveTotal, 2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatNumber(positiveRecords, 0)}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="radio"
                                            value="negative"
                                            checked={selectedTableType === 'negative'}
                                            onChange={() => {
                                                setSelectedTableType('negative');
                                                addLog(
                                                    'Usuario seleccionó tipo de valor',
                                                    'Tipo seleccionado: Valores negativos',
                                                    'extracción',
                                                    'user' // ✅ LOG DEL USUARIO
                                                );
                                            }}
                                            disabled={true}
                                            className="h-4 w-4 text-gray-400 cursor-not-allowed"
                                        />
                                        <span className="ml-2 text-sm text-gray-400">Valores negativos</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatNumber(Math.abs(negativeTotal), 2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatNumber(negativeRecords, 0)}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="radio"
                                            value="absolute"
                                            checked={selectedTableType === 'absolute'}
                                            onChange={() => {
                                                setSelectedTableType('absolute');
                                                addLog(
                                                    'Usuario seleccionó tipo de valor',
                                                    'Tipo seleccionado: Valores absolutos',
                                                    'extracción',
                                                    'user' // ✅ LOG DEL USUARIO
                                                );
                                            }}
                                            disabled={true}
                                            className="h-4 w-4 text-gray-400 cursor-not-allowed"
                                        />
                                        <span className="ml-2 text-sm text-gray-400">Valores absolutos</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatNumber(absoluteTotal, 2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatNumber(absoluteRecords, 0)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* File Name */}
                    <div className="mt-4">
                        <div className="flex items-center gap-2 mb-1">
                            <label className="block text-sm font-medium text-gray-700">
                                Nombre de archivo:
                            </label>
                        </div>  
                        <input
                            type="text"
                            value={extractionFilename}
                             onChange={(e) => {
                                setExtractionFilename(e.target.value);
                                if (e.target.value.trim() !== '') {
                                    // ✅ REEMPLAZAR: Usar la función debounced
                                    debouncedLogExtractionFilename(e.target.value);
                                }
                            }}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                            placeholder="ej. muestra_auditoria.xlsx"
                        />
                    </div>
                    {/* ✅ CORREGIR: SECCIÓN DE PREVISUALIZACIÓN - Estructura como Aleatorio */}
                    {showPreview && isPreviewReady && previewData.length > 0 && (
                        <div className="bg-white p-6 rounded-lg shadow-md flex-1 min-h-0 flex flex-col">
                            <div className="flex flex-col flex-1 min-h-0">
                                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                        <span className="text-green-600">👁️</span>
                                        Previsualización de la Muestra MUM
                                        <span className="ml-2 text-sm font-normal text-green-600 bg-green-50 px-2 py-1 rounded">
                                            {previewData.length} registros seleccionados
                                        </span>
                                    </h3>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                addLog(
                                                    'Usuario confirmó extracción desde previsualización',
                                                    `Registros: ${previewData.length}`,
                                                    'extracción',
                                                    'user'
                                                );
                                                handleExtraction();
                                            }}
                                            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded shadow text-sm flex items-center gap-2"
                                        >
                                            <span>✅</span>
                                            Confirmar y Exportar
                                        </button>
                                        <button
                                            onClick={handleClosePreview}
                                            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded shadow text-sm"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                </div>
                                
                                {/* ✅ CONTENEDOR DEL VISUALIZER CON SCROLL INTERNO */}
                                <div className="flex-1 min-h-0 overflow-auto">
                                    <Visualizer 
                                        excelData={previewData} 
                                        headers={headers} 
                                    />
                                </div>
                            </div>
                            
                            {/* Información adicional */}
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-start gap-3">
                                    <span className="text-blue-600 text-lg">💡</span>
                                    <div>
                                        <p className="text-sm text-blue-700 font-medium">
                                            Previsualización de la muestra MUM
                                        </p>
                                        <p className="text-xs text-blue-600 mt-1">
                                            <strong>Nota:</strong> Esta es una previsualización de los registros que serán 
                                            seleccionados. Haz clic en "Confirmar y Exportar" para generar el archivo Excel 
                                            final con todas las columnas de auditoría MUM.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ✅ CORREGIR: Mensaje cuando no hay datos */}
                    {showPreview && isPreviewReady && previewData.length === 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <span className="text-yellow-600 text-lg">⚠️</span>
                                <div>
                                    <p className="text-sm text-yellow-800 font-medium">
                                        No se encontraron registros para la muestra
                                    </p>
                                    <p className="text-xs text-yellow-600 mt-1">
                                        Revisa los parámetros de extracción (intervalo, punto de inicio, campo seleccionado).
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Action Buttons */}
                <div className="w-48 flex-none flex flex-col space-y-4 mt-2">

                    {/* Botón de Previsualización */}
                    <button
                        onClick={handlePreviewExtraction}
                        disabled={!isFormValid || isGeneratingPreview}
                        className={`font-semibold py-2 px-4 rounded shadow transition-colors flex items-center justify-center gap-2 ${
                            !isFormValid || isGeneratingPreview
                                ? "bg-gray-400 text-gray-700 cursor-not-allowed" 
                                : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                    >
                        {isGeneratingPreview ? (
                            <>
                                <span className="animate-spin">⏳</span>
                                Generando...
                            </>
                        ) : (
                            <>
                                <span>👁️</span>
                                Previsualizar Muestra
                            </>
                        )}
                    </button>
                    
                    {/* Botón Generar Muestra Directa */}
                    <button
                        onClick={() => {
                            addLog(
                                'Usuario inició proceso de extracción directa',
                                `Tipo: ${extractionType}\nGestión valores altos: ${highValueManagement}`,
                                'extracción',
                                'user'
                            );
                            handleExtraction();
                        }}
                        disabled={!isFormValid}
                        className={`font-semibold py-2 px-4 rounded shadow transition-colors ${
                            !isFormValid
                                ? "bg-gray-400 text-gray-700 cursor-not-allowed" 
                                : "bg-green-600 hover:bg-green-700 text-white"
                        }`}
                    >
                        Generar Muestra Directa
                    </button>
                    
                    {/* Botones existentes */}
                    <button
                        onClick={() => {
                            setShowHistory(true);
                            addLog(
                                'Usuario visualizó historial',
                                'Historial de auditoría abierto desde módulo de extracción',
                                'extracción',
                                'user'
                            );
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded shadow"
                    >
                        Ver Historial
                    </button>

                    <button
                        onClick={() => {
                            addLog(
                                'Usuario canceló extracción',
                                'Navegación de regreso a planificación',
                                'extracción',
                                'user'
                            );
                            setActiveTab('planificacion');
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded shadow"
                    >
                        Cancelar
                    </button>
                    
                    {/* Botón de ayuda */}
                    <div className="flex justify-center">
                        <HelpButton 
                            context="general" 
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-full shadow w-full" 
                        />
                    </div>
                </div>

                {/* Panel de Historial */}
                {showHistory && (
                    <HistoryPanel 
                        isOpen={showHistory} 
                        onClose={() => setShowHistory(false)} 
                    />
                )}
            </div>
        );
    };

    return (
        <div>
            {renderExtraccion()}
        </div>
    );
};

export default Extraction;