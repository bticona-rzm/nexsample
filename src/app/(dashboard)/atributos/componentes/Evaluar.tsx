import React, { useState } from 'react';
import { HelpButtonEvaluarAtributos } from './HelpButtonEvaluarAtributos';
import { useLogAtributos } from '@/contexts/LogContextAtributos'; // ✅ Añadir import

// ✅ INTERFACE MEJORADA
type EvaluarProps = {
    isAleatorioDone: boolean;
    populationSize: number;
    evaluatedSampleSize: number;
    observedDeviations: number;
    desiredConfidence: number;
    sampleDeviationRate: number;
    isEvaluarDone: boolean;
    setObservedDeviations: (value: number) => void;
    setDesiredConfidence: (value: number) => void;
    handleCalculateEvaluation: () => void;
    handlePrint: () => void;
    handleClose: () => void;
    handleHelp: () => void;
    unilateralUpperLimit: number;
    bilateralLowerLimit: number;
    bilateralUpperLimit: number;
    randomSample?: any[];
    headers?: string[];
    onOpenHistory: () => void; // ✅ NUEVA PROP PARA HISTORIAL
};

// ✅ COMPONENTE PARA CONTEO VISUAL MEJORADO CON LOGS
const DeviationCounter: React.FC<{
    sample: any[];
    headers: string[];
    deviations: number;
    onDeviationsChange: (count: number) => void;
    containerWidth: string;
}> = ({ sample, headers, deviations, onDeviationsChange, containerWidth }) => {
    const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
    const { addLog } = useLogAtributos(); // ✅ Añadir contexto de logs

    const toggleSelection = (index: number) => {
        const newSelected = new Set(selectedItems);
        const wasSelected = newSelected.has(index);
        
        if (wasSelected) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        
        setSelectedItems(newSelected);
        onDeviationsChange(newSelected.size);
        
        // ✅ LOG DE SELECCIÓN/DESELECCIÓN
        addLog(
            wasSelected ? 'Usuario deseleccionó desviación' : 'Usuario seleccionó desviación',
            `Registro: ${index + 1}\nTotal desviaciones seleccionadas: ${newSelected.size}\nMuestra total: ${sample.length}`,
            'evaluación',
            'user'
        );
    };

    const handleClearSelection = () => {
        // ✅ LOG ANTES DE LIMPIAR
        addLog(
            'Usuario limpió todas las selecciones de desviaciones',
            `Desviaciones limpiadas: ${selectedItems.size}\nNuevo total: 0`,
            'evaluación',
            'user'
        );
        
        setSelectedItems(new Set());
        onDeviationsChange(0);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold">Conteo Visual de Desviaciones</h4>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {selectedItems.size} seleccionados
                </span>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
                Haz clic en los registros que representan desviaciones. Cada registro seleccionado se contará como una desviación.
            </p>

            {/* ✅ CONTENEDOR CON ANCHO CALCULADO DINÁMICAMENTE */}
            <div className={`overflow-auto border rounded-lg max-h-96 ${containerWidth}`}>
                <table className="min-w-full">
                    <thead className="bg-gray-50 sticky top-0">
                        <tr>
                            <th className="px-4 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                                ✓
                            </th>
                            <th className="px-4 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                                #
                            </th>
                            {headers?.map(header => (
                                <th key={header} className="px-4 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {sample.map((record, index) => (
                            <tr 
                                key={index}
                                className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                                    selectedItems.has(index) ? 'bg-red-50 border-l-4 border-l-red-500' : ''
                                }`}
                                onClick={() => toggleSelection(index)}
                            >
                                <td className="px-4 py-3 whitespace-nowrap text-center">
                                    <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                                        selectedItems.has(index) 
                                            ? 'bg-green-500 border-green-600 text-white' 
                                            : 'bg-white border-gray-300'
                                    }`}>
                                        {selectedItems.has(index) ? '✓' : ''}
                                    </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                    {index + 1}
                                </td>
                                {headers?.map(header => (
                                    <td key={header} className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                        {record[header]?.toString() || '-'}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 flex justify-between items-center">
                <span className="text-sm text-gray-600">
                    {selectedItems.size} de {sample.length} registros seleccionados como desviaciones
                </span>
                <button
                    onClick={handleClearSelection}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                >
                    Limpiar selección
                </button>
            </div>
        </div>
    );
};

const Evaluar: React.FC<EvaluarProps> = ({
    isAleatorioDone,
    populationSize,
    evaluatedSampleSize,
    observedDeviations,
    desiredConfidence,
    sampleDeviationRate,
    isEvaluarDone,
    setObservedDeviations,
    setDesiredConfidence,
    handleCalculateEvaluation,
    handlePrint,
    handleClose,
    handleHelp,
    unilateralUpperLimit,
    bilateralLowerLimit,
    bilateralUpperLimit,
    randomSample = [],
    headers = [],
    onOpenHistory, // ✅ NUEVA PROP
}) => {
    // ✅ CONTEXTO DE LOGS
    const { addLog } = useLogAtributos();

    const [countMethod, setCountMethod] = useState<'manual' | 'visual'>('manual');

    // ✅ FUNCIÓN MEJORADA PARA CAMBIAR MÉTODO DE CONTEO
    const handleCountMethodChange = (method: 'manual' | 'visual') => {
        setCountMethod(method);
        
        addLog(
            'Usuario cambió método de conteo de desviaciones',
            `Nuevo método: ${method === 'visual' ? 'Conteo Visual' : 'Ingreso Manual'}\nDesviaciones actuales: ${observedDeviations}`,
            'evaluación',
            'user'
        );
    };

    // ✅ FUNCIÓN MEJORADA PARA CAMBIAR DESVIACIONES MANUALES
    const handleManualDeviationsChange = (value: number) => {
        const newValue = Math.max(0, Number(value));
        setObservedDeviations(newValue);
        
        addLog(
            'Usuario modificó desviaciones manualmente',
            `Nuevo valor: ${newValue}\nMáximo posible: ${evaluatedSampleSize}`,
            'evaluación',
            'user'
        );
    };

    // ✅ FUNCIÓN MEJORADA PARA CAMBIAR CONFIANZA
    const handleConfidenceChange = (value: number) => {
        const newValue = Math.min(100, Math.max(1, Number(value)));
        setDesiredConfidence(newValue);
        
        addLog(
            'Usuario modificó nivel de confianza',
            `Nuevo valor: ${newValue}%`,
            'evaluación',
            'user'
        );
    };

    // ✅ FUNCIÓN MEJORADA PARA CALCULAR EVALUACIÓN
    const handleCalculateWithLog = () => {
        addLog(
            'Usuario inició cálculo de evaluación',
            `Parámetros:\n- Desviaciones observadas: ${observedDeviations}\n- Confianza deseada: ${desiredConfidence}%\n- Tamaño muestra: ${evaluatedSampleSize}\n- Método conteo: ${countMethod === 'visual' ? 'Visual' : 'Manual'}`,
            'evaluación',
            'user'
        );
        handleCalculateEvaluation();
    };

    // ✅ FUNCIÓN MEJORADA PARA IMPRIMIR
    const handlePrintWithLog = () => {
        addLog(
            'Usuario imprimió resultados de evaluación',
            `Tasa desviación: ${sampleDeviationRate.toFixed(2)}%\nLímite superior: ${unilateralUpperLimit.toFixed(2)}%\nIntervalo: [${bilateralLowerLimit.toFixed(2)}%, ${bilateralUpperLimit.toFixed(2)}%]`,
            'evaluación',
            'user'
        );
        handlePrint();
    };

    // ✅ FUNCIÓN MEJORADA PARA CERRAR
    const handleCloseWithLog = () => {
        addLog(
            'Usuario cerró módulo de evaluación',
            `Estado final:\n- Evaluación completada: ${isEvaluarDone}\n- Desviaciones: ${observedDeviations}\n- Confianza: ${desiredConfidence}%`,
            'evaluación',
            'user'
        );
        handleClose();
    };

    // ✅ CALCULAR EL ANCHO DEL CONTENEDOR BASADO EN EL LAYOUT
    const calculateContainerWidth = () => {
        if (typeof window !== 'undefined') {
            const screenWidth = window.innerWidth;
            if (screenWidth < 768) return "max-w-full";
            if (screenWidth < 1024) return "max-w-2xl";
            return "max-w-3xl";
        }
        return "max-w-3xl";
    };

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
                        <div className="flex items-center gap-2">
                            <HelpButtonEvaluarAtributos context="general" />
                        </div>
                    </div>
                    
                    {/* Selector de método de conteo */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Método de conteo de desviaciones:
                        </label>
                        <div className="flex space-x-4">
                            <button
                                type="button"
                                onClick={() => handleCountMethodChange('manual')}
                                className={`px-4 py-2 rounded-md text-sm font-medium ${
                                    countMethod === 'manual'
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                ⌨️ Ingreso Manual
                            </button>
                            <button
                                type="button"
                                onClick={() => handleCountMethodChange('visual')}
                                className={`px-4 py-2 rounded-md text-sm font-medium ${
                                    countMethod === 'visual'
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                📊 Conteo Visual
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            {countMethod === 'visual' 
                                ? 'Selecciona visualmente los registros que representan desviaciones'
                                : 'Ingresa manualmente el número total de desviaciones encontradas'
                            }
                        </p>
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
                                <span className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-gray-100">
                                    {populationSize.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-gray-700">Tamaño de la muestra evaluada:</label>
                                <span className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-gray-100">
                                    {evaluatedSampleSize.toLocaleString()}
                                </span>
                            </div>
                            
                            {/* Método de conteo seleccionado */}
                            {countMethod === 'manual' ? (
                                <div className="flex flex-col">
                                    <label className="text-sm font-medium text-gray-700">
                                        Número de desviaciones observadas:
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max={evaluatedSampleSize}
                                        value={observedDeviations}
                                        onChange={(e) => handleManualDeviationsChange(Number(e.target.value))}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                        placeholder="Ej: 2"
                                    />
                                    <span className="text-xs text-gray-500 mt-1">
                                        Máximo: {evaluatedSampleSize} desviaciones
                                    </span>
                                </div>
                            ) : (
                                <div className="flex flex-col">
                                    <label className="text-sm font-medium text-gray-700">
                                        Desviaciones encontradas:
                                    </label>
                                    <div className="mt-1 p-2 bg-green-50 border border-green-200 rounded-md">
                                        <span className="text-lg font-bold text-green-700">
                                            {observedDeviations}
                                        </span>
                                        <span className="text-sm text-green-600 ml-2">
                                            registros seleccionados
                                        </span>
                                    </div>
                                    <span className="text-xs text-gray-500 mt-1">
                                        Usa la tabla inferior para seleccionar desviaciones
                                    </span>
                                </div>
                            )}
                            
                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-gray-700">
                                    Nivel de confianza deseado (%):
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={desiredConfidence}
                                    onChange={(e) => handleConfidenceChange(Number(e.target.value))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                    placeholder="Ej: 95"
                                />
                                <span className="text-xs text-gray-500 mt-1">
                                    Valores típicos: 90%, 95%, 99%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Conteo visual (solo se muestra cuando el método es visual) */}
                    {countMethod === 'visual' && randomSample && randomSample.length > 0 && (
                        <DeviationCounter
                            sample={randomSample}
                            headers={headers}
                            deviations={observedDeviations}
                            onDeviationsChange={setObservedDeviations}
                            containerWidth={calculateContainerWidth()}
                        />
                    )}

                    {/* Sección de resultados con ayuda */}
                    {isEvaluarDone && (
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg shadow-inner border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-bold">Resultados de la Evaluación</h4>
                                <HelpButtonEvaluarAtributos context="results" />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                {/* Tasa de desviación muestral */}
                                <div className="flex flex-col">
                                    <label className="text-sm font-medium text-gray-700">Tasa de desviación de la muestra:</label>
                                    <span className="mt-1 text-lg font-bold text-gray-900">{sampleDeviationRate.toFixed(2)}%</span>
                                    <span className="text-xs text-gray-500 mt-1">
                                        {observedDeviations} / {evaluatedSampleSize} registros
                                    </span>
                                </div>

                                {/* Límite unilateral superior */}
                                <div className="flex flex-col">
                                    <label className="text-sm font-medium text-gray-700">Límite unilateral superior:</label>
                                    <span className="mt-1 text-lg font-bold text-orange-600">{unilateralUpperLimit.toFixed(2)}%</span>
                                    <span className="text-xs text-gray-500 mt-1">
                                        Máxima desviación poblacional
                                    </span>
                                </div>

                                {/* Límite bilateral inferior */}
                                <div className="flex flex-col">
                                    <label className="text-sm font-medium text-gray-700">Límite bilateral inferior:</label>
                                    <span className="mt-1 text-lg font-bold text-green-600">{bilateralLowerLimit.toFixed(2)}%</span>
                                    <span className="text-xs text-gray-500 mt-1">
                                        Mínimo del intervalo
                                    </span>
                                </div>

                                {/* Límite bilateral superior */}
                                <div className="flex flex-col">
                                    <label className="text-sm font-medium text-gray-700">Límite bilateral superior:</label>
                                    <span className="mt-1 text-lg font-bold text-blue-600">{bilateralUpperLimit.toFixed(2)}%</span>
                                    <span className="text-xs text-gray-500 mt-1">
                                        Máximo del intervalo
                                    </span>
                                </div>
                            </div>

                            {/* Conclusión automática */}
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <h5 className="font-semibold text-blue-900 text-sm mb-1">Interpretación Estadística:</h5>
                                <p className="text-xs text-blue-800">
                                    Con un <strong>{desiredConfidence}% de confianza</strong>, la tasa real de desviación en la población 
                                    está entre <strong>{bilateralLowerLimit.toFixed(2)}%</strong> y <strong>{bilateralUpperLimit.toFixed(2)}%</strong>.
                                    El límite superior máximo es <strong>{unilateralUpperLimit.toFixed(2)}%</strong>.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Columna Derecha: Botones de Acción */}
            <div className="w-48 flex-none flex flex-col space-y-4 mt-2">
                {/* ✅ BOTÓN CALCULAR CON LOGS */}
                <button
                    onClick={handleCalculateWithLog}
                    disabled={observedDeviations < 0 || desiredConfidence <= 0 || desiredConfidence > 100}
                    className={`font-semibold py-2 px-4 rounded shadow transition-colors ${
                        observedDeviations < 0 || desiredConfidence <= 0 || desiredConfidence > 100
                            ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                >
                    Calcular
                </button>

                {/* ✅ BOTÓN CERRAR CON LOGS */}
                <button
                    onClick={handleCloseWithLog}
                    className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded shadow transition-colors"
                >
                    Cerrar
                </button>
                
                {/* ✅ BOTÓN IMPRIMIR CON LOGS */}
                <button
                    onClick={handlePrintWithLog}
                    disabled={!isEvaluarDone}
                    className={`font-semibold py-2 px-4 rounded shadow transition-colors ${
                        !isEvaluarDone 
                            ? "bg-gray-400 text-gray-700 cursor-not-allowed" 
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                >
                    Imprimir
                </button>
                
                {/* ✅ BOTÓN HISTORIAL */}
                <button
                    onClick={onOpenHistory}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded shadow transition-colors"
                >
                    Ver Historial
                </button>
                
                <HelpButtonEvaluarAtributos 
                    context="general" 
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-full shadow transition-colors" 
                />
            </div>
        </div>
    );
};

export default Evaluar;