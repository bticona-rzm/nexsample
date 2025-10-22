import React, { useEffect, useState } from 'react';
import {handleErrorChange, formatNumber, formatErrorValue} from '../../../../lib/apiClient';
// En Planification.tsx - solo las partes modificadas
import { useLog } from '../../../../contexts/LogContext';
import { HelpButton } from './HelpButtonPlanification';

// Define la interfaz de las props que el componente espera recibir
interface PlanificationProps {
    isExcelLoaded: boolean;
    headers: string[];
    useFieldValue: boolean;
    setUseFieldValue: (value: boolean) => void;
    selectedField: string | null;
    setSelectedField: (value: string | null) => void;
    selectedPopulationType: "positive" | "negative" | "absolute";
    setSelectedPopulationType: (value: "positive" | "negative" | "absolute") => void;
    confidenceLevel: number;
    setConfidenceLevel: (value: number) => void;
    errorType: "importe" | "percentage";
    setErrorType: (value: "importe" | "percentage") => void;
    tolerableError: number;
    setTolerableError: (value: number) => void;
    expectedError: number;
    setExpectedError: (value: number) => void;
    modifyPrecision: boolean;
    setModifyPrecision: (value: boolean) => void;
    precisionValue: number;
    setPrecisionValue: (value: number) => void;
    estimatedPopulationValue: number;
    setEstimatedPopulationValue: (value: number) => void;
    estimatedSampleSize: number;
    setEstimatedSampleSize: (value: number) => void;
    sampleInterval: number;
    setSampleInterval: (value: number) => void;
    tolerableContamination: number;
    setTolerableContamination: (value: number) => void;
    conclusion: string;
    setConclusion: (value: string) => void;
    minSampleSize: number;
    setMinSampleSize: (value: number) => void;
    excelData: any[];
    setIsPlanificacionDone: (value: boolean) => void;
    setActiveTab: (tabId: string) => void;
    handlePlanification: () => void;
    highValueLimit: number;
    setHighValueLimit: (value: number) => void;
    populationExcludingHigh: number;
    setPopulationExcludingHigh: (value: number) => void;
    highValueTotal: number;
    setHighValueTotal: (value: number) => void;
    populationIncludingHigh: number;
    setPopulationIncludingHigh: (value: number) => void;
    highValueCount: number;
    setHighValueCount: (value: number) => void;
}

const Planification: React.FC<PlanificationProps> = ({
    isExcelLoaded,
    headers,
    useFieldValue,
    setUseFieldValue,
    selectedField,
    setSelectedField,
    selectedPopulationType,
    setSelectedPopulationType,
    confidenceLevel,
    setConfidenceLevel,
    errorType,
    setErrorType,
    tolerableError,
    setTolerableError,
    expectedError,
    setExpectedError,
    modifyPrecision,
    setModifyPrecision,
    precisionValue,
    setPrecisionValue,
    estimatedPopulationValue,
    setEstimatedPopulationValue,
    estimatedSampleSize,
    setEstimatedSampleSize,
    sampleInterval,
    setSampleInterval,
    tolerableContamination,
    setTolerableContamination,
    conclusion,
    setConclusion,
    minSampleSize,
    setMinSampleSize,
    excelData,
    setIsPlanificacionDone,
    setActiveTab,
    handlePlanification,
    highValueLimit, 
    setHighValueLimit,
    populationExcludingHigh,
    setPopulationExcludingHigh,
    populationIncludingHigh,
    setPopulationIncludingHigh,
    highValueCount,
    setHighValueCount,
    highValueTotal,
    setHighValueTotal
}) => {

    const { addLog } = useLog();
    const [hasEstimated, setHasEstimated] = useState(false);

    const calculatePopulationValue = () => {
        if (useFieldValue && selectedField && excelData.length > 0) {
            let totalValue = 0;
            let highValueSum = 0;
            let highValueItemsCount = 0;
            excelData.forEach(row => {
            const value = parseFloat(row[selectedField]);
                if (!isNaN(value)) {
                    let processedValue = 0;
                    
                    if (selectedPopulationType === "positive" && value > 0) {
                        processedValue = value;
                    } else if (selectedPopulationType === "negative" && value < 0) {
                        processedValue = Math.abs(value);
                    } else if (selectedPopulationType === "absolute") {
                        processedValue = Math.abs(value);
                    }
                    
                    totalValue += processedValue;
                    
                    // Identificar elementos de alto valor
                    if (processedValue >= highValueLimit) {
                        highValueSum += processedValue;
                        highValueItemsCount++;
                    }
                }
            });
            setEstimatedPopulationValue(totalValue);
            setHighValueTotal(highValueSum);
            setHighValueCount(highValueItemsCount);
            setPopulationExcludingHigh(totalValue - highValueSum);
            setPopulationIncludingHigh(totalValue);
        } else if (!useFieldValue) {
            setEstimatedPopulationValue(0);
            setHighValueTotal(0);
            setHighValueCount(0);
            setPopulationExcludingHigh(0);
            setPopulationIncludingHigh(0);
        }
    };

    const handleAccept = () => {
        if (!hasEstimated) {
            alert("Primero debe realizar la estimación para poder aceptar la planificación.");
            return;
        }

        addLog(
            'Planificación aceptada por usuario',
            `Tamaño muestra: ${estimatedSampleSize}\nIntervalo: ${sampleInterval.toFixed(2)}`,
            'planification'
        );

        // Ahora SÍ llamar a las funciones que navegan
        setIsPlanificacionDone(true);
        setActiveTab("extraccion");
        alert("Planificación aceptada. Ahora puedes ir a Extracción.");
    };

    const handleEstimate = async () => {
        // ✅ VALIDACIÓN COMPLETA
        if (estimatedPopulationValue <= 0) {
            alert("El valor de la población debe ser mayor a 0 para realizar la estimación.");
            return;
        }

        if (tolerableError <= 0) {
            alert("Debe ingresar un valor mayor a 0 para el Error tolerable.");
            return;
        }

        if (expectedError <= 0) {
            alert("Debe ingresar un valor mayor a 0 para el Error esperado.");
            return;
        }

        if (expectedError >= tolerableError) {
            alert("El Error esperado debe ser menor que el Error tolerable.");
            return;
        }

        if (!isExcelLoaded) {
            alert("Debe cargar un archivo Excel primero.");
            return;
        }

        addLog(
            'Usuario inició estimación de planificación',
            `Nivel confianza: ${confidenceLevel}%\nError tolerable: ${tolerableError}\nError esperado: ${expectedError}\nPoblación: ${estimatedPopulationValue}`,
            'planification'
        );

        try {
            await handlePlanification();
            setHasEstimated(true);
            addLog('Estimación completada exitosamente', '', 'planification');
        } catch (error) {
            console.error('Error en estimación:', error);
            setHasEstimated(false);
            alert("Error al realizar la estimación. Verifique los datos.");
        }
    };

    useEffect(() => {
        calculatePopulationValue();
    }, [useFieldValue, selectedField, selectedPopulationType, excelData]);

    const renderPlanification = () => {
        if (!isExcelLoaded) {
            return (
                <div className="p-4 text-center text-gray-500">
                    Para acceder a este módulo, primero debes cargar un archivo Excel.
                </div>
            );
        }
        return (
            <div className="flex space-x-6 p-4">
                <div className="flex-1 space-y-6">
                    {/* Sección 1: Valor total de la población */}
                    <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-800">Valor total de la población para la muestra</h3>
                            <HelpButton context="population-value" />
                        </div>
                        <div className="flex items-center mb-4">
                            <input
                                type="checkbox"
                                checked={useFieldValue}
                                onChange={(e) => {
                                    setUseFieldValue(e.target.checked);
                                    setEstimatedPopulationValue(0);
                                }}
                                className="h-4 w-4 text-blue-600 rounded"
                            />
                            <label className="ml-2 block text-sm font-medium text-gray-700">
                                Usar valores de campo:
                            </label>
                            <select
                                onChange={(e) => setSelectedField(e.target.value)}
                                disabled={!useFieldValue}
                                className={`ml-2 block w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${!useFieldValue && 'bg-gray-200 cursor-not-allowed'}`}
                            >
                                <option value="">Seleccionar campo...</option>
                                {headers.map((header) => (
                                    <option key={header} value={header}>
                                        {header}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="mt-4 flex space-x-4">
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    value="positive"
                                    checked={selectedPopulationType === "positive"}
                                    onChange={() => setSelectedPopulationType("positive")}
                                    disabled={!useFieldValue}
                                    className="h-4 w-4 text-blue-600"
                                />
                                <span className="ml-2 text-sm text-gray-700">Valores positivos</span>
                            </label>
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    value="negative"
                                    checked={selectedPopulationType === "negative"}
                                    onChange={() => setSelectedPopulationType("negative")}
                                    disabled={true}
                                    className="h-4 w-4 text-gray-400 cursor-not-allowed"
                                />
                                <span className="ml-2 text-sm text-gray-400">Valores negativos</span>
                            </label>
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    value="absolute"
                                    checked={selectedPopulationType === "absolute"}
                                    onChange={() => setSelectedPopulationType("absolute")}
                                    disabled={true}
                                    className="h-4 w-4 text-gray-400 cursor-not-allowed"
                                />
                                <span className="ml-2 text-sm text-gray-400">Valores absolutos</span>
                            </label>
                        </div>
                        <div className="mt-4 flex items-center">
                            <label className="text-sm font-medium text-gray-700 w-48">
                                Valor población para la muestra:
                            </label>
                            <input
                                type="text"
                                value={formatNumber(estimatedPopulationValue, 2)}
                                disabled={useFieldValue}
                                onChange={(e) => handleErrorChange(e.target.value, setEstimatedPopulationValue, false)}
                                className={`ml-2 block w-48 rounded-md border-gray-300 shadow-sm text-right ${useFieldValue ? 'bg-gray-200 cursor-not-allowed' : ''}`}
                            />
                        </div>
                    </div>

                    {/* Sección 2: Configuraciones */}
                    <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-800">Configuraciones</h3>
                            <HelpButton context="configurations" />
                        </div>
                        
                        {/* Nivel de confianza */}
                        <div className="flex items-center space-x-4 mb-4">
                            <label className="text-sm font-medium text-gray-700">
                                Nivel de confianza(%):
                            </label>
                            <input
                                type="number"
                                value={formatNumber(confidenceLevel, 2)}
                                onChange={(e) => {
                                    const value = Number(e.target.value);
                                    if (value >= 1 && value <= 99) {
                                        setConfidenceLevel(value);
                                    }
                                }}
                                min="75"
                                max="99"
                                className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-center"
                            />
                            <span className="text-sm text-gray-500">(75-99%)</span>
                        </div>
                        
                        {/* Tipo de error */}
                        <div className="flex items-center space-x-4 mb-4">
                            <label className="text-sm font-medium text-gray-700">Tipo de error:</label>
                            <div className="flex space-x-4">
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        value="importe"
                                        checked={errorType === "importe"}
                                        onChange={() => setErrorType("importe")}
                                        className="h-4 w-4 text-blue-600"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Importe</span>
                                </label>
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        value="percentage"
                                        checked={errorType === "percentage"}
                                        onChange={() => setErrorType("percentage")}
                                        className="h-4 w-4 text-blue-600"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Porcentaje</span>
                                </label>
                            </div>
                            <HelpButton context="error-type" />
                        </div>
                        
                        {/* Error tolerable */}
                        <div className="flex items-center space-x-4 mb-4">
                            <label className="text-sm font-medium text-gray-700 w-32">
                                Error tolerable:
                            </label>
                            <input
                                type="text"
                                value={formatErrorValue(tolerableError, errorType === "percentage")}
                                onChange={(e) => handleErrorChange(e.target.value, setTolerableError, errorType === "percentage")}
                                className="block w-32 rounded-md border-gray-300 shadow-sm sm:text-sm text-right"
                            />
                            {errorType === "percentage" && <span className="text-gray-700">%</span>}
                            <HelpButton context="tolerable-error" />
                        </div>
                        
                        {/* Error esperado */}
                        <div className="flex items-center space-x-4 mb-4">
                            <label className="text-sm font-medium text-gray-700 w-32">
                                Error esperado:
                            </label>
                            <input
                                type="text"
                                value={formatErrorValue(expectedError, errorType === "percentage")}
                                onChange={(e) => handleErrorChange(e.target.value, setExpectedError, errorType === "percentage")}
                                className="block w-32 rounded-md border-gray-300 shadow-sm sm:text-sm text-right"
                            />
                            {errorType === "percentage" && <span className="text-gray-700">%</span>}
                            <HelpButton context="expected-error" />
                        </div>
                        
                        {/* Precisión básica */}
                        <div className="flex items-center space-x-4">
                            <input
                                type="checkbox"
                                checked={modifyPrecision}
                                onChange={(e) => setModifyPrecision(e.target.checked)}
                                className="h-4 w-4 text-blue-600 rounded"
                                disabled={true}
                            />
                            <label className="text-sm font-medium text-gray-400">
                                Modificar valor de precisión básica (100%):
                            </label>
                            <input
                                type="text"
                                value={precisionValue}
                                disabled={true}
                                onChange={(e) => setPrecisionValue(Number(e.target.value))}
                                className="block w-24 rounded-md border-gray-300 shadow-sm text-center bg-gray-200 cursor-not-allowed"
                            />
                            <span className="text-gray-400">%</span>
                        </div>
                    </div>

                    {/* Sección 3: Resultados de la Muestra */}
                    <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-800">Resultados de la Muestra</h3>
                            <HelpButton context="sample-results" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700">Tamaño de la muestra aprox.:</span>
                                <span className="text-sm text-gray-900 font-bold">{formatNumber(estimatedSampleSize, 0)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700">Intervalo muestral:</span>
                                <span className="text-sm text-gray-900 font-bold">{formatNumber(sampleInterval, 2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700">Suma contaminaciones tolerables:</span>
                                <span className="text-sm text-gray-900 font-bold">{formatNumber(tolerableContamination, 2)}%</span>
                            </div>
                        </div>
                        <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <p className="text-sm text-yellow-800">
                                {conclusion}
                            </p>
                            <p className="text-sm mt-2 text-yellow-800">
                                Este es el mínimo tamaño muestral que permite obtener la anterior conclusión.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Panel de botones lateral */}
                <div className="w-48 flex-none flex flex-col space-y-4 mt-8">
                    <button
                        onClick={handleEstimate}
                        disabled={
                            !isExcelLoaded || 
                            tolerableError <= 0 || 
                            expectedError <= 0 || 
                            expectedError >= tolerableError ||
                            estimatedPopulationValue <= 0
                        }
                        className={`bg-purple-600 ${
                            !isExcelLoaded || 
                            tolerableError <= 0 || 
                            expectedError <= 0 || 
                            expectedError >= tolerableError ||
                            estimatedPopulationValue <= 0
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'hover:bg-purple-700'
                        } text-white font-semibold py-2 px-4 rounded shadow`}
                    >
                        Estimar
                    </button>
                    <button
                        onClick={handleAccept}
                        disabled={!hasEstimated}
                        className={`bg-green-600 ${!hasEstimated ? 'bg-gray-400 cursor-not-allowed' : 'hover:bg-green-700'} text-white font-semibold py-2 px-4 rounded shadow`}
                    >
                        Aceptar
                    </button>
                    <button
                        onClick={() => setActiveTab("visualizar")}
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded shadow"
                    >
                        Cancelar
                    </button>
                    
                    {/* Botón de ayuda general - CON TEXTO "AYUDA" */}
                    <div className="flex justify-center">
                        <HelpButton 
                            context="general" 
                            className="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-full shadow w-full" 
                        />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div>
            {renderPlanification()}
        </div>
    );
};

export default Planification;