import React, { useEffect, useState } from 'react';

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
}) => {

    const calculatePopulationValue = () => {
        if (useFieldValue && selectedField && excelData.length > 0) {
            const sum = excelData.reduce((acc, row) => {
                const value = parseFloat(row[selectedField]);
                if (!isNaN(value)) {
                    if (selectedPopulationType === "positive" && value > 0) {
                        return acc + value;
                    }
                    if (selectedPopulationType === "negative" && value < 0) {
                        return acc + Math.abs(value);
                    }
                    if (selectedPopulationType === "absolute") {
                        return acc + Math.abs(value);
                    }
                }
                return acc;
            }, 0);
            setEstimatedPopulationValue(sum);
        } else if (!useFieldValue) {
            setEstimatedPopulationValue(0); 
        }
    };

    const [hasEstimated, setHasEstimated] = useState(false);

    const handleEstimate = async () => {
        // Si NO se está usando el valor de campo, la población es el número de registros.
        // Si la población calculada por el cliente es 0 y el usuario no está usando el campo,
        // es probable que el excelData.length sea 0, lo cual es inválido.
        if (!useFieldValue && excelData.length === 0) {
            alert("La población es cero. No se puede realizar la estimación.");
            return;
        }

        try {
            const response = await fetch('/api/mum/planification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    estimatedPopulationValue: estimatedPopulationValue,
                    confidenceLevel: confidenceLevel,
                    errorType: errorType,
                    tolerableError: tolerableError,
                    expectedError: expectedError,
                    // ¡AÑADIR ESTOS DOS CAMPOS!
                    excelData: excelData, // Se envía para calcular el N total si no se usa valor de campo.
                    useFieldValue: useFieldValue,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Manejar errores del servidor
                alert(`Error de Planificación: ${data.error || 'Algo salió mal.'}`);
                return;
            }

            // 1. Actualizar Estados con los resultados del API
            setEstimatedSampleSize(data.estimatedSampleSize);
            setSampleInterval(data.sampleInterval);
            setTolerableContamination(data.tolerableContamination);
            setMinSampleSize(data.minSampleSize);
            setConclusion(data.conclusion);
            
            setHasEstimated(true);

        } catch (error) {
            console.error("Error al estimar la planificación:", error);
            alert("Error de conexión con el servidor. No se pudo realizar la estimación.");
        }
    };

    const handleAccept = () => {
        if (!hasEstimated) {
            alert("Primero debe realizar la estimación para poder aceptar la planificación.");
            return;
        }

        setIsPlanificacionDone(true);
        setActiveTab("extraccion");
        alert("Planificación aceptada. Ahora puedes ir a Extracción.");
    };

    const handlePrint = () => {
        window.print();
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
                    <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
                        <h3 className="text-xl font-bold mb-4 text-gray-800">Valor total de la población para la muestra</h3>
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
                                    disabled={!useFieldValue}
                                    className="h-4 w-4 text-blue-600"
                                />
                                <span className="ml-2 text-sm text-gray-700">Valores negativos</span>
                            </label>
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    value="absolute"
                                    checked={selectedPopulationType === "absolute"}
                                    onChange={() => setSelectedPopulationType("absolute")}
                                    disabled={!useFieldValue}
                                    className="h-4 w-4 text-blue-600"
                                />
                                <span className="ml-2 text-sm text-gray-700">Valores absolutos</span>
                            </label>
                        </div>
                        <div className="mt-4 flex items-center">
                            <label className="text-sm font-medium text-gray-700 w-48">
                                Valor población para la muestra:
                            </label>
                            <input
                                type="text"
                                value={estimatedPopulationValue.toLocaleString()}
                                disabled={useFieldValue}
                                onChange={(e) => setEstimatedPopulationValue(Number(e.target.value))}
                                className={`ml-2 block w-48 rounded-md border-gray-300 shadow-sm text-right ${useFieldValue ? 'bg-gray-200 cursor-not-allowed' : ''}`}
                            />
                        </div>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
                        <h3 className="text-xl font-bold mb-4 text-gray-800">Configuraciones</h3>
                        <div className="flex items-center space-x-4 mb-4">
                            <label className="text-sm font-medium text-gray-700">
                                Nivel de confianza(%):
                            </label>
                            <input
                                type="number"
                                value={confidenceLevel}
                                onChange={(e) => setConfidenceLevel(Number(e.target.value))}
                                min="1"
                                max="100"
                                className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-center"
                            />
                        </div>
                        <div className="flex space-x-4 mb-4">
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
                        <div className="flex items-center space-x-4 mb-4">
                            <label className="text-sm font-medium text-gray-700 w-32">
                                Error tolerable:
                            </label>
                            <input
                                type="number"
                                min="0" 
                                value={tolerableError}
                                onChange={(e) => setTolerableError(Number(e.target.value))}
                                className="block w-24 rounded-md border-gray-300 shadow-sm sm:text-sm text-center"
                            />
                            {/* El span del % solo se muestra si el errorType es 'percentage' */}
                            {errorType === "percentage" && <span className="text-gray-700">%</span>}
                        </div>
                        <div className="flex items-center space-x-4 mb-4">
                            <label className="text-sm font-medium text-gray-700 w-32">
                                Error esperado:
                            </label>
                            <input
                                type="number"
                                min="0" 
                                value={expectedError}
                                onChange={(e) => setExpectedError(Number(e.target.value))}
                                className="block w-24 rounded-md border-gray-300 shadow-sm sm:text-sm text-center"
                            />
                            {/* El span del % solo se muestra si el errorType es 'percentage' */}
                            {errorType === "percentage" && <span className="text-gray-700">%</span>}
                        </div>
                        <div className="flex items-center space-x-4">
                            <input
                                type="checkbox"
                                checked={modifyPrecision}
                                onChange={(e) => setModifyPrecision(e.target.checked)}
                                className="h-4 w-4 text-blue-600 rounded"
                            />
                            <label className="text-sm font-medium text-gray-700">
                                Modificar valor de precisión básica (100%):
                            </label>
                            <input
                                type="text"
                                value={precisionValue}
                                disabled={!modifyPrecision}
                                onChange={(e) => setPrecisionValue(Number(e.target.value))}
                                className={`block w-24 rounded-md border-gray-300 shadow-sm text-center ${!modifyPrecision && 'bg-gray-200 cursor-not-allowed'}`}
                            />
                            <span className="text-gray-700">%</span>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
                        <h3 className="text-xl font-bold text-gray-800">Resultados de la Muestra</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700">Tamaño de la muestra aprox.:</span>
                                <span className="text-sm text-gray-900 font-bold">{estimatedSampleSize}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700">Intervalo muestral:</span>
                                <span className="text-sm text-gray-900 font-bold">{sampleInterval.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700">Suma contaminaciones tolerables:</span>
                                <span className="text-sm text-gray-900 font-bold">{tolerableContamination.toFixed(2)}%</span>
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
                <div className="w-48 flex-none flex flex-col space-y-4 mt-8">
                    <button
                        onClick={handleEstimate}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded shadow"
                    >
                        Estimar
                    </button>
                    <button
                        onClick={handleAccept}
                        disabled={!hasEstimated} // Agrega esta línea
                        className={`bg-green-600 ${!hasEstimated ? 'bg-gray-400 cursor-not-allowed' : 'hover:bg-green-700'} text-white font-semibold py-2 px-4 rounded shadow`}
                    >
                        Aceptar
                    </button>
                    <button
                        onClick={handlePrint}
                        className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded shadow"
                    >
                        Imprimir
                    </button>
                    <button
                        onClick={() => setActiveTab("visualizar")}
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded shadow"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => alert("Función de Ayuda: Consulta la documentación del software IDEA para los cálculos estadísticos o contacta al soporte.")}
                        className="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-full shadow"
                    >
                        ? Ayuda
                    </button>
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