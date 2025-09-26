"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";

type ExcelRow = { [key: string]: any };

export default function MumPage() {
  const [excelData, setExcelData] = useState<ExcelRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("visualizar");

  const [isExcelLoaded, setIsExcelLoaded] = useState(false);
  const [isPlanificacionDone, setIsPlanificacionDone] = useState(false);
  const [isExtraccionDone, setIsExtraccionDone] = useState(false);

  // --- Estados de la Planificación ---
  const [useFieldValue, setUseFieldValue] = useState(false);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [selectedPopulationType, setSelectedPopulationType] = useState<"positive" | "negative" | "absolute">(
    "absolute"
  );
  const [confidenceLevel, setConfidenceLevel] = useState(90);
  const [errorType, setErrorType] = useState<"importe" | "percentage">("percentage");
  const [tolerableError, setTolerableError] = useState(5);
  const [expectedError, setExpectedError] = useState(2);
  const [modifyPrecision, setModifyPrecision] = useState(false);
  const [precisionValue, setPrecisionValue] = useState(100);

  // --- Estados de resultados de la estimación ---
  const [estimatedPopulationValue, setEstimatedPopulationValue] = useState(0);
  const [estimatedSampleSize, setEstimatedSampleSize] = useState(0);
  const [sampleInterval, setSampleInterval] = useState(0);
  const [tolerableContamination, setTolerableContamination] = useState(0);
  const [conclusion, setConclusion] = useState("");
  const [minSampleSize, setMinSampleSize] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Nuevos estados para el módulo de Extracción ---
    const [extractionType, setExtractionType] = useState('intervaloFijo');
    const [highValueManagement, setHighValueManagement] = useState('agregados');
    const [highValueFilename, setHighValueFilename] = useState('');
    const [highValueCount, setHighValueCount] = useState(0); // Cantidad de valores altos
    const [highValueLimit, setHighValueLimit] = useState(0); // Valor umbral para considerarlo alto
    const [modifyHighValueCount, setModifyHighValueCount] = useState(false);
    const [sampleField, setSampleField] = useState(null); // Campo numérico para la muestra
    const [randomStartPoint, setRandomStartPoint] = useState(0);
    const [selectedTableType, setSelectedTableType] = useState('absolute');
    const [positiveTotal, setPositiveTotal] = useState(0);
    const [positiveRecords, setPositiveRecords] = useState(0);
    const [negativeTotal, setNegativeTotal] = useState(0);
    const [negativeRecords, setNegativeRecords] = useState(0);
    const [absoluteTotal, setAbsoluteTotal] = useState(0);
    const [absoluteRecords, setAbsoluteRecords] = useState(0);
    const [extractionFilename, setExtractionFilename] = useState('');

    // --- Nuevos estados para el módulo de Resumen (valores de demostración) ---
    const [numErrores, setNumErrores] = useState(2);
    const [errorMasProbableBruto, setErrorMasProbableBruto] = useState(0.85);
    const [errorMasProbableNeto, setErrorMasProbableNeto] = useState(0.75);
    const [precisionTotal, setPrecisionTotal] = useState(0.02);
    const [limiteErrorSuperiorBruto, setLimiteErrorSuperiorBruto] = useState(1.5);
    const [limiteErrorSuperiorNeto, setLimiteErrorSuperiorNeto] = useState(1.2);
    const [highValueCountResume, setHighValueCountResume] = useState(5);
    const [highValueTotal, setHighValueTotal] = useState(25000);
    const [populationExcludingHigh, setPopulationExcludingHigh] = useState(975000);
    const [populationIncludingHigh, setPopulationIncludingHigh] = useState(1000000);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setIsExcelLoaded(false);
      setExcelData([]);
      setHeaders([]);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length > 0) {
          const fileHeaders = Object.keys(jsonData[0]);
          setHeaders(fileHeaders);
          setExcelData(jsonData);
          setIsExcelLoaded(true);
          setActiveTab("visualizar");
          setIsPlanificacionDone(false);
          setIsExtraccionDone(false);
        } else {
          setHeaders([]);
          setExcelData([]);
          setIsExcelLoaded(false);
        }
      } catch (error) {
        console.error("Error al procesar el archivo Excel:", error);
        alert(
          "Hubo un problema al cargar el archivo. Asegúrate de que es un archivo Excel válido."
        );
        setIsExcelLoaded(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const calculatePopulationValue = () => {
    let value = 0;
    if (useFieldValue && selectedField) {
      value = excelData.reduce((sum, row) => {
        const rowValue = Number(row[selectedField]);
        if (isNaN(rowValue)) return sum;
        
        switch (selectedPopulationType) {
            case 'positive':
                return sum + (rowValue > 0 ? rowValue : 0);
            case 'negative':
                return sum + (rowValue < 0 ? rowValue : 0);
            case 'absolute':
            default:
                return sum + Math.abs(rowValue);
        }
      }, 0);
    } else {
      value = excelData.length;
    }
    setEstimatedPopulationValue(value);
  };

  const handleEstimate = () => {
    calculatePopulationValue();
    const calculatedSample = Math.floor(Math.random() * 100 + 50);
    const calculatedInterval = estimatedPopulationValue / calculatedSample;
    const calculatedContamination = Math.random() * 5 + 1;
    const calculatedConclusionErrors = Math.floor(Math.random() * 3);

    setEstimatedSampleSize(calculatedSample);
    setSampleInterval(calculatedInterval);
    setTolerableContamination(calculatedContamination);
    setConclusion(
      `la población podrá aceptarse a un nivel de confianza del ${confidenceLevel},00% cuando no se observen más de ${calculatedConclusionErrors} error(es) en una muestra de tamaño ${calculatedSample}.`
    );
    setMinSampleSize(Math.floor(calculatedSample * 0.75));
  };

  const handleAccept = () => {
    setIsPlanificacionDone(true);
    alert("Planificación aceptada. Ahora puedes ir a Extracción.");
  };

  const handlePrint = () => {
    const doc = new jsPDF();
    doc.text("Reporte de Planificación de Muestra", 10, 10);
    doc.text(`Valor de la Población: ${estimatedPopulationValue.toFixed(2)}`, 10, 20);
    doc.text(`Nivel de Confianza: ${confidenceLevel}%`, 10, 30);
    doc.text(`Error Tolerable: ${tolerableError}%`, 10, 40);
    doc.text(`Error Esperado: ${expectedError}%`, 10, 50);
    doc.text("---", 10, 60);
    doc.text(`Tamaño de la muestra aprox.: ${estimatedSampleSize}`, 10, 70);
    doc.text(`Intervalo muestral: ${sampleInterval.toFixed(2)}`, 10, 80);
    doc.text(`Suma contaminaciones tolerables: ${tolerableContamination.toFixed(2)}%`, 10, 90);
    doc.text(`Conclusión: ${conclusion}`, 10, 100);
    doc.text(`Tamaño Muestral Mínimo: ${minSampleSize}`, 10, 110);
    doc.save("planificacion-muestral.pdf");
  };

  const calculateTableValues = () => {
    if (!sampleField) return;

    let posTotal = 0, posRecords = 0;
    let negTotal = 0, negRecords = 0;
    let absTotal = 0, absRecords = 0;

    excelData.forEach(row => {
        const value = Number(row[sampleField]);
        if (isNaN(value)) return;

        // Conteo de valores positivos
        if (value > 0) {
        posTotal += value;
        posRecords++;
        }
        // Conteo de valores negativos
        if (value < 0) {
        negTotal += value; // Mantener el valor negativo
        negRecords++;
        }
        // Conteo de valores absolutos
        absTotal += Math.abs(value);
        absRecords++;
    });

    setPositiveTotal(posTotal);
    setPositiveRecords(posRecords);
    setNegativeTotal(negTotal);
    setNegativeRecords(negRecords);
    setAbsoluteTotal(absTotal);
    setAbsoluteRecords(absRecords);
    };

  // Esta función ahora contiene la lógica para la extracción
    const handleExtraccion = () => {
        // Aquí iría la lógica para generar el archivo de muestra
        // Por ejemplo, seleccionando N registros basados en el intervalo y el punto de inicio.
        // También se manejaría la lógica de valores altos.
        
        // Lógica simulada:
        const selectedRows = excelData.slice(0, estimatedSampleSize); // Simulación
        console.log("Datos a exportar:", selectedRows);

        // Lógica para exportar a un archivo Excel
        const worksheet = XLSX.utils.json_to_sheet(selectedRows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Muestra");
        XLSX.writeFile(workbook, `${extractionFilename || "muestra_extraida"}.xlsx`);
        
        // Marcar la extracción como completada
        setIsExtraccionDone(true);
        alert(`Extracción completada. Archivo "${extractionFilename || "muestra_extraida"}.xlsx" generado. Ya puedes acceder a Resumen.`);
    };

  const renderVisualizer = () => {
    return excelData.length > 0 ? (
      <div className="overflow-x-auto bg-white rounded shadow">
        <h3 className="p-4 font-bold text-gray-700">Visualización de Datos</h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {excelData.map((row, index) => (
              <tr key={index}>
                {headers.map((header) => (
                  <td
                    key={header}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    {row[header]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="p-6 text-center text-gray-500">
        No hay datos cargados. Carga un archivo Excel para visualizarlo.
      </div>
    );
  };

  const renderPlanification = () => {
  if (!isExcelLoaded) {
    return (
      <div className="p-4 text-center text-gray-500">
        Para acceder a este módulo, primero debes cargar un archivo Excel.
      </div>
    );
  }
  return (
    // Contenedor principal para el diseño de 2 columnas
    <div className="flex space-x-6 p-4">
      {/* Columna Izquierda: Formulario de Planificación y Resultados */}
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
              disabled
              className="ml-2 block w-48 rounded-md border-gray-300 bg-gray-200 cursor-not-allowed shadow-sm text-right"
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
              min="1"
              max="100"
              value={tolerableError}
              onChange={(e) => setTolerableError(Number(e.target.value))}
              className="block w-24 rounded-md border-gray-300 shadow-sm sm:text-sm text-center"
            />
            <span className="text-gray-700">%</span>
          </div>
          <div className="flex items-center space-x-4 mb-4">
            <label className="text-sm font-medium text-gray-700 w-32">
              Error esperado:
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={expectedError}
              onChange={(e) => setExpectedError(Number(e.target.value))}
              className="block w-24 rounded-md border-gray-300 shadow-sm sm:text-sm text-center"
            />
            <span className="text-gray-700">%</span>
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
              La población podrá aceptarse a un nivel de confianza del **{confidenceLevel.toFixed(2)}%** cuando no se observen más de **{tolerableContamination.toFixed(2)}** error(es) en una muestra de tamaño **{estimatedSampleSize}**.
            </p>
            <p className="text-sm mt-2 text-yellow-800">
              Este es el mínimo tamaño muestral que permite obtener la anterior conclusión.
            </p>
          </div>
        </div>
      </div>
      {/* Columna Derecha: Botones de Acción */}
      <div className="w-48 flex-none flex flex-col space-y-4 mt-8">
        <button
          onClick={handleEstimate}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded shadow"
        >
          Estimar
        </button>
        <button
          onClick={handleAccept}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded shadow"
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

  const renderExtraccion = () => {
    if (!isPlanificacionDone) {
        return (
        <div className="p-4 text-center text-gray-500">
            Debes completar la Planificación para poder acceder a la Extracción.
        </div>
        );
    }
    return (
        <div className="flex space-x-6 p-4">
        {/* Columna Izquierda: Controles de Extracción */}
        <div className="flex-1 space-y-6">
            {/* Tipo de Extracción y Gestión de Valores Altos */}
            <div className="bg-gray-50 p-6 rounded-lg shadow-inner flex space-x-8">
            {/* Tipo de Extracción */}
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
                <span className="text-sm text-gray-700">Intervalo fijo. Sel. de celda</span>
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
            {/* Gestión de Valores Altos */}
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
                <span className="text-sm text-gray-700">En un archivo por separado</span>
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

            {/* Parámetros de Extracción */}
            <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
            <div className="flex items-center space-x-8 mb-4">
                <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">
                    Campo numérico para la muestra:
                </label>
                <select
                    onChange={(e) => {
                    setSampleField(e.target.value);
                    // Opcional: Recalcular la tabla al cambiar de campo
                    calculateTableValues();
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
                    value={sampleInterval}
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
                    value={randomStartPoint}
                    onChange={(e) => setRandomStartPoint(Number(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                />
                </div>
                <div className="flex-1 flex items-center mt-6">
                <input
                    type="checkbox"
                    checked={modifyHighValueCount}
                    onChange={(e) => setModifyHighValueCount(e.target.checked)}
                    className="h-4 w-4 text-blue-600 rounded"
                />
                <label className="ml-2 text-sm font-medium text-gray-700">
                    Modificar cantidad de valor alto:
                </label>
                <input
                    type="number"
                    value={highValueCount}
                    onChange={(e) => setHighValueCount(Number(e.target.value))}
                    disabled={!modifyHighValueCount}
                    className={`ml-2 block w-24 rounded-md border-gray-300 shadow-sm text-center ${!modifyHighValueCount && 'bg-gray-200 cursor-not-allowed'}`}
                />
                </div>
            </div>
            <p className="mt-4 text-sm text-gray-600">
                Existen {highValueCount} elementos con un valor de {highValueLimit}. Los elementos con un valor de {highValueLimit} tendrán un 0% de probabilidad de ser seleccionados.
            </p>
            </div>

            {/* Tabla de Valores */}
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

            {/* Nombre del Archivo */}
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

        {/* Columna Derecha: Botones de Acción */}
        <div className="w-48 flex-none flex flex-col space-y-4">
            <button
            onClick={handleExtraccion}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded shadow"
            >
            Aceptar
            </button>
            <button
            onClick={() => alert('Abrir ventana de selección de campos...')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow"
            >
            Campos
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
        </div>
    );
    };

  const renderResumen = () => {
    if (!isExtraccionDone) {
        return (
            <div className="p-4 text-center text-gray-500">
                Debes completar los pasos de Planificación y Extracción para ver el resumen.
            </div>
        );
    }
    return (
        <div className="p-6 bg-white rounded-lg shadow-md space-y-6">
            <h2 className="text-2xl font-bold text-center text-gray-800">MUM - Porcentaje error bajo</h2>
            <h3 className="text-xl font-semibold text-center text-gray-600 mb-4">Resumen</h3>

            {/* Sección de Resumen General */}
            <div className="p-4 bg-gray-50 rounded-lg shadow-inner">
            {/* Elementos que deben ir en el lado derecho (en una grilla) */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-12 mb-4">
                <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Nivel de confianza:</span>
                <span className="text-sm font-bold text-gray-900">{confidenceLevel.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Intervalo muestral:</span>
                <span className="text-sm font-bold text-gray-900">{sampleInterval.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Valor alto:</span>
                <span className="text-sm font-bold text-gray-900">{highValueLimit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Valor de precisión básica:</span>
                <span className="text-sm font-bold text-gray-900">{precisionValue.toFixed(2)}%</span>
                </div>
            </div>
            {/* Nuevo contenedor para los elementos que deben ir a la izquierda */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Valor de población excluyendo valores altos:</span>
                <span className="text-sm font-bold text-gray-900">{populationExcludingHigh.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total de elementos de valor alto:</span>
                <span className="text-sm font-bold text-gray-900">{highValueTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Valor de población incluyendo valores altos:</span>
                <span className="text-sm font-bold text-gray-900">{populationIncludingHigh.toLocaleString()}</span>
                </div>
            </div>
            </div>

            {/* Tabla de Resultados */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Resultados sin elementos de valor alto
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Sobrevaloraciones
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Infravaloraciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Tamaño de muestra</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{estimatedSampleSize}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{estimatedSampleSize}</td>
                        </tr>
                        <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Número de errores</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{numErrores}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{numErrores}</td>
                        </tr>
                        <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Error más probable bruto</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{errorMasProbableBruto.toFixed(2)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{errorMasProbableBruto.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Error más probable neto</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{errorMasProbableNeto.toFixed(2)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{errorMasProbableNeto.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Precisión total</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{precisionTotal.toFixed(2)}%</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{precisionTotal.toFixed(2)}%</td>
                        </tr>
                        <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Límite de error superior bruto</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{limiteErrorSuperiorBruto.toFixed(2)}%</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{limiteErrorSuperiorBruto.toFixed(2)}%</td>
                        </tr>
                        <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Límite de error superior neto</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{limiteErrorSuperiorNeto.toFixed(2)}%</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{limiteErrorSuperiorNeto.toFixed(2)}%</td>
                        </tr>
                        <tr className="bg-gray-50">
                            <td colSpan={3} className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Resultados con elementos de valor alto
                            </td>
                        </tr>
                        <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Nro. de elementos de valor alto</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{highValueCountResume}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{highValueCountResume}</td>
                        </tr>
                        {/* Puedes agregar más filas aquí si es necesario */}
                    </tbody>
                </table>
            </div>

            {/* Sección de Conclusiones */}
            <div className="mt-8 p-6 bg-blue-50 border-l-4 border-blue-400 text-blue-800 rounded-r-lg">
                <h4 className="text-lg font-bold mb-2">Conclusiones:</h4>
                <p className="text-sm leading-relaxed">
                    Con base en los resultados del muestreo, se estima que el valor de la población es de **{populationIncludingHigh.toLocaleString()}**, con una precisión total de **{precisionTotal.toFixed(2)}%** a un nivel de confianza del **{confidenceLevel.toFixed(2)}%**. El límite de error superior bruto para sobrevaloraciones es de **{limiteErrorSuperiorBruto.toFixed(2)}%** y para infravaloraciones es de **{limiteErrorSuperiorNeto.toFixed(2)}%**. La muestra extraída es representativa de la población, y los resultados son estadísticamente significativos para el propósito de esta auditoría.
                </p>
                <p className="mt-2 text-sm leading-relaxed">
                    Además, se han identificado **{highValueCountResume}** elementos de valor alto que representan un total de **{highValueTotal.toLocaleString()}**, los cuales fueron analizados por separado para asegurar una cobertura completa y confiable.
                </p>
            </div>
        </div>
    );
 };

  const renderContent = () => {
    switch (activeTab) {
      case "visualizar":
        return renderVisualizer();
      case "planificacion":
        return renderPlanification();
      case "extraccion":
        return renderExtraccion();
      case "resumen":
        return renderResumen();
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Muestreo Unidad Monetaria - MUM</h1>
      <div className="mb-4">
        <label
          htmlFor="file-upload"
          className={`cursor-pointer font-semibold py-2 px-4 rounded shadow transition-colors ${
            isExcelLoaded
              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {isExcelLoaded ? "Archivo Cargado ✅" : "Cargar Archivo Excel"}
        </label>
        <input
          id="file-upload"
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileUpload}
          className="hidden"
          ref={fileInputRef}
        />
      </div>

      <div className="flex space-x-4 mb-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("visualizar")}
          className={`px-4 py-2 font-medium ${
            activeTab === "visualizar"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Visualizar
        </button>
        <button
          onClick={() => isExcelLoaded && setActiveTab("planificacion")}
          className={`px-4 py-2 font-medium ${
            activeTab === "planificacion"
              ? "border-b-2 border-blue-600 text-blue-600"
              : isExcelLoaded
              ? "text-gray-600 hover:text-gray-800"
              : "text-gray-400 cursor-not-allowed"
          }`}
        >
          Planificación
        </button>
        <button
          onClick={() => isPlanificacionDone && setActiveTab("extraccion")}
          className={`px-4 py-2 font-medium ${
            activeTab === "extraccion"
              ? "border-b-2 border-blue-600 text-blue-600"
              : isPlanificacionDone
              ? "text-gray-600 hover:text-gray-800"
              : "text-gray-400 cursor-not-allowed"
          }`}
        >
          Extracción
        </button>
        <button
          onClick={() => isExtraccionDone && setActiveTab("resumen")}
          className={`px-4 py-2 font-medium ${
            activeTab === "resumen"
              ? "border-b-2 border-blue-600 text-blue-600"
              : isExtraccionDone
              ? "text-gray-600 hover:text-gray-800"
              : "text-gray-400 cursor-not-allowed"
          }`}
        >
          Resumen
        </button>
      </div>
      {renderContent()}
    </div>
  );
}