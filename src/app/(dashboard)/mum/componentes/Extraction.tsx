// En Extraction.tsx - agrega la importación de useState
import React, { useEffect, useState } from 'react'; // Agregar useState aquí
import { saveAs } from 'file-saver';
import { useLog } from '@/contexts/LogContext';
import { HistoryPanel } from '@/components/mum/HistoryPanel';

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
        if (selectedField && isPlanificacionDone && !sampleField) {
            setSampleField(selectedField);
            addLog(
                'Campo heredado de planificación aplicado',
                `Campo seleccionado automáticamente: ${selectedField}`,
                'extraction'
            );
        }
    }, [selectedField, isPlanificacionDone, sampleField]);

    // Efecto para cálculos cuando cambia sampleField
    useEffect(() => {
        if (sampleField && excelData.length > 0) {
            const newRandomStartPoint = Math.floor(Math.random() * sampleInterval) + 1;
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
                'Cálculos de extracción actualizados',
                `Campo: ${sampleField}\nPunto inicio aleatorio: ${newRandomStartPoint}\nValores altos: ${highValueRecords.length}`,
                'extraction'
            );
        }
    }, [sampleField, excelData, sampleInterval, modifyHighValueLimit]);

    // Efecto adicional para cuando cambian los datos o el intervalo
    useEffect(() => {
        if (sampleField && excelData.length > 0) {
            calculateTableValues();
        }
    }, [sampleField, excelData]);

    const handleExtraccion = async () => {
        if (!sampleField) {
            addLog(
                'Error en extracción - campo no seleccionado',
                'El campo numérico para la muestra no ha sido seleccionado',
                'extraction'
            );
            alert("Por favor, selecciona un campo numérico para la muestra.");
            return;
        }

        addLog(
            'Usuario inició extracción MUM',
            `Campo: ${sampleField}\nIntervalo: ${sampleInterval}\nPunto inicio: ${randomStartPoint}`,
            'extraction'
        );

        await handleExtraction();
    };

    // ✅ CORRECCIÓN: Mejorar el texto informativo sobre valores altos
    const getHighValueText = () => {
        if (!sampleField || !excelData.length) return null;
        
        const highValueRecords = excelData.filter(row => {
            const value = parseFloat(row[sampleField]);
            return !isNaN(value) && Math.abs(value) >= sampleInterval;
        });

        return (
            <p className="mt-4 text-sm text-gray-600">
                Existen <strong>{highValueRecords.length}</strong> elementos con un valor igual o superior a {sampleInterval.toLocaleString()}. 
                {highValueRecords.length > 0 && (
                    <span className="block mt-1 text-gray-600">
                        Los elementos con valor ≥ {sampleInterval.toLocaleString()} tendrán 100% de probabilidad de ser seleccionados.
                    </span>
                )}
            </p>
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
            <div className="flex space-x-6 p-4">
                {/* Left Column: Extraction Controls */}
                <div className="flex-1 space-y-6">
                    {/* Extraction Type and High Value Management */}
                    <div className="bg-gray-50 p-6 rounded-lg shadow-inner flex space-x-8">
                        <div className="flex-1">
                            <h3 className="text-lg font-bold mb-2 text-gray-800">Tipo de extracción</h3>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    value="intervaloFijo"
                                    checked={extractionType === 'intervaloFijo'}
                                    onChange={() => setExtractionType('intervaloFijo')}
                                    className="h-4 w-4 text-blue-600"
                                />
                                <span className="text-sm text-gray-700">Intervalo fijo</span>
                            </label>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    value="seleccionCelda"
                                    checked={extractionType === 'seleccionCelda'}
                                    onChange={() => setExtractionType('seleccionCelda')}
                                    className="h-4 w-4 text-blue-600"
                                />
                                <span className="text-sm text-gray-700">Selección de celda</span>
                            </label>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold mb-2 text-gray-800">Gestión de valores altos</h3>
                            <label className="flex items-center space-x-2 mb-2">
                                <input
                                    type="radio"
                                    value="agregados"
                                    checked={highValueManagement === 'agregados'}
                                    onChange={() => setHighValueManagement('agregados')}
                                    className="h-4 w-4 text-blue-600"
                                />
                                <span className="text-sm text-gray-700">Valores altos como agregados a la muestra</span>
                            </label>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    value="separado"
                                    checked={highValueManagement === 'separado'}
                                    onChange={() => setHighValueManagement('separado')}
                                    className="h-4 w-4 text-blue-600"
                                />
                                <span className="ml-2 text-sm text-gray-700">En un archivo por separado</span>
                            </label>
                            {highValueManagement === 'separado' && (
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Nombre del archivo de valor alto:
                                    </label>
                                    <input
                                        type="text"
                                        value={highValueFilename}
                                        onChange={(e) => setHighValueFilename(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                                        placeholder="ej. valores_altos.xlsx"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Extraction Parameters */}
                    <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
                        <div className="flex items-center space-x-8 mb-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700">
                                    Campo numérico para la muestra:
                                </label>
                                <select
                                    value={sampleField || selectedField || ""}
                                    onChange={(e) => {
                                        setSampleField(e.target.value);
                                        addLog(
                                            'Campo de muestra cambiado',
                                            `Nuevo campo seleccionado: ${e.target.value}`,
                                            'extraction'
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
                                <label className="block text-sm font-medium text-gray-700">
                                    Intervalo muestral:
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={sampleInterval.toFixed(2)}
                                    disabled
                                    className="mt-1 block w-full rounded-md border-gray-300 bg-gray-200 cursor-not-allowed shadow-sm sm:text-sm"
                                />
                            </div>
                        </div>
                        <div className="flex items-center space-x-8">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700">
                                    Punto de inicio aleatorio:
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={randomStartPoint.toFixed(2)}
                                    onChange={(e) => setRandomStartPoint(Number(e.target.value))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                                />
                            </div>
                            <div className="flex-1 flex items-center mt-6">
                                <input
                                    type="checkbox"
                                    checked={modifyHighValueLimit}
                                    onChange={(e) => setModifyHighValueLimit(e.target.checked)}
                                    className="h-4 w-4 text-blue-600 rounded"
                                />
                                <label className="ml-2 text-sm font-medium text-gray-700">
                                    Monto de valor alto:
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={highValueLimit}
                                    onChange={(e) => setHighValueLimit(Number(e.target.value))}
                                    disabled={!modifyHighValueLimit}
                                    className={`ml-2 block w-24 rounded-md border-gray-300 shadow-sm text-center ${!modifyHighValueLimit && 'bg-gray-200 cursor-not-allowed'}`}
                                />
                            </div>
                        </div>
                        {getHighValueText()}
                    </div>

                    {/* Value Table */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
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
                                            onChange={() => setSelectedTableType('positive')}
                                            className="h-4 w-4 text-blue-600"
                                        />
                                        <span className="ml-2 text-sm text-gray-900">Valores positivos</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {positiveTotal.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {positiveRecords}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="radio"
                                            value="negative"
                                            checked={selectedTableType === 'negative'}
                                            onChange={() => setSelectedTableType('negative')}
                                            disabled={true}
                                            className="h-4 w-4 text-gray-400 cursor-not-allowed"
                                        />
                                        <span className="ml-2 text-sm text-gray-400">Valores negativos</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {`(${Math.abs(negativeTotal).toLocaleString()})`}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {negativeRecords}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="radio"
                                            value="absolute"
                                            checked={selectedTableType === 'absolute'}
                                            onChange={() => setSelectedTableType('absolute')}
                                            disabled={true}
                                            className="h-4 w-4 text-gray-400 cursor-not-allowed"
                                        />
                                        <span className="ml-2 text-sm text-gray-400">Valores absolutos</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {absoluteTotal.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {absoluteRecords}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* File Name */}
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Nombre de archivo:
                        </label>
                        <input
                            type="text"
                            value={extractionFilename}
                            onChange={(e) => setExtractionFilename(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                            placeholder="ej. muestra_auditoria.xlsx"
                        />
                    </div>
                </div>

                {/* Right Column: Action Buttons */}
                <div className="w-48 flex-none flex flex-col space-y-4">
                    <button
                        onClick={handleExtraccion}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded shadow"
                    >
                        Aceptar
                    </button>
                    
                    {/* NUEVO BOTÓN DE HISTORIAL */}
                    <button
                        onClick={() => {
                            setShowHistory(true);
                            addLog(
                                'Usuario visualizó historial',
                                'Historial de auditoría abierto desde módulo de extracción',
                                'extraction'
                            );
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded shadow"
                    >
                        Ver Historial
                    </button>

                    <button
                        onClick={() => setActiveTab('planificacion')}
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded shadow"
                    >
                        Cancelar
                    </button>
                    
                    <button
                        onClick={() => alert("Función de Ayuda: En este módulo, se definen los parámetros para la extracción de la muestra estadística, incluyendo la gestión de valores altos.")}
                        className="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-full shadow"
                    >
                        ? Ayuda
                    </button>
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