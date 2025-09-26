import React from 'react';
import { ConfidenceFactor, CONFIDENCE_FACTORS } from '../../../../components/atributos/constants'; // Importa la constante

// Tipos requeridos para el componente
type ControlType = 'beta' | 'beta-alpha';

// Interfaz de Propiedades (tal como son pasadas desde useAtributosFlow)
interface PlanificationProps {
    // Estados del formulario (inputs)
    isExcelLoaded: boolean;
    controlType: ControlType;
    setControlType: (type: ControlType) => void;
    populationSize: number;
    setPopulationSize: (size: number) => void;
    expectedDeviation: number;
    setExpectedDeviation: (rate: number) => void;
    tolerableDeviation: number;
    setTolerableDeviation: (rate: number) => void;
    confidenceLevel: number; // Nivel de confianza Beta
    setConfidenceLevel: (level: number) => void;
    alphaConfidenceLevel: number; // Nivel de confianza Alfa
    setAlphaConfidenceLevel: (level: number) => void;

    // Estados de resultados (outputs)
    isPlanificacionDone: boolean;
    calculatedSampleSize: number;
    criticalDeviation: number;

    // Manejadores de eventos (botón)
    handleCalculatePlanification: () => void;
    handlePrint: () => void;
    handleClose: () => void;
    handleHelp: () => void;
}

const Planification: React.FC<PlanificationProps> = ({
    isExcelLoaded,
    controlType,
    setControlType,
    populationSize,
    setPopulationSize,
    expectedDeviation,
    setExpectedDeviation,
    tolerableDeviation,
    setTolerableDeviation,
    confidenceLevel,
    setConfidenceLevel,
    alphaConfidenceLevel,
    setAlphaConfidenceLevel,
    isPlanificacionDone,
    calculatedSampleSize,
    criticalDeviation,
    handleCalculatePlanification,
    handlePrint,
    handleClose,
    handleHelp,
}) => {
    // Muestra el mensaje de advertencia si no hay archivo cargado
    if (!isExcelLoaded) {
        return (
            <div className="p-8 text-center bg-white rounded-lg shadow-md mt-4">
                <p className="text-xl font-semibold text-gray-500">
                    <span role="img" aria-label="warning">⚠️</span> Para acceder a este módulo, primero debes cargar un archivo Excel.
                </p>
            </div>
        );
    }

    // El resto del código de renderizado es *exactamente* el mismo que proporcionaste, 
    // pero encapsulado en el componente funcional y usando las props.
    return (
        <div className="flex space-x-6 p-4">
            {/* Columna Izquierda: Formulario de Planificación y Resultados */}
            <div className="flex-1 space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-xl border border-gray-200">
                    <h3 className="text-xl font-bold mb-4">Planificación del Muestreo por Atributos</h3>

                    {/* Selector de tipo de control */}
                    <div className="mb-6 border p-4 rounded-lg">
                        <label className="text-xl font-bold mb-4">Tipo de Control de Riesgo:</label>
                        <div className="flex mt-1 space-x-8">
                            <label className="inline-flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    className="h-4 w-4 text-blue-600"
                                    name="controlType"
                                    value="beta"
                                    checked={controlType === 'beta'}
                                    onChange={() => setControlType('beta')}
                                />
                                <span className="ml-2 text-sm text-gray-700">Riesgo Beta (Muestreo)</span>
                            </label>
                            <label className="inline-flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    className="h-4 w-4 text-blue-600"
                                    name="controlType"
                                    value="beta-alpha"
                                    checked={controlType === 'beta-alpha'}
                                    onChange={() => setControlType('beta-alpha')}
                                />
                                <span className="ml-2 text-sm text-gray-700">Riesgo Beta y Alfa (Control Interno)</span>
                            </label>
                        </div>
                    </div>
                    {/* Fin del selector */}

                    <div className="grid grid-cols-2 gap-6">
                        <div className="flex flex-col space-y-2">
                            <label className="text-sm font-medium text-gray-700">Tamaño de la población:</label>
                            <input
                                type="number"
                                value={populationSize}
                                onChange={(e) => setPopulationSize(Number(e.target.value))}
                                className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 focus:border-purple-500 focus:ring-purple-500"
                            />
                        </div>
                        <div className="flex flex-col space-y-2">
                            <label className="text-sm font-medium text-gray-700">Tasa de desviación esperada (%):</label>
                            <input
                                type="number"
                                value={expectedDeviation}
                                onChange={(e) => setExpectedDeviation(Number(e.target.value))}
                                className={`block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 focus:border-purple-500 focus:ring-purple-500'}`}
                            />
                        </div>
                        <div className="flex flex-col space-y-2">
                            <label className="text-sm font-medium text-gray-700">Tasa de desviación tolerable (%):</label>
                            <input
                                type="number"
                                value={tolerableDeviation}
                                onChange={(e) => setTolerableDeviation(Number(e.target.value))}
                                className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 focus:border-purple-500 focus:ring-purple-500"
                            />
                        </div>
                        <div className="flex flex-col space-y-2">
                            <label className="text-sm font-medium text-gray-700">Nivel de confianza Beta (%):</label>
                            <input
                                type="number"
                                value={confidenceLevel}
                                onChange={(e) => setConfidenceLevel(Number(e.target.value))}
                                className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 focus:border-purple-500 focus:ring-purple-500"
                                min="0" 
                                max="100"
                            />
                        </div>
                        {controlType === 'beta-alpha' && (
                            <div className="flex flex-col space-y-2 col-span-1">
                                <label className="text-sm font-medium text-gray-700">Nivel de confianza Alfa (%):</label>
                                <input
                                    type="number"
                                    value={alphaConfidenceLevel}
                                    onChange={(e) => setAlphaConfidenceLevel(Number(e.target.value))}
                                    className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 focus:border-purple-500 focus:ring-purple-500"
                                />
                            </div>
                        )}
                    </div>

                    {/* Sección de Resultados */}
                    {isPlanificacionDone && (
                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <h4 className="text-xl font-bold mb-4 text-gray-800">Resultados del Cálculo:</h4>
                            <div className="grid grid-cols-2 gap-4 mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <div className="flex flex-col">
                                    <label className="text-sm font-medium text-gray-700">Tamaño de la muestra:</label>
                                    <span className="mt-1 text-lg font-bold text-gray-900">{calculatedSampleSize}</span>
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-sm font-medium text-gray-700">Número crítico de desviaciones:</label>
                                    <span className="mt-1 text-lg font-bold text-gray-900">{criticalDeviation}</span>
                                </div>
                            </div>

                            {/* Tabla de Confianza */}
                            <div className="overflow-x-auto bg-gray-50 rounded-lg shadow-inner mt-4">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Desviaciones</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">% de desviaciones</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Confianza alcanzada (%)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {CONFIDENCE_FACTORS.map((row: ConfidenceFactor) => (
                                            <tr key={row.deviations} className={row.deviations === criticalDeviation ? "bg-blue-100 font-bold" : "hover:bg-gray-50"}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.deviations}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {calculatedSampleSize > 0 ? ((row.factor / calculatedSampleSize) * 100).toFixed(2) : '0.00'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.confidence}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Conclusión */}
                            <div className="mt-6 p-4 bg-yellow-100 rounded-lg border border-yellow-300">
                                <h4 className="font-bold text-yellow-900 text-lg mb-1">Conclusión:</h4>
                                <p className="text-sm text-yellow-900 mt-1">
                                    Si no se observan más de **{criticalDeviation}** desviaciones en una muestra de tamaño **{calculatedSampleSize}**, puede estar por lo menos seguro en un **{confidenceLevel}%** de que la tasa de desviación de la población no será mayor que el **{tolerableDeviation}%**.
                                </p>
                                {controlType === 'beta-alpha' && (
                                    <p className="text-sm text-yellow-900 mt-2 italic border-t border-yellow-300 pt-2">
                                        Adicionalmente, con una confianza del **{alphaConfidenceLevel}%**, la muestra no será erróneamente rechazada.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Columna Derecha: Botones de Acción */}
            <div className="w-48 flex-none flex flex-col space-y-4 mt-2">
                <button
                    onClick={handleCalculatePlanification}
                    disabled={!isExcelLoaded || tolerableDeviation <= 0 || confidenceLevel <= 0}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg shadow transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    Calcular
                </button>
                <button
                    onClick={handlePrint}
                    disabled={!isPlanificacionDone}
                    className={`font-semibold py-3 px-4 rounded-lg shadow transition-colors ${!isPlanificacionDone ? "bg-gray-400 text-gray-700 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
                >
                    Imprimir
                </button>
                <button
                    onClick={handleClose}
                    className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-lg shadow transition-colors"
                >
                    Cerrar
                </button>
                <button
                    onClick={handleHelp}
                    className="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-3 px-4 rounded-full shadow transition-colors"
                >
                    ? Ayuda
                </button>
            </div>
        </div>
    );
};

export default Planification;