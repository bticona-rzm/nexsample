// /app/dashboard/atributos/components/Evaluar.tsx

import React from 'react';

type EvaluarProps = {
    isAleatorioDone: boolean;
    populationSize: number;
    evaluatedSampleSize: number;
    observedDeviations: number;
    desiredConfidence: number;
    sampleDeviationRate: number;
    unilateralUpperLimit: number;
    bilateralLowerLimit: number;
    bilateralUpperLimit: number;
    isEvaluarDone: boolean;
    setObservedDeviations: (value: number) => void;
    setDesiredConfidence: (value: number) => void;
    handleCalculateEvaluation: () => void;
    handlePrint: () => void;
    handleClose: () => void;
    handleHelp: () => void;
};

const Evaluar: React.FC<EvaluarProps> = ({
    isAleatorioDone,
    populationSize,
    evaluatedSampleSize,
    observedDeviations,
    desiredConfidence,
    sampleDeviationRate,
    unilateralUpperLimit,
    bilateralLowerLimit,
    bilateralUpperLimit,
    isEvaluarDone,
    setObservedDeviations,
    setDesiredConfidence,
    handleCalculateEvaluation,
    handlePrint,
    handleClose,
    handleHelp,
}) => {
    // Bloqueo si la etapa anterior no está lista
    if (!isAleatorioDone) {
        return (
            <div className="p-4 text-center text-gray-500">
                Debes completar el paso de Muestreo Aleatorio primero.
            </div>
        );
    }

    return (
        <div className="flex space-x-6 p-4">
            {/* Columna Izquierda: Formulario de Evaluación y Resultados */}
            <div className="flex-1 space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-bold mb-4 text-gray-800">Evaluación del Muestreo</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700">Tamaño de la población:</label>
                            <span className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-gray-100">{populationSize}</span>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700">Tamaño de la muestra evaluada:</label>
                            <span className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-gray-100">{evaluatedSampleSize}</span>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700">Número de desviaciones observadas:</label>
                            <input
                                type="number"
                                min="0"
                                value={observedDeviations}
                                onChange={(e) => setObservedDeviations(Number(e.target.value))}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700">Nivel de confianza deseado (%):</label>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={desiredConfidence}
                                onChange={(e) => setDesiredConfidence(Number(e.target.value))}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    {isEvaluarDone && (
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg shadow-inner">
                            <h4 className="text-lg font-bold mb-2">Resultados de la Evaluación</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col">
                                    <label className="text-sm font-medium text-gray-700">Tasa de desviación de la muestra:</label>
                                    <span className="mt-1 text-lg font-bold text-gray-900">{sampleDeviationRate.toFixed(2)}%</span>
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-sm font-medium text-gray-700">Límite unilateral superior:</label>
                                    <span className="mt-1 text-lg font-bold text-gray-900">{unilateralUpperLimit.toFixed(2)}%</span>
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-sm font-medium text-gray-700">Límite bilateral inferior:</label>
                                    <span className="mt-1 text-lg font-bold text-gray-900">{bilateralLowerLimit.toFixed(2)}%</span>
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-sm font-medium text-gray-700">Límite bilateral superior:</label>
                                    <span className="mt-1 text-lg font-bold text-gray-900">{bilateralUpperLimit.toFixed(2)}%</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Columna Derecha: Botones de Acción */}
            <div className="w-48 flex-none flex flex-col space-y-4 mt-2">
                <button
                    onClick={handleCalculateEvaluation}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded shadow"
                >
                    Calcular
                </button>
                <button
                    onClick={handlePrint}
                    disabled={!isEvaluarDone}
                    className={`font-semibold py-2 px-4 rounded shadow ${!isEvaluarDone ? "bg-gray-400 text-gray-700 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
                >
                    Imprimir
                </button>
                <button
                    onClick={handleClose}
                    className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded shadow"
                >
                    Cerrar
                </button>
                <button
                    onClick={handleHelp}
                    className="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-full shadow"
                >
                    ? Ayuda
                </button>
            </div>
        </div>
    );
};

export default Evaluar;