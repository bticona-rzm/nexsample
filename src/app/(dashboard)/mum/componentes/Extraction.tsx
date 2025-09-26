import React, { useEffect, Dispatch, SetStateAction } from 'react';
import { saveAs } from 'file-saver'; // Se mantiene para manejar la descarga en el cliente.

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
    setExtractionType: Dispatch<SetStateAction<"intervaloFijo" | "seleccionCelda">>;
    highValueManagement: "agregados" | "separado";
    setHighValueManagement: Dispatch<SetStateAction<"agregados" | "separado">>;
    highValueFilename: string;
    setHighValueFilename: Dispatch<SetStateAction<string>>;
    sampleInterval: number;
    sampleField: string | null;
    setSampleField: Dispatch<SetStateAction<string | null>>;
    randomStartPoint: number;
    setRandomStartPoint: Dispatch<SetStateAction<number>>;
    modifyHighValueLimit: boolean;
    setModifyHighValueLimit: Dispatch<SetStateAction<boolean>>;
    highValueCount: number;
    setHighValueCount: Dispatch<SetStateAction<number>>;
    highValueLimit: number;
    setHighValueLimit: Dispatch<SetStateAction<number>>;
    selectedTableType: "positive" | "negative" | "absolute";
    setSelectedTableType: Dispatch<SetStateAction<"positive" | "negative" | "absolute">>;
    positiveTotal: number;
    setPositiveTotal: Dispatch<SetStateAction<number>>;
    positiveRecords: number;
    setPositiveRecords: Dispatch<SetStateAction<number>>;
    negativeTotal: number;
    setNegativeTotal: Dispatch<SetStateAction<number>>;
    negativeRecords: number;
    setNegativeRecords: Dispatch<SetStateAction<number>>;
    absoluteTotal: number;
    setAbsoluteTotal: Dispatch<SetStateAction<number>>;
    absoluteRecords: number;
    setAbsoluteRecords: Dispatch<SetStateAction<number>>;
    estimatedSampleSize: number;
    extractionFilename: string;
    setExtractionFilename: Dispatch<SetStateAction<string>>;
    setIsExtraccionDone: Dispatch<SetStateAction<boolean>>;
    setActiveTab: Dispatch<SetStateAction<string>>;
    selectedFieldFromPlanificacion: string | null;
    excelFilename: string;
    estimatedPopulationValue: number;
    populationRecords: number;
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
    selectedFieldFromPlanificacion,
    excelFilename,
    estimatedPopulationValue,
    populationRecords,
}) => {

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

    useEffect(() => {
        if (sampleField && excelData.length > 0) {
            const newRandomStartPoint = Math.floor(Math.random() * sampleInterval) + 1;
            setRandomStartPoint(newRandomStartPoint);

            const newHighValueLimit = sampleInterval;
            if (!modifyHighValueLimit) {
                setHighValueLimit(newHighValueLimit);
            }

            const highValueRecords = excelData.filter(row => {
                const value = parseFloat(row[sampleField]);
                return !isNaN(value) && Math.abs(value) >= (modifyHighValueLimit ? highValueLimit : newHighValueLimit);
            });
            setHighValueCount(highValueRecords.length);
        }
    }, [sampleField, excelData, sampleInterval, modifyHighValueLimit, highValueLimit, setRandomStartPoint, setHighValueLimit, setHighValueCount]);

    useEffect(() => {
        calculateTableValues();
    }, [sampleField, excelData]);

    const handleExtraccion = async () => {
        if (!sampleField) {
            alert("Por favor, selecciona un campo numérico para la muestra.");
            return;
        }
        
        // 1. Enviar datos a la API (Lógica de Negocio se ejecuta en el servidor)
        try {
            const response = await fetch('/api/mum/extraction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    excelData, estimatedSampleSize, sampleInterval, highValueLimit, 
                    highValueManagement, sampleField, randomStartPoint, 
                    estimatedPopulationValue, extractionType, 
                    extractionFilename: extractionFilename || "muestra_extraida",
                    highValueFilename: highValueFilename || "valores_altos",
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Error HTTP: ${response.status}`);
            }

            const result = await response.json();
            
            // 2. Descargar el archivo principal de muestra
            const sampleBlob = new Blob([Buffer.from(result.sampleFileBase64, 'base64')], { type: 'application/octet-stream' });
            saveAs(sampleBlob, `${result.extractionFilename}.xlsx`);
            
            let successMessage = `Extracción completada. Archivo "${result.extractionFilename}.xlsx" generado.`;

            // 3. Descargar el archivo de valores altos (si aplica)
            if (result.highValueFileBase64) {
                const highValueBlob = new Blob([Buffer.from(result.highValueFileBase64, 'base64')], { type: 'application/octet-stream' });
                saveAs(highValueBlob, `${result.highValueFilename}.xlsx`);
                successMessage += ` Archivo de valores altos "${result.highValueFilename}.xlsx" generado.`;
            }

            setIsExtraccionDone(true);
            alert(successMessage);
            
        } catch (error) {
            console.error("Error al realizar la extracción:", error);
            alert(`Error en la extracción: ${error instanceof Error ? error.message : "Error desconocido."}`);
        }
    };

    const renderExtraccion = () => {
        if (!isPlanificacionDone) {
            // CORRECCIÓN: Este es el fragmento que causaba el error "Expression expected."
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
                                    onChange={(e) => {
                                        setSampleField(e.target.value);
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
                        <p className="mt-4 text-sm text-gray-600">
                            Existen **{highValueCount}** elementos con un valor igual o superior a {highValueLimit.toLocaleString()}.
                        </p>
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
                                            className="h-4 w-4 text-blue-600"
                                        />
                                        <span className="ml-2 text-sm text-gray-900">Valores negativos</span>
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
                                            className="h-4 w-4 text-blue-600"
                                        />
                                        <span className="ml-2 text-sm text-gray-900">Valores absolutos</span>
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
                    {/*
                    <button
                        onClick={() => alert('Abrir ventana de selección de campos...')}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow"
                    >
                        Campos
                    </button>
                    */}
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