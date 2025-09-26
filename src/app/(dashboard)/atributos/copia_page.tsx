"use client";

import { useState, useRef, useEffect} from "react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

type ExcelRow = { [key: string]: any };

const CONFIDENCE_FACTORS = [
  { deviations: 0, factor: 3.00, confidence: 95 },
  { deviations: 1, factor: 4.74, confidence: 95 },
  { deviations: 2, factor: 6.30, confidence: 95 },
  { deviations: 3, factor: 7.75, confidence: 95 },
  { deviations: 4, factor: 9.15, confidence: 95 },
  { deviations: 5, factor: 10.51, confidence: 95 },
  { deviations: 6, factor: 11.85, confidence: 95 },
  { deviations: 7, factor: 13.16, confidence: 95 },
  { deviations: 8, factor: 14.45, confidence: 95 },
];

const UNILATERAL_FACTORS = [
  { deviations: 0, factor: 3.00, confidence: 95 },
  { deviations: 1, factor: 4.74, confidence: 95 },
  { deviations: 2, factor: 6.30, confidence: 95 },
  { deviations: 3, factor: 7.75, confidence: 95 },
  { deviations: 4, factor: 9.15, confidence: 95 },
  { deviations: 5, factor: 10.51, confidence: 95 },
  { deviations: 6, factor: 11.85, confidence: 95 },
  { deviations: 7, factor: 13.16, confidence: 95 },
  { deviations: 8, factor: 14.45, confidence: 95 },
];

// Tabla de factores para límites bilaterales (IDEA también usa una tabla separada)
const BILATERAL_FACTORS = [
  { deviations: 0, lower: 0, upper: 3.00, confidence: 95 },
  { deviations: 1, lower: 0.1, upper: 4.74, confidence: 95 },
  { deviations: 2, lower: 0.8, upper: 6.30, confidence: 95 },
  { deviations: 3, lower: 1.6, upper: 7.75, confidence: 95 },
  { deviations: 4, lower: 2.4, upper: 9.15, confidence: 95 },
  { deviations: 5, lower: 3.2, upper: 10.51, confidence: 95 },
  { deviations: 6, lower: 4.1, upper: 11.85, confidence: 95 },
  { deviations: 7, lower: 4.9, upper: 13.16, confidence: 95 },
  { deviations: 8, lower: 5.8, upper: 14.45, confidence: 95 },
];

export default function AtributosPage(){
    const [excelData, setExcelData] = useState<ExcelRow[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState("visualizar");
    const [isExcelLoaded, setIsExcelLoaded] = useState(false);
    const [isPlanificacionDone, setIsPlanificacionDone] = useState(false);
    const [isAleatorioDone, setIsAleatorioDone] = useState(false);
    const [isEvaluarDone, setIsEvaluarDone] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Estados para la planificación
    const [populationSize, setPopulationSize] = useState<number>(0);
    const [tolerableDeviation, setTolerableDeviation] = useState<number>(5);
    const [expectedDeviation, setExpectedDeviation] = useState<number>(0);
    const [confidenceLevel, setConfidenceLevel] = useState<number>(95);
    const [calculatedSampleSize, setCalculatedSampleSize] = useState<number>(0);
    const [criticalDeviation, setCriticalDeviation] = useState<number>(0);
    const [controlType, setControlType] = useState('beta');
    const [alphaConfidenceLevel, setAlphaConfidenceLevel] = useState(0); 

    // Estados para la muestra aleatoria
    const [numRecordsToSelect, setNumRecordsToSelect] = useState<number>(0);
    const [startRandomNumber, setStartRandomNumber] = useState<number>(1);
    const [startRecordToSelect, setStartRecordToSelect] = useState<number>(1);
    const [endRecordToSelect, setEndRecordToSelect] = useState<number>(0);
    const [allowDuplicates, setAllowDuplicates] = useState<boolean>(false);
    const [outputFileName, setOutputFileName] = useState<string>("muestra_aleatoria");
    const [randomSample, setRandomSample] = useState<ExcelRow[]>([]);

    // Estados para la evaluación
    const [evaluatedSampleSize, setEvaluatedSampleSize] = useState<number>(0);
    const [observedDeviations, setObservedDeviations] = useState<number>(0);
    const [desiredConfidence, setDesiredConfidence] = useState<number>(95);
    const [sampleDeviationRate, setSampleDeviationRate] = useState<number>(0);
    const [unilateralUpperLimit, setUnilateralUpperLimit] = useState<number>(0);
    const [bilateralLowerLimit, setBilateralLowerLimit] = useState<number>(0);
    const [bilateralUpperLimit, setBilateralUpperLimit] = useState<number>(0);

    // Efecto para calcular el tamaño de la población al cargar el archivo
    useEffect(() => {
        if (isExcelLoaded) {
        setPopulationSize(excelData.length);
        setEndRecordToSelect(excelData.length);
        setNumRecordsToSelect(calculatedSampleSize);
        }
    }, [isExcelLoaded, excelData, calculatedSampleSize]);

    useEffect(() => {
        if (isAleatorioDone) {
        setEvaluatedSampleSize(randomSample.length);
        }
    }, [isAleatorioDone, randomSample]);

    const handleCreateRandomSample = () => {
        if (!isPlanificacionDone || calculatedSampleSize === 0) {
        alert("Primero debes completar el paso de Planificación.");
        return;
        }

        // Validación de rangos
        if (startRecordToSelect > endRecordToSelect || endRecordToSelect > excelData.length) {
        alert("El rango de registros a seleccionar no es válido.");
        return;
        }

        // Lógica para el muestreo aleatorio
        let selectedRecords: ExcelRow[] = [];
        const availableRecords = excelData.slice(startRecordToSelect - 1, endRecordToSelect);

        if (allowDuplicates) {
        for (let i = 0; i < numRecordsToSelect; i++) {
            const randomIndex = Math.floor(Math.random() * availableRecords.length);
            selectedRecords.push(availableRecords[randomIndex]);
        }
        } else {
        const shuffledRecords = [...availableRecords].sort(() => 0.5 - Math.random());
        selectedRecords = shuffledRecords.slice(0, numRecordsToSelect);
        }
        
        setRandomSample(selectedRecords);
        setIsAleatorioDone(true);
        alert(`Se han seleccionado ${selectedRecords.length} registros aleatorios.`);
    };

    // Lógica para el nuevo botón "Calcular" del módulo "Evaluar"
    const handleCalculateEvaluation = () => {
        if (!isAleatorioDone) {
        alert("Primero debes generar una muestra aleatoria.");
        return;
        }
        if (evaluatedSampleSize <= 0) {
        alert("El tamaño de la muestra no puede ser cero.");
        return;
        }

        // Tasa de desviación en muestra = (Número de desviaciones / Tamaño de la muestra) * 100
        const sampleRate = (observedDeviations / evaluatedSampleSize) * 100;
        setSampleDeviationRate(sampleRate);

        // Búsqueda de los factores de las tablas
        const unilateralFactor = UNILATERAL_FACTORS.find(
        (f) => f.deviations === observedDeviations && f.confidence === desiredConfidence
        )?.factor;
        
        const bilateralFactors = BILATERAL_FACTORS.find(
        (f) => f.deviations === observedDeviations && f.confidence === desiredConfidence
        );

        // Cálculos de los límites
        if (unilateralFactor) {
        setUnilateralUpperLimit((unilateralFactor / evaluatedSampleSize) * 100);
        } else {
        setUnilateralUpperLimit(0);
        }
        
        if (bilateralFactors) {
        setBilateralLowerLimit((bilateralFactors.lower / evaluatedSampleSize) * 100);
        setBilateralUpperLimit((bilateralFactors.upper / evaluatedSampleSize) * 100);
        } else {
        setBilateralLowerLimit(0);
        setBilateralUpperLimit(0);
        }
        
        setIsEvaluarDone(true);
    };

    const handleCalculatePlanification = () => {
        // Lógica de cálculo, adaptada según el controlType
        let sampleSize = 0;
        let criticalDevs = 0;

        if (controlType === 'beta') {
        // Tu lógica actual de cálculo para el riesgo Beta
        sampleSize = 59; // Ejemplo, reemplazar con la lógica real
        criticalDevs = 1;  // Ejemplo, reemplazar con la lógica real
        } else if (controlType === 'beta-alpha') {
        // Lógica de cálculo para el riesgo Beta y Alfa
        // Aquí necesitarías una función de cálculo diferente que tome en cuenta el riesgo Alfa
        // La lógica es más compleja y probablemente requiera tablas estadísticas o fórmulas más avanzadas.
        // Por ejemplo, para un mismo nivel de confianza, la muestra será mayor.
        sampleSize = 80; // Ejemplo, reemplazar con la lógica real
        criticalDevs = 2; // Ejemplo, reemplazar con la lógica real
        }
        
        setCalculatedSampleSize(sampleSize);
        setCriticalDeviation(criticalDevs);
        setIsPlanificacionDone(true);
    };
    
    // Lógica de los botones
    const handlePrint = () => {
        // Implementación para imprimir en PDF similar a la que ya teníamos
        if (!isPlanificacionDone) {
            alert("Debe calcular los valores antes de imprimir.");
            return;
        }
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Planificación del Muestreo por Atributos", 14, 22);

        doc.setFontSize(12);
        doc.text(`Tamaño de la población: ${populationSize}`, 14, 32);
        doc.text(`Tasa de desviación tolerable: ${tolerableDeviation}%`, 14, 39);
        doc.text(`Tasa de desviación esperada: ${expectedDeviation}%`, 14, 46);
        doc.text(`Nivel de confianza: ${confidenceLevel}%`, 14, 53);
        doc.text(`Tamaño de la muestra: ${calculatedSampleSize}`, 14, 60);
        doc.text(`Número crítico de desviaciones: ${criticalDeviation}`, 14, 67);

        // Tabla de desviaciones
        (doc as any).autoTable({
            head: [['Desviaciones', '% de desviaciones', 'Confianza alcanzada (%)']],
            body: CONFIDENCE_FACTORS.map(row => [
                row.deviations,
                ((row.factor / calculatedSampleSize) * 100).toFixed(2),
                row.confidence
            ]),
            startY: 75,
        });

        const conclusionText = `Si no se observan más de ${criticalDeviation} desviaciones en una muestra de tamaño ${calculatedSampleSize}, puede estar por lo menos seguro en un ${confidenceLevel}% de que la tasa de desviación de la población no será mayor que el ${tolerableDeviation}%.`;
        doc.text(conclusionText, 14, (doc as any).autoTable.previous.finalY + 10);
        
        doc.save("planificacion_atributos.pdf");
    };

    const handleClose = () => {
        setActiveTab("visualizar");
    };

    const handleHelp = () => {
        alert("Función de Ayuda: En esta sección, debes ingresar los parámetros para calcular el tamaño de la muestra. La tabla te mostrará el impacto de cada desviación en el resultado final.");
    };

    const handleFields = () => {
        alert("Función 'Campos': Aquí se podría mostrar una ventana para seleccionar los campos a exportar. Por defecto, se exportan todos.");
    };


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
            setPopulationSize(jsonData.length);
            setActiveTab("visualizar");
            setIsPlanificacionDone(false);
            setIsAleatorioDone(false);
            setCalculatedSampleSize(0);
            setCriticalDeviation(0);
            } else {
            setHeaders([]);
            setExcelData([]);
            setIsExcelLoaded(false);
            }
        } catch (error) {
            console.error("Error al procesar el archivo Excel:", error);
            alert("Hubo un problema al cargar el archivo. Asegúrate de que es un archivo Excel válido.");
            setIsExcelLoaded(false);
        }
        };
        reader.readAsArrayBuffer(file);
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
                {excelData.slice(0, 50).map((row, index) => (
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
            <p className="p-4 text-sm text-gray-500">Mostrando las primeras 50 filas de {excelData.length} registros.</p>
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
            <div className="flex space-x-6 p-4">
            {/* Columna Izquierda: Formulario de Planificación y Resultados */}
            <div className="flex-1 space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-4 text-gray-800">Planificación del Muestreo</h3>
                
                {/* Nuevo selector de tipo de control */}
                <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700">Tipo de Control de Riesgo:</label>
                    <div className="flex mt-1 space-x-4">
                    <label className="inline-flex items-center">
                        <input
                        type="radio"
                        className="form-radio text-purple-600"
                        name="controlType"
                        value="beta"
                        checked={controlType === 'beta'}
                        onChange={() => setControlType('beta')}
                        />
                        <span className="ml-2 text-gray-700">Riesgo Beta</span>
                    </label>
                    <label className="inline-flex items-center">
                        <input
                        type="radio"
                        className="form-radio text-purple-600"
                        name="controlType"
                        value="beta-alpha"
                        checked={controlType === 'beta-alpha'}
                        onChange={() => setControlType('beta-alpha')}
                        />
                        <span className="ml-2 text-gray-700">Riesgo Beta y Alfa</span>
                    </label>
                    </div>
                </div>
                {/* Fin del selector */}

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700">Tamaño de la población:</label>
                    <input type="number" value={populationSize} onChange={(e) => setPopulationSize(Number(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                    </div>
                    <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700">Tasa de desviación esperada (%):</label>
                    <input 
                        type="number" 
                        value={expectedDeviation} 
                        onChange={(e) => setExpectedDeviation(Number(e.target.value))} 
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                        disabled={controlType === 'beta'} // Campo deshabilitado para el control Beta
                    />
                    </div>
                    <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700">Tasa de desviación tolerable (%):</label>
                    <input type="number" value={tolerableDeviation} onChange={(e) => setTolerableDeviation(Number(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                    </div>
                    <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700">Nivel de confianza Beta (%):</label>
                    <input type="number" value={confidenceLevel} onChange={(e) => setConfidenceLevel(Number(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                    </div>
                    {controlType === 'beta-alpha' && (
                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700">Nivel de confianza Alfa (%):</label>
                        <input type="number" value={alphaConfidenceLevel} onChange={(e) => setAlphaConfidenceLevel(Number(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                    </div>
                    )}
                </div>
                
                {isPlanificacionDone && (
                    <div className="mt-6">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700">Tamaño de la muestra:</label>
                        <span className="mt-1 text-lg font-bold text-gray-900">{calculatedSampleSize}</span>
                        </div>
                        <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700">Número crítico de desviaciones:</label>
                        <span className="mt-1 text-lg font-bold text-gray-900">{criticalDeviation}</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto bg-gray-50 rounded-lg shadow-inner mt-4">
                        <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Desviaciones</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">% de desviaciones</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confianza alcanzada (%)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {CONFIDENCE_FACTORS.map((row) => (
                            <tr key={row.deviations} className={row.deviations === criticalDeviation ? "bg-blue-100 font-bold" : ""}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.deviations}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{(row.factor / calculatedSampleSize * 100).toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.confidence}</td>
                            </tr>
                            ))}
                        </tbody>
                        </table>
                    </div>
                    <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <h4 className="font-semibold text-yellow-800">Conclusión:</h4>
                        <p className="text-sm text-yellow-800 mt-1">
                        Si no se observan más de **{criticalDeviation}** desviaciones en una muestra de tamaño **{calculatedSampleSize}**, puede estar por lo menos seguro en un **{confidenceLevel}%** de que la tasa de desviación de la población no será mayor que el **{tolerableDeviation}%**.
                        </p>
                        {controlType === 'beta-alpha' && (
                        <p className="text-sm text-yellow-800 mt-1">
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
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded shadow"
                >
                Calcular
                </button>
                <button
                onClick={handlePrint}
                disabled={!isPlanificacionDone}
                className={`font-semibold py-2 px-4 rounded shadow ${!isPlanificacionDone ? "bg-gray-400 text-gray-700 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
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

    const renderAleatorio = () => {
        if (!isPlanificacionDone) {
        return (
            <div className="p-4 text-center text-gray-500">
            Debes completar el paso de Planificación primero.
            </div>
        );
        }
        
        return (
        <div className="flex space-x-6 p-4">
            {/* Columna Izquierda: Formulario de Muestreo Aleatorio */}
            <div className="flex-1 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-4 text-gray-800">Muestreo Aleatorio de Registros</h3>
                <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700">Nro. de registros a seleccionar:</label>
                    <input 
                    type="number" 
                    value={numRecordsToSelect} 
                    onChange={(e) => setNumRecordsToSelect(Number(e.target.value))} 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700">Número inicial aleatorio:</label>
                    <input 
                    type="number" 
                    value={startRandomNumber} 
                    onChange={(e) => setStartRandomNumber(Number(e.target.value))} 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700">Nro. de reg. inicial a seleccionar:</label>
                    <input 
                    type="number" 
                    value={startRecordToSelect} 
                    onChange={(e) => setStartRecordToSelect(Number(e.target.value))} 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700">Nro. de reg. final a seleccionar:</label>
                    <input 
                    type="number" 
                    value={endRecordToSelect} 
                    onChange={(e) => setEndRecordToSelect(Number(e.target.value))} 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                    />
                </div>
                </div>
                <div className="mt-4">
                <label className="inline-flex items-center">
                    <input 
                    type="checkbox" 
                    checked={allowDuplicates} 
                    onChange={(e) => setAllowDuplicates(e.target.checked)} 
                    className="h-4 w-4 text-blue-600 rounded" 
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Permitir registros duplicados</span>
                </label>
                </div>
                <div className="mt-4 flex flex-col">
                <label className="text-sm font-medium text-gray-700">Nombre de archivo:</label>
                <input 
                    type="text" 
                    value={outputFileName} 
                    onChange={(e) => setOutputFileName(e.target.value)} 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                />
                </div>
            </div>
            {isAleatorioDone && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                <h4 className="font-bold text-gray-800">Muestra Aleatoria Generada:</h4>
                <p className="mt-2 text-gray-700">
                    Se han seleccionado un total de **{randomSample.length}** registros para la muestra.
                </p>
                <div className="overflow-x-auto mt-4 bg-gray-50 rounded-lg shadow-inner">
                    <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                        {headers.map((header) => (
                            <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{header}</th>
                        ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {randomSample.map((row, index) => (
                        <tr key={index}>
                            {headers.map((header) => (
                            <td key={header} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row[header]}</td>
                            ))}
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
                </div>
            )}
            </div>
            
            {/* Columna Derecha: Botones de Acción */}
            <div className="w-48 flex-none flex flex-col space-y-4 mt-2">
            <button
                onClick={handleCreateRandomSample}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded shadow"
            >
                Aceptar
            </button>
            <button
                onClick={handleFields}
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded shadow"
            >
                Campos
            </button>
            <button
                onClick={handleClose}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded shadow"
            >
                Cancelar
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

    const renderEvaluar = () => {
        if (!isAleatorioDone) {
        return (
            <div className="p-4 text-center text-gray-500">
            Debes completar el paso de Muestreo Aleatorio primero.
            </div>
        );
        }

        return (
        <div className="flex space-x-6 p-4">
            {/* Columna Izquierda: Formulario de Evaluación */}
            <div className="flex-1 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-4 text-gray-800">Evaluación de la Muestra</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700">Tamaño de la población:</label>
                    <input type="number" value={populationSize} readOnly className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 cursor-not-allowed" />
                </div>
                <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700">Número de desviaciones en la muestra:</label>
                    <input 
                    type="number" 
                    value={observedDeviations} 
                    onChange={(e) => setObservedDeviations(Number(e.target.value))} 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700">Tamaño de la muestra:</label>
                    <input type="number" value={evaluatedSampleSize} readOnly className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 cursor-not-allowed" />
                </div>
                <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700">Nivel de confianza deseado (%):</label>
                    <select 
                    value={desiredConfidence} 
                    onChange={(e) => setDesiredConfidence(Number(e.target.value))} 
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                    <option value={95}>95%</option>
                    </select>
                </div>
                </div>
                {isEvaluarDone && (
                <div className="mt-6">
                    <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700">Tasa de desviación en muestra:</label>
                    <span className="mt-1 block text-lg font-bold text-gray-900">{sampleDeviationRate.toFixed(2)}%</span>
                    </div>
                    <div className="overflow-x-auto bg-gray-50 rounded-lg shadow-inner mt-4">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Límite Superior Unilateral</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Límite Inferior Bilateral</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Límite Superior Bilateral</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                        <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{unilateralUpperLimit.toFixed(2)}%</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bilateralLowerLimit.toFixed(2)}%</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bilateralUpperLimit.toFixed(2)}%</td>
                        </tr>
                        </tbody>
                    </table>
                    </div>
                    <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h4 className="font-semibold text-yellow-800">Conclusión:</h4>
                    <p className="text-sm text-yellow-800 mt-1">
                        Para un número observado de **{observedDeviations}** desviaciones en una muestra de tamaño **{evaluatedSampleSize}**, podrá estar seguro en un **{desiredConfidence}%** de que la tasa de desviación de la población no supera el **{unilateralUpperLimit.toFixed(2)}%**.
                    </p>
                    <p className="text-sm text-yellow-800 mt-1">
                        Alternativamente, podrá estar **{desiredConfidence}%** seguro de que la tasa de desviación de la población estará entre el **{bilateralLowerLimit.toFixed(2)}%** y el **{bilateralUpperLimit.toFixed(2)}%**.
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
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded shadow"
            >
                Calcular
            </button>
            <button
                onClick={() => handlePrint()}
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

    const renderContent = () => {
        switch (activeTab) {
        case "visualizar":
            return renderVisualizer();
        case "planificacion":
            return renderPlanification();
        case "aleatorio":
            return renderAleatorio();
        case "evaluar":
            return renderEvaluar();
        default:
            return null;
        }
    };

    return (
        <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Muestreo por Atributos</h1>
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
            accept=".xlsx,.xls,.csv,.xml"
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
            onClick={() => isPlanificacionDone && setActiveTab("aleatorio")}
            className={`px-4 py-2 font-medium ${
                activeTab === "aleatorio"
                ? "border-b-2 border-blue-600 text-blue-600"
                : isPlanificacionDone
                ? "text-gray-600 hover:text-gray-800"
                : "text-gray-400 cursor-not-allowed"
            }`}
            >
            Aleatorio
            </button>
            <button
            onClick={() => isAleatorioDone && setActiveTab("evaluar")}
            className={`px-4 py-2 font-medium ${
                activeTab === "evaluar"
                ? "border-b-2 border-blue-600 text-blue-600"
                : isAleatorioDone
                ? "text-gray-600 hover:text-gray-800"
                : "text-gray-400 cursor-not-allowed"
            }`}
            >
            Evaluar
            </button>
        </div>
        {renderContent()}
        </div>
    );
}