"use client";

import { useState, useRef } from "react";
// Importa las funciones de MUM desde apiClient
import { fetchDataWithHeaders, ExcelRow, mumApi } from "../../../lib/apiClient";
import Visualizer from "../atributos/componentes/Visualizer";
import Planification from "./componentes/Planification";
import Extraction from "./componentes/Extraction";
import Evaluation from "./componentes/Evaluation";
import { LogProvider, useLog } from '../../../contexts/LogContext';
import AnimatedTabs from '../../../components/visual/AnimatedTabs';
import { motion } from 'framer-motion';
import { HelpButton } from './componentes/HelpButtonMumPage';
import { HistoryPanel } from '../../../components/mum/HistoryPanel';

// ✅ MOVER MumPageContent DENTRO del componente que usa LogProvider
function MumPageContentWithLogs() {
    const [excelData, setExcelData] = useState<ExcelRow[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState("visualizar");
    const [isExcelLoaded, setIsExcelLoaded] = useState(false);
    const [isPlanificacionDone, setIsPlanificacionDone] = useState(false);
    const [isExtraccionDone, setIsExtraccionDone] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const { addLog } = useLog(); // ✅ Ahora está DENTRO del proveedor

    // --- Estados de la Planificación ---
    const [useFieldValue, setUseFieldValue] = useState(false);
    const [selectedField, setSelectedField] = useState<string | null>(null);
    const [selectedPopulationType, setSelectedPopulationType] = useState<
        "positive" | "negative" | "absolute"
    >("positive");
    const [confidenceLevel, setConfidenceLevel] = useState(90);
    const [errorType, setErrorType] = useState<"importe" | "percentage">("importe");
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
    const [highValueManagement, setHighValueManagement] = useState<"agregados" | "separado">("separado");
    const [highValueFilename, setHighValueFilename] = useState("Valores Altos");
    const [highValueCount, setHighValueCount] = useState(0);
    const [highValueLimit, setHighValueLimit] = useState(0);
    const [sampleField, setSampleField] = useState<string | null>(null);
    const [randomStartPoint, setRandomStartPoint] = useState(0);
    const [selectedTableType, setSelectedTableType] = useState<"positive" | "negative" | "absolute">("positive");
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
    const [numErrores, setNumErrores] = useState(0);
    const [errorMasProbableBruto, setErrorMasProbableBruto] = useState(0);
    const [errorMasProbableNeto, setErrorMasProbableNeto] = useState(0);
    const [precisionTotal, setPrecisionTotal] = useState(0);
    const [limiteErrorSuperiorBruto, setLimiteErrorSuperiorBruto] = useState(0);
    const [limiteErrorSuperiorNeto, setLimiteErrorSuperiorNeto] = useState(0);
    const [highValueCountResume, setHighValueCountResume] = useState(0);
    const [highValueTotal, setHighValueTotal] = useState(0);
    const [populationExcludingHigh, setPopulationExcludingHigh] = useState(0);
    const [populationIncludingHigh, setPopulationIncludingHigh] = useState(0);

    // Función para abrir historial
    const handleOpenHistory = () => {
        setShowHistory(true);
        addLog(
            'Usuario visualizó historial',
            `Historial abierto desde página principal - Pestaña: ${activeTab}`,
            'general',
            'user'
        );
    };

    // Manejador de carga de archivo
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            setIsExcelLoaded(false);
            setExcelData([]);
            setHeaders([]);
            return;
        }

        try {
            addLog(
                'Usuario cargó archivo Excel',
                `Archivo: ${file.name}\nTamaño: ${(file.size / 1024 / 1024).toFixed(2)} MB`,
                'visualización',
                'user'
            );

            const { headers, data } = await fetchDataWithHeaders(file);
            setHeaders(headers);
            setExcelData(data);
            setIsExcelLoaded(true);
            setActiveTab("visualizar");
            setIsPlanificacionDone(false);
            setIsExtraccionDone(false);
            setExcelFilename(file.name);
            setPopulationRecords(data.length);

            addLog(
                'Archivo procesado exitosamente',
                `Columnas: ${headers.length}\nRegistros: ${data.length}`,
                'visualización',
                'system'
            );

            addLog(
            'Usuario visualizó datos del archivo',
            `Registros: ${data.length}\nColumnas: ${headers.length}\nPrimeras columnas: ${headers.slice(0, 5).join(', ')}${headers.length > 5 ? '...' : ''}`,
            'visualización',
            'user'
        );

        } catch (error) {
            console.error("Error al cargar el archivo:", error);
            addLog(
                'Error al cargar archivo',
                `Archivo: ${file.name}\nError: ${error}`,
                'visualización',
                'system'
            );
            alert("Hubo un problema al cargar el archivo. Asegúrate de que es un archivo Excel válido.");
            setIsExcelLoaded(false);
        }
    };

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
            
            // ✅ ACTUALIZAR ESTADO SINCRÓNICAMENTE
            setEstimatedPopulationValue(result.estimatedPopulationValue);
            setEstimatedSampleSize(result.estimatedSampleSize);
            setSampleInterval(result.sampleInterval);
            setTolerableContamination(result.tolerableContamination);
            setConclusion(result.conclusion);
            setMinSampleSize(result.minSampleSize);

            // ✅ RETORNAR LOS RESULTADOS explícitamente
            return {
                estimatedSampleSize: result.estimatedSampleSize,
                sampleInterval: result.sampleInterval,
                tolerableContamination: result.tolerableContamination,
                estimatedPopulationValue: result.estimatedPopulationValue,
                conclusion: result.conclusion,
                minSampleSize: result.minSampleSize
            };

        } catch (error) {
            console.error("Error en la planificación:", error);
            
            addLog(
                'Error en proceso de planificación',
                `Error del servidor: ${error}`,
                'planificación',
                'system'
            );
            
            throw error;
        }
    };

    const handleExtraction = async () => {
        try {
            // ✅ VALIDAR CAMPOS REQUERIDOS
            if (!sampleField) {
                alert("Debe seleccionar un campo numérico para la muestra");
                return;
            }

            if (!extractionFilename.trim()) {
                alert("Debe ingresar un nombre para el archivo de muestra");
                return;
            }

            if (highValueManagement === "separado" && !highValueFilename.trim()) {
                alert("Debe ingresar un nombre para el archivo de valores altos");
                return;
            }

            const body = {
                excelData,
                estimatedSampleSize,
                sampleInterval,
                highValueLimit: highValueLimit || sampleInterval,
                highValueManagement,
                sampleField,
                randomStartPoint,
                estimatedPopulationValue,
                extractionType,
                extractionFilename: extractionFilename.endsWith('.xlsx') 
                    ? extractionFilename 
                    : `${extractionFilename}.xlsx`,
                highValueFilename: highValueFilename.endsWith('.xlsx')
                    ? highValueFilename
                    : `${highValueFilename}.xlsx`,
            };

            const result = await mumApi.extraction(body);

            // ✅ ACTUALIZAR: Setear los valores REALES calculados en el backend
            setHighValueCountResume(result.highValueCount || 0);
            setHighValueTotal(result.highValueTotal || 0);
            setPopulationExcludingHigh(result.populationExcludingHigh || estimatedPopulationValue);
            setPopulationIncludingHigh(result.populationIncludingHigh || estimatedPopulationValue);

            // ✅ CORRECCIÓN: DECODIFICACIÓN BASE64 MEJORADA
            if (!result.sampleFileBase64) {
                throw new Error("No se recibió archivo de muestra del servidor");
            }

            // Decodificar archivo de muestra
            const sampleBinary = atob(result.sampleFileBase64);
            const sampleBytes = new Uint8Array(sampleBinary.length);
            for (let i = 0; i < sampleBinary.length; i++) {
                sampleBytes[i] = sampleBinary.charCodeAt(i);
            }
            
            const sampleBlob = new Blob([sampleBytes], { 
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
            });
            
            // ✅ USAR NOMBRE DEL BACKEND SI ESTÁ DISPONIBLE
            const sampleDownloadName = result.sampleFilename || body.extractionFilename;
            const sampleUrl = window.URL.createObjectURL(sampleBlob);
            
            const link = document.createElement('a');
            link.href = sampleUrl;
            link.setAttribute('download', sampleDownloadName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(sampleUrl);

            // ✅ CORRECCIÓN: MANEJO MEJORADO DE ARCHIVO DE VALORES ALTOS
            if (highValueManagement === "separado" && result.highValueFileBase64) {
                
                const highValueBinary = atob(result.highValueFileBase64);
                const highValueBytes = new Uint8Array(highValueBinary.length);
                for (let i = 0; i < highValueBinary.length; i++) {
                    highValueBytes[i] = highValueBinary.charCodeAt(i);
                }
                
                const highValueBlob = new Blob([highValueBytes], { 
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
                });
                
                // ✅ USAR NOMBRE DEL BACKEND SI ESTÁ DISPONIBLE
                const highValueDownloadName = result.highValueFilename || body.highValueFilename;
                const highValueUrl = window.URL.createObjectURL(highValueBlob);
                
                const highValueLink = document.createElement('a');
                highValueLink.href = highValueUrl;
                highValueLink.setAttribute('download', highValueDownloadName);
                document.body.appendChild(highValueLink);
                highValueLink.click();
                highValueLink.remove();
                window.URL.revokeObjectURL(highValueUrl);
                
            } else if (highValueManagement === "separado" && !result.highValueFileBase64) {
                alert('⚠️  No se generó archivo de valores altos (posiblemente no hay valores altos)');
            }

            // ✅ ACTUALIZAR ESTADO Y NAVEGAR
            setIsExtraccionDone(true);
            setActiveTab("evaluacion");
            
            addLog(
                'Extracción completada exitosamente',
                `Archivos generados: ${extractionFilename}${highValueManagement === 'separado' ? `, ${highValueFilename}` : ''}`,
                'extracción',
                'system'
            );

            alert("✅ Extracción completada correctamente");

        } catch (error) {
            console.error("❌ Error en la extracción:", error);
            addLog(
                'Error en extracción',
                `Error: ${error}`,
                'extracción',
                'system'
            );
            alert(`Hubo un problema con la extracción de la muestra: ${error}`);
        }
    };

    const handleEvaluation = async (method: 'cell-classical' | 'stringer-bound') => {
        try {
            addLog(
                'Usuario inició proceso de evaluación',
                `Método seleccionado: ${method}`,
                'evaluación',
                'user'
            );

            // ✅ USAR EL ENDPOINT CORRECTO SEGÚN EL MÉTODO
            let result;
            if (method === 'cell-classical') {
                const evaluationData = {
                    sampleData: [],
                    sampleInterval,
                    confidenceLevel,
                    populationValue: estimatedPopulationValue,
                    tolerableError,
                };
                result = await mumApi.cellClassicalEvaluation(evaluationData);
            } else {
                result = await mumApi.stringerBoundEvaluation({
                    // datos para stringer bound
                });
            }

            // ✅ ACTUALIZAR EL ESTADO
            setErrorMasProbableBruto(result.errorMasProbableBruto);
            setErrorMasProbableNeto(result.errorMasProbableNeto);
            setPrecisionTotal(result.precisionTotal);
            setLimiteErrorSuperiorBruto(result.limiteErrorSuperiorBruto);
            setLimiteErrorSuperiorNeto(result.limiteErrorSuperiorNeto);
            setHighValueCountResume(result.highValueCountResume);
            setHighValueTotal(result.highValueTotal);
            setPopulationExcludingHigh(result.populationExcludingHigh);
            setPopulationIncludingHigh(result.populationIncludingHigh);

            return result;
        } catch (error) {
            console.error("Error en la evaluación:", error);
            addLog(
                'Error en evaluación',
                `Método: ${method}\nError: ${error}`,
                'evaluación',
                'system'
            );
            alert("Hubo un problema al generar la evaluación.");
        }
    };

    const tabs = [
        { id: "visualizar", name: "Visualizar" },
        { id: "planificacion", name: "Planificación", disabled: !isExcelLoaded },
        { id: "extraccion", name: "Extracción", disabled: !isPlanificacionDone },
        { id: "evaluacion", name: "Evaluación", disabled: !isExtraccionDone },
    ];

    return (
        <main className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Título con ayuda general */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">
                        Muestreo por Unidad Monetaria
                    </h1>
                </div>

                {/* Sección de carga de archivo con ayuda */}
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-4">
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
                        <HelpButton context="file-upload" />
                    </div>
                    
                    {/* Botones de ayuda e historial */}
                    <div className="flex gap-2">
                        <button
                            onClick={handleOpenHistory}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-full shadow w-full"
                        >
                            Ver Historial
                        </button>
                        <div className="">
                            <HelpButton 
                                context="general" 
                                className="bg-orange-400 hover:bg-orange-500 text-white font-semibold py-2 px-4 rounded-full shadow w-full" 
                            />
                        </div>
                    </div>
                </div>

                {/* Panel de Historial */}
                {showHistory && (
                    <HistoryPanel 
                        isOpen={showHistory} 
                        onClose={() => setShowHistory(false)} 
                    />
                )}

                {/* Navegación por pestañas */}
                <AnimatedTabs
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    className="mb-8"
                />

                {/* Contenido de la pestaña activa */}
                <div>
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {activeTab === "visualizar" && (
                            <Visualizer 
                                excelData={excelData} 
                                headers={headers}
                                //onOpenHistory={handleOpenHistory}
                            />
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
                                highValueLimit={highValueLimit}
                                setHighValueLimit={setHighValueLimit}
                                populationExcludingHigh={populationExcludingHigh}
                                setPopulationExcludingHigh={setPopulationExcludingHigh}
                                highValueTotal={highValueTotal}
                                setHighValueTotal={setHighValueTotal}
                                populationIncludingHigh={populationIncludingHigh}
                                setPopulationIncludingHigh={setPopulationIncludingHigh}
                                highValueCount={highValueCount}
                                setHighValueCount={setHighValueCount}
                                onOpenHistory={handleOpenHistory}
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
                                onOpenHistory={handleOpenHistory}
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
                                selectedField={selectedField}
                                onOpenHistory={handleOpenHistory}
                            />
                        )}
                    </motion.div>
                </div>
            </div> 
        </main>
    );
}

// Exportación por defecto CON LogProvider
export default function MumPage() {
    return (
        <LogProvider>
            <MumPageContentWithLogs />
        </LogProvider>
    );
}