"use client";

import { useState, useRef } from "react";
// Importa las funciones de MUM desde apiClient
import { fetchData, ExcelRow, mumApi } from "../../../lib/apiClient";
import Visualizer from "../atributos/componentes/Visualizer";
import Planification from "./componentes/Planification";
import Extraction from "./componentes/Extraction";
import Evaluation from "./componentes/Evaluation";
import { LogProvider } from '../../../contexts/LogContext'; // Importa el LogProvider

function MumPageContent() {
    const [excelData, setExcelData] = useState<ExcelRow[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState("visualizar");
    const [isExcelLoaded, setIsExcelLoaded] = useState(false);
    const [isPlanificacionDone, setIsPlanificacionDone] = useState(false);
    const [isExtraccionDone, setIsExtraccionDone] = useState(false);

    // --- Estados de la Planificación ---
    const [useFieldValue, setUseFieldValue] = useState(false);
    const [selectedField, setSelectedField] = useState<string | null>(null);
    const [selectedPopulationType, setSelectedPopulationType] = useState<
        "positive" | "negative" | "absolute"
    >("positive"); // Cambiado a "positive" como solicitaste
    const [confidenceLevel, setConfidenceLevel] = useState(90);
    const [errorType, setErrorType] = useState<"importe" | "percentage">("importe"); // Cambiado a "importe" como solicitaste
    const [tolerableError, setTolerableError] = useState(0);
    const [expectedError, setExpectedError] = useState(0);
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
    
    // --- Estados para el módulo de Extracción ---
    const [extractionType, setExtractionType] = useState<"intervaloFijo" | "seleccionCelda">("intervaloFijo");
    const [highValueManagement, setHighValueManagement] = useState<"agregados" | "separado">("separado"); // Cambiado a "separado" como solicitaste
    const [highValueFilename, setHighValueFilename] = useState("Valores Altos");
    const [highValueCount, setHighValueCount] = useState(0);
    const [highValueLimit, setHighValueLimit] = useState(0);
    const [sampleField, setSampleField] = useState<string | null>(null);
    const [randomStartPoint, setRandomStartPoint] = useState(0);
    const [selectedTableType, setSelectedTableType] = useState<"positive" | "negative" | "absolute">("positive"); // Cambiado a "positive" como solicitaste
    const [positiveTotal, setPositiveTotal] = useState(0);
    const [positiveRecords, setPositiveRecords] = useState(0);
    const [negativeTotal, setNegativeTotal] = useState(0);
    const [negativeRecords, setNegativeRecords] = useState(0);
    const [absoluteTotal, setAbsoluteTotal] = useState(0);
    const [absoluteRecords, setAbsoluteRecords] = useState(0);
    const [extractionFilename, setExtractionFilename] = useState("MUM Muestra");
    const [excelFilename, setExcelFilename] = useState<string>('');
    const [populationRecords, setPopulationRecords] = useState<number>(0);
    const [modifyHighValueLimit, setModifyHighValueLimit] = useState<boolean>(false);

    // --- Estados para el módulo de Resumen ---
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

    // Manejador de carga de archivo SIN logs por ahora
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            setIsExcelLoaded(false);
            setExcelData([]);
            setHeaders([]);
            return;
        }

        try {
            const { headers, data } = await fetchData(file);
            setHeaders(headers);
            setExcelData(data);
            setIsExcelLoaded(true);
            setActiveTab("visualizar");
            setIsPlanificacionDone(false);
            setIsExtraccionDone(false);
            setExcelFilename(file.name);
            setPopulationRecords(data.length);
        } catch (error) {
            console.error("Error al cargar el archivo:", error);
            alert("Hubo un problema al cargar el archivo. Asegúrate de que es un archivo Excel válido.");
            setIsExcelLoaded(false);
        }
    };

    // --- Manejadores de las funciones de la API para MUM CON LOGS ---
    const handlePlanification = async () => {
        try {
            const body = {
                excelData,
                useFieldValue,
                selectedField,
                selectedPopulationType,
                confidenceLevel,
                errorType,
                tolerableError,
                expectedError,
                modifyPrecision,
                precisionValue,
                populationSize: populationRecords || excelData.length,
                expectedDeviation: expectedError,
                tolerableDeviation: tolerableError,
                alphaConfidenceLevel: (100 - confidenceLevel) / 100,
                controlType: "noControl",
            };
            
            const result = await mumApi.planification(body);
            
            setEstimatedPopulationValue(result.estimatedPopulationValue);
            setEstimatedSampleSize(result.estimatedSampleSize);
            setSampleInterval(result.sampleInterval);
            setTolerableContamination(result.tolerableContamination);
            setConclusion(result.conclusion);
            setMinSampleSize(result.minSampleSize);
            
            // ELIMINAR estas líneas para que no navegue automáticamente
            // setIsPlanificacionDone(true);
            // setActiveTab("extraccion");            

        } catch (error) {
            console.error("Error en la planificación:", error);
            alert("Hubo un problema con la planificación. Revisa los datos de entrada.");
        }
    };


    const handleExtraction = async () => {
        try {
            const body = {
                excelData,
                estimatedSampleSize,
                sampleInterval,
                highValueLimit,
                highValueManagement,
                sampleField,
                randomStartPoint,
            };
            const result = await mumApi.extraction(body);
            const url = window.URL.createObjectURL(new Blob([result]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'muestra_mum.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            setIsExtraccionDone(true);
            setActiveTab("evaluacion");

        } catch (error) {
            console.error("Error en la extracción:", error);
            alert("Hubo un problema con la extracción de la muestra.");
        }
    };

    const handleEvaluation = async () => {
        try {
            const body = {
                confidenceLevel,
                sampleInterval,
                highValueLimit,
                precisionValue,
                estimatedSampleSize,
                numErrores,
            };
            const result = await mumApi.summary(body);
            
            setErrorMasProbableBruto(result.errorMasProbableBruto);
            setErrorMasProbableNeto(result.errorMasProbableNeto);
            setPrecisionTotal(result.precisionTotal);
            setLimiteErrorSuperiorBruto(result.limiteErrorSuperiorBruto);
            setLimiteErrorSuperiorNeto(result.limiteErrorSuperiorNeto);
            setHighValueCountResume(result.highValueCountResume);
            setHighValueTotal(result.highValueTotal);
            setPopulationExcludingHigh(result.populationExcludingHigh);
            setPopulationIncludingHigh(result.populationIncludingHigh);

            alert("Resumen de resultados procesado correctamente.");
        } catch (error) {
            console.error("Error en el evaluacion:", error);
            alert("Hubo un problema al generar la evaluacion.");
        }
    };

    const tabs = [
        { id: "visualizar", name: "Visualizar Datos" },
        { id: "planificacion", name: "Planificación", disabled: !isExcelLoaded },
        { id: "extraccion", name: "Extracción", disabled: !isPlanificacionDone },
        { id: "evaluacion", name: "Evaluación", disabled: !isExtraccionDone },
    ];

    return (
        <main className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">
                    Muestreo por Unidad Monetaria
                </h1>

                {/* Sección de carga de archivo y selector de MUM */}
                <div className="flex justify-between items-center mb-4">
                    {/* Contenedor del botón de carga de archivo */}
                    <div>
                        <label
                            htmlFor="file-upload"
                            className={`cursor-pointer font-semibold py-2 px-4 rounded shadow transition-colors ${
                                isExcelLoaded
                                    ? "bg-[#008795] hover:bg-emerald-700 text-white"
                                    : "bg-[#0f3c73] hover:bg-blue-800 text-white"
                            }`}
                        >
                            {isExcelLoaded ? "Archivo Cargado ✅" : "Cargar Archivo Excel"}
                        </label>
                        <input
                            id="file-upload"
                            type="file"
                            accept=".xlsx,.xls,.csv,.xml,.dbf,.accdb,.mdb"
                            onChange={handleFileUpload}
                            className="hidden"
                            ref={fileInputRef}
                        />
                    </div>
                </div>

                <hr className="my-6 border-t border-gray-300" />

                {/* Navegación por pestañas */}
                <div className="mb-6 flex space-x-2 border-b border-gray-200">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            disabled={tab.disabled}
                            className={`py-2 px-4 text-sm font-medium rounded-t-lg ${
                                activeTab === tab.id
                                    ? "bg-white text-blue-600 border-b-2 border-blue-600"
                                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            } ${tab.disabled ? "cursor-not-allowed opacity-50" : ""}`}
                        >
                            {tab.name}
                        </button>
                    ))}
                </div>

                {/* Contenido de la pestaña activa */}
                <div>
                    {activeTab === "visualizar" && (
                        <Visualizer excelData={excelData} headers={headers} />
                    )}
                    {activeTab === "planificacion" && (
                        <Planification
                            isExcelLoaded={isExcelLoaded}
                            headers={headers}
                            useFieldValue={useFieldValue}
                            setUseFieldValue={setUseFieldValue}
                            selectedField={selectedField}
                            setSelectedField={setSelectedField}
                            selectedPopulationType={selectedPopulationType}
                            setSelectedPopulationType={setSelectedPopulationType}
                            confidenceLevel={confidenceLevel}
                            setConfidenceLevel={setConfidenceLevel}
                            errorType={errorType}
                            setErrorType={setErrorType}
                            tolerableError={tolerableError}
                            setTolerableError={setTolerableError}
                            expectedError={expectedError}
                            setExpectedError={setExpectedError}
                            modifyPrecision={modifyPrecision}
                            setModifyPrecision={setModifyPrecision}
                            precisionValue={precisionValue}
                            setPrecisionValue={setPrecisionValue}
                            estimatedPopulationValue={estimatedPopulationValue}
                            setEstimatedPopulationValue={setEstimatedPopulationValue}
                            estimatedSampleSize={estimatedSampleSize}
                            setEstimatedSampleSize={setEstimatedSampleSize}
                            sampleInterval={sampleInterval}
                            setSampleInterval={setSampleInterval}
                            tolerableContamination={tolerableContamination}
                            setTolerableContamination={setTolerableContamination}
                            conclusion={conclusion}
                            setConclusion={setConclusion}
                            minSampleSize={minSampleSize}
                            setMinSampleSize={setMinSampleSize}
                            excelData={excelData}
                            setIsPlanificacionDone={setIsPlanificacionDone}
                            setActiveTab={setActiveTab}
                            handlePlanification={handlePlanification}
                        />
                    )}
                    {activeTab === "extraccion" && (
                        <Extraction
                            isPlanificacionDone={isPlanificacionDone}
                            headers={headers}
                            excelData={excelData}
                            estimatedSampleSize={estimatedSampleSize}
                            sampleInterval={sampleInterval}
                            highValueLimit={highValueLimit}
                            highValueManagement={highValueManagement}
                            setHighValueManagement={setHighValueManagement}
                            highValueFilename={highValueFilename}
                            setHighValueFilename={setHighValueFilename}
                            highValueCount={highValueCount}
                            setHighValueCount={setHighValueCount}
                            setHighValueLimit={setHighValueLimit}
                            modifyHighValueLimit={modifyHighValueLimit}
                            setModifyHighValueLimit={setModifyHighValueLimit}
                            sampleField={sampleField}
                            setSampleField={setSampleField}
                            randomStartPoint={randomStartPoint}
                            setRandomStartPoint={setRandomStartPoint}
                            selectedTableType={selectedTableType}
                            setSelectedTableType={setSelectedTableType}
                            positiveTotal={positiveTotal}
                            setPositiveTotal={setPositiveTotal}
                            positiveRecords={positiveRecords}
                            setPositiveRecords={setPositiveRecords}
                            negativeTotal={negativeTotal}
                            setNegativeTotal={setNegativeTotal}
                            negativeRecords={negativeRecords}
                            setNegativeRecords={setNegativeRecords}
                            absoluteTotal={absoluteTotal}
                            setAbsoluteTotal={setAbsoluteTotal}
                            absoluteRecords={absoluteRecords}
                            setAbsoluteRecords={setAbsoluteRecords}
                            extractionFilename={extractionFilename}
                            setExtractionFilename={setExtractionFilename}
                            setIsExtraccionDone={setIsExtraccionDone}
                            setActiveTab={setActiveTab}
                            extractionType={extractionType}
                            setExtractionType={setExtractionType}
                            selectedField={selectedField}
                            setSelectedField={setSelectedField}
                            excelFilename={excelFilename}
                            estimatedPopulationValue={estimatedPopulationValue}
                            populationRecords={populationRecords}
                            handleExtraction={handleExtraction}
                        />
                    )}
                    {activeTab === "evaluacion" && (
                        <Evaluation
                            isExtraccionDone={isExtraccionDone}
                            confidenceLevel={confidenceLevel}
                            sampleInterval={sampleInterval}
                            highValueLimit={highValueLimit}
                            precisionValue={precisionValue}
                            setPrecisionValue={setPrecisionValue}
                            estimatedSampleSize={estimatedSampleSize}
                            estimatedPopulationValue={estimatedPopulationValue}
                            numErrores={numErrores}
                            errorMasProbableBruto={errorMasProbableBruto}
                            errorMasProbableNeto={errorMasProbableNeto}
                            precisionTotal={precisionTotal}
                            limiteErrorSuperiorBruto={limiteErrorSuperiorBruto}
                            limiteErrorSuperiorNeto={limiteErrorSuperiorNeto}
                            highValueCountResume={highValueCountResume}
                            highValueTotal={highValueTotal}
                            populationExcludingHigh={populationExcludingHigh}
                            populationIncludingHigh={populationIncludingHigh}
                            handleEvaluation={handleEvaluation}
                            setActiveTab={setActiveTab}
                            headers={headers} 
                            tolerableError={tolerableError}
                        />
                    )}
                </div>
            </div>
        </main>
    );
}

// Exportación por defecto CON LogProvider
export default function MumPage() {
    return (
        <LogProvider>
            <MumPageContent />
        </LogProvider>
    );
}