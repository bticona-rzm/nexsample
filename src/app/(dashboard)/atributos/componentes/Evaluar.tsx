// /app/dashboard/atributos/components/Evaluar.tsx
import React from 'react';
import { HelpButtonEvaluarAtributos } from './HelpButtonEvaluarAtributos';

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
                    {/* Título con ayuda general */}
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-800">Evaluación del Muestreo</h3>
                        <HelpButtonEvaluarAtributos context="general" />
                    </div>
                    
                    {/* Sección de parámetros con ayuda */}
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <h4 className="text-lg font-semibold">Parámetros de Evaluación</h4>
                            <HelpButtonEvaluarAtributos context="inputs" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-gray-700">Tamaño de la población:</label>
                                <span className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-gray-100">{populationSize.toLocaleString()}</span>
                            </div>
                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-gray-700">Tamaño de la muestra evaluada:</label>
                                <span className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-gray-100">{evaluatedSampleSize.toLocaleString()}</span>
                            </div>
                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-gray-700">
                                    Número de desviaciones observadas:
                                    <span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max={evaluatedSampleSize}
                                    value={observedDeviations}
                                    onChange={(e) => setObservedDeviations(Math.max(0, Number(e.target.value)))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                    placeholder="Ej: 2"
                                />
                                <span className="text-xs text-gray-500 mt-1">
                                    Máximo: {evaluatedSampleSize} desviaciones
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-gray-700">
                                    Nivel de confianza deseado (%):
                                    <span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={desiredConfidence}
                                    onChange={(e) => setDesiredConfidence(Math.min(100, Math.max(1, Number(e.target.value))))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                    placeholder="Ej: 95"
                                />
                                <span className="text-xs text-gray-500 mt-1">
                                    Valores típicos: 90%, 95%, 99%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Sección de resultados con ayuda */}
                    {isEvaluarDone && (
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg shadow-inner border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-bold">Resultados de la Evaluación</h4>
                                <HelpButtonEvaluarAtributos context="results" />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col">
                                    <label className="text-sm font-medium text-gray-700">Tasa de desviación de la muestra:</label>
                                    <span className="mt-1 text-lg font-bold text-gray-900">{sampleDeviationRate.toFixed(2)}%</span>
                                    <span className="text-xs text-gray-500 mt-1">
                                        {observedDeviations} / {evaluatedSampleSize} registros
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-sm font-medium text-gray-700">Límite unilateral superior:</label>
                                    <span className="mt-1 text-lg font-bold text-gray-900">{unilateralUpperLimit.toFixed(2)}%</span>
                                    <span className="text-xs text-gray-500 mt-1">
                                        Máxima desviación poblacional
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-sm font-medium text-gray-700">Límite bilateral inferior:</label>
                                    <span className="mt-1 text-lg font-bold text-gray-900">{bilateralLowerLimit.toFixed(2)}%</span>
                                    <span className="text-xs text-gray-500 mt-1">
                                        Mínimo del intervalo
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-sm font-medium text-gray-700">Límite bilateral superior:</label>
                                    <span className="mt-1 text-lg font-bold text-gray-900">{bilateralUpperLimit.toFixed(2)}%</span>
                                    <span className="text-xs text-gray-500 mt-1">
                                        Máximo del intervalo
                                    </span>
                                </div>
                            </div>

                            {/* Conclusión automática */}
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <h5 className="font-semibold text-blue-900 text-sm mb-1">Interpretación:</h5>
                                <p className="text-xs text-blue-800">
                                    Con un {desiredConfidence}% de confianza, la tasa real de desviación en la población 
                                    está entre <strong>{bilateralLowerLimit.toFixed(2)}%</strong> y <strong>{bilateralUpperLimit.toFixed(2)}%</strong>.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Columna Derecha: Botones de Acción */}
            <div className="w-48 flex-none flex flex-col space-y-4 mt-2">
                <button
                    onClick={handleCalculateEvaluation}
                    disabled={observedDeviations < 0 || desiredConfidence <= 0 || desiredConfidence > 100}
                    className={`font-semibold py-2 px-4 rounded shadow transition-colors ${
                        observedDeviations < 0 || desiredConfidence <= 0 || desiredConfidence > 100
                            ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                            : "bg-purple-600 hover:bg-purple-700 text-white"
                    }`}
                >
                    Calcular
                </button>
                <button
                    onClick={handlePrint}
                    disabled={!isEvaluarDone}
                    className={`font-semibold py-2 px-4 rounded shadow transition-colors ${
                        !isEvaluarDone 
                            ? "bg-gray-400 text-gray-700 cursor-not-allowed" 
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                >
                    Imprimir
                </button>
                <button
                    onClick={handleClose}
                    className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded shadow transition-colors"
                >
                    Cerrar
                </button>
                <HelpButtonEvaluarAtributos 
                    context="general" 
                    className="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-full shadow transition-colors" 
                />
            </div>
        </div>
    );
};

export default Evaluar;