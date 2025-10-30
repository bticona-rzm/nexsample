"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";

// Importa los componentes UI
import Visualizer from "./componentes/Visualizer";
import Planification from "./componentes/Planification";
import Aleatorio from "./componentes/Aleatorio";
import Evaluar from "./componentes/Evaluar";

// Importa el componente AnimatedTabs
import AnimatedTabs from "../../../components/visual/AnimatedTabs";
import { HelpButtonAtributos } from './componentes/HelpButtonAtributes';
import { fetchDataWithHeaders, apiClient } from '@/lib/apiClient';

// Importa el contexto de logs para atributos
import { LogProviderAtributos, useLogAtributos } from '../../../contexts/LogContextAtributos';
import { HistoryPanel } from '../../../components/atributos/HistoryPanel';

// Tipos simples
type ControlType = 'beta' | 'beta-alpha';
type ExcelRow = Record<string, string | number | null>;

// ✅ COMPONENTE PRINCIPAL CON LOGS
function AtributosPageContentWithLogs() {
    // Estados básicos
    const [activeTab, setActiveTab] = useState("visualizar");
    const [isExcelLoaded, setIsExcelLoaded] = useState(false);
    const [excelData, setExcelData] = useState<ExcelRow[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [selectedDataFile, setSelectedDataFile] = useState<File | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    
    // ✅ CONTEXTO DE LOGS
    const { addLog } = useLogAtributos();
    
    // Estados de Planificación
    const [populationSize, setPopulationSize] = useState(0);
    const [expectedDeviation, setExpectedDeviation] = useState(2.0);
    const [tolerableDeviation, setTolerableDeviation] = useState(5.0);
    const [confidenceLevel, setConfidenceLevel] = useState(95.0);
    const [alphaConfidenceLevel, setAlphaConfidenceLevel] = useState(90.0);
    const [controlType, setControlType] = useState<ControlType>('beta');
    const [isPlanificacionAccepted, setIsPlanificacionAccepted] = useState(false);
    const [isExportDone, setIsExportDone] = useState(false);
    
    // Resultados de Planificación
    const [isPlanificacionDone, setIsPlanificacionDone] = useState(false);
    const [calculatedSampleSize, setCalculatedSampleSize] = useState(0);
    const [criticalDeviation, setCriticalDeviation] = useState(0);
    const [semillaAleatoria, setSemillaAleatoria] = useState(0);
    
    // Estados de Aleatorio
    const [isAleatorioDone, setIsAleatorioDone] = useState(false);
    const [randomSample, setRandomSample] = useState<ExcelRow[]>([]);
    
    // Estados de Evaluación
    const [isEvaluarDone, setIsEvaluarDone] = useState(false);
    const [observedDeviations, setObservedDeviations] = useState(0);
    const [unilateralUpperLimit, setUnilateralUpperLimit] = useState(0);
    const [bilateralLowerLimit, setBilateralLowerLimit] = useState(0);
    const [bilateralUpperLimit, setBilateralUpperLimit] = useState(0);
    const [desiredConfidence, setDesiredConfidence] = useState(95.0);
    const [sampleDeviationRate, setSampleDeviationRate] = useState(0);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // ✅ FUNCIÓN PARA ABRIR HISTORIAL
    const handleOpenHistory = () => {
        setShowHistory(true);
        addLog(
            'Usuario visualizó historial de atributos',
            `Historial abierto desde página principal - Pestaña activa: ${activeTab}`,
            'general',
            'user'
        );
    };

    // ✅ FUNCIÓN MEJORADA PARA CARGAR ARCHIVO CON LOGS
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            addLog(
                'Usuario cargó archivo Excel para muestreo por atributos',
                `Archivo: ${file.name}\nTamaño: ${(file.size / 1024 / 1024).toFixed(2)} MB`,
                'visualización',
                'user'
            );

            const { headers, data } = await fetchDataWithHeaders(file);
            
            setHeaders(headers);
            setExcelData(data);
            setPopulationSize(data.length);
            setIsExcelLoaded(true);
            setActiveTab("visualizar");
            setSelectedDataFile(file);
            
            // Reiniciar estados
            setIsPlanificacionDone(false);
            setIsAleatorioDone(false);
            setIsEvaluarDone(false);
            setCalculatedSampleSize(0);
            setCriticalDeviation(0);
            
            addLog(
                'Archivo procesado exitosamente para atributos',
                `Columnas: ${headers.length}\nRegistros: ${data.length}\nPrimeras columnas: ${headers.slice(0, 5).join(', ')}${headers.length > 5 ? '...' : ''}`,
                'visualización',
                'system'
            );

        } catch (error) {
            console.error("Error al cargar el archivo:", error);
            addLog(
                'Error al cargar archivo en módulo atributos',
                `Archivo: ${file.name}\nError: ${error}`,
                'visualización',
                'error'
            );
            alert("Hubo un problema al cargar el archivo.");
            setIsExcelLoaded(false);
        }
    };

    // ✅ FUNCIÓN MEJORADA PARA PLANIFICACIÓN CON LOGS
    const handleCalculatePlanification = async () => {
        if (!selectedDataFile) {
            alert("Debe cargar un archivo Excel primero.");
            return;
        }

        try {
            addLog(
                'Usuario inició cálculo de planificación',
                `Tamaño población: ${populationSize}\nDesviación tolerable: ${tolerableDeviation}%\nNivel confianza: ${confidenceLevel}%`,
                'planificación',
                'user'
            );

            const planificationData = {
                populationSize,
                tolerableDeviation, 
                confidenceLevel,
                controlType,
                expectedDeviation,
                alphaConfidenceLevel
            };

            const result = await apiClient.atributos.planification(planificationData, selectedDataFile);
            
            setSemillaAleatoria(result.semillaCalculada);
            setCalculatedSampleSize(result.calculatedSampleSize);
            setCriticalDeviation(result.criticalDeviation);
            setIsPlanificacionDone(true);

            addLog(
                'Planificación calculada exitosamente',
                `Tamaño muestra: ${result.calculatedSampleSize}\nDesviación crítica: ${result.criticalDeviation}\nSemilla: ${result.semillaCalculada}`,
                'planificación',
                'system'
            );

        } catch (error) {
            console.error("Error en planificación:", error);
            addLog(
                'Error en cálculo de planificación',
                `Error: ${error instanceof Error ? error.message : "Error desconocido"}`,
                'planificación',
                'error'
            );
            alert("Error al calcular la planificación: " + (error instanceof Error ? error.message : "Error desconocido"));
        }
    };

    // ✅ FUNCIONES SIMPLES CON LOGS
    const handlePrint = () => {
        if (isPlanificacionDone) {
            addLog(
                'Usuario imprimió resultados',
                `Muestra: ${calculatedSampleSize}\nDesviaciones críticas: ${criticalDeviation}`,
                'general',
                'user'
            );
            alert(`Imprimiendo resultados:\nMuestra: ${calculatedSampleSize}\nDesviaciones críticas: ${criticalDeviation}`);
        }
    };

    const handleClose = () => {
        if (confirm("¿Estás seguro de que deseas cerrar? Se perderán todos los datos.")) {
            addLog(
                'Usuario cerró la sesión de atributos',
                'Todos los datos han sido reiniciados',
                'general',
                'user'
            );
            
            setIsExcelLoaded(false);
            setExcelData([]);
            setHeaders([]);
            setIsPlanificacionDone(false);
            setIsAleatorioDone(false);
            setIsEvaluarDone(false);
            setPopulationSize(0);
            setCalculatedSampleSize(0);
            setCriticalDeviation(0);
            setSelectedDataFile(null);
        }
    };

    // ✅ NUEVA FUNCIÓN PARA MANEJAR LA ACEPTACIÓN CON LOGS
    const handleAcceptPlanification = () => {
        setIsPlanificacionAccepted(true);
        setActiveTab("aleatorio");
        
        addLog(
            'Usuario aceptó la planificación',
            `Avanzando a módulo de muestreo aleatorio\nTamaño muestra aceptado: ${calculatedSampleSize}`,
            'planificación',
            'user'
        );
    };

    // ✅ NUEVA FUNCIÓN PARA MANEJAR LA EXPORTACIÓN CON LOGS
    const handleExportToExcel = () => {
        setIsExportDone(true);
        setActiveTab("evaluar");
        
        addLog(
            'Usuario exportó muestra a Excel',
            `Muestra exportada con ${randomSample.length} registros\nAvanzando a módulo de evaluación`,
            'aleatorio',
            'user'
        );
    };

    // ✅ FUNCIÓN MEJORADA PARA MUESTREO ALEATORIO CON LOGS
    const handleCreateRandomSample = async (sampleSize: number, seed: number) => {
        try {
            addLog(
                'Usuario generó muestra aleatoria',
                `Tamaño muestra: ${sampleSize}\nSemilla: ${seed}\nPoblación: ${excelData.length} registros`,
                'aleatorio',
                'user'
            );

            const result = await apiClient.atributos.createRandomSample({
                excelData,
                calculatedSampleSize: sampleSize,
                startRandomNumber: seed,
                startRecordToSelect: 1,
                endRecordToSelect: excelData.length,
                allowDuplicates: false,
            });
            
            setRandomSample(result.randomSample);
            setIsAleatorioDone(true);

            addLog(
                'Muestra aleatoria generada exitosamente',
                `Muestra creada: ${result.randomSample.length} registros`,
                'aleatorio',
                'system'
            );
            
        } catch (error) {
            console.error("Error en el muestreo aleatorio:", error);
            addLog(
                'Error al generar muestra aleatoria',
                `Error: ${error}`,
                'aleatorio',
                'error'
            );
            alert("Error al generar la muestra aleatoria: " + error);
        }
    };

    // ✅ FUNCIÓN MEJORADA PARA EVALUACIÓN CON LOGS
    const handleCalculateEvaluation = async () => {
        try {
            addLog(
                'Usuario inició evaluación de resultados',
                `Desviaciones observadas: ${observedDeviations}\nConfianza deseada: ${desiredConfidence}%`,
                'evaluación',
                'user'
            );

            const result = await apiClient.atributos.calculateEvaluation({
                evaluatedSampleSize: randomSample.length,
                observedDeviations: observedDeviations,
                desiredConfidence: desiredConfidence
            });

            setSampleDeviationRate(result.sampleDeviationRate || 0);
            setUnilateralUpperLimit(result.unilateralUpperLimit || 0);
            setBilateralLowerLimit(result.bilateralLowerLimit || 0);
            setBilateralUpperLimit(result.bilateralUpperLimit || 0);
            setIsEvaluarDone(true);

            addLog(
                'Evaluación completada exitosamente',
                `Tasa desviación: ${result.sampleDeviationRate || 0}%\nLímite superior unilateral: ${result.unilateralUpperLimit || 0}`,
                'evaluación',
                'system'
            );
            
        } catch (error) {
            console.error("Error en evaluación:", error);
            const errorMessage = error instanceof Error ? error.message : "Error desconocido";
            
            addLog(
                'Error en evaluación de resultados',
                `Error: ${errorMessage}`,
                'evaluación',
                'error'
            );
            
            alert("Error al calcular la evaluación: " + errorMessage);
        }
    };

    // Renderizado del contenido
    const renderContent = () => {
        switch (activeTab) {
            case "visualizar":
                return (
                    <motion.div key="visualizar" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                        <Visualizer 
                            excelData={excelData} 
                            headers={headers} 
                            //onOpenHistory={handleOpenHistory} // ✅ Pasar función de historial
                        />
                    </motion.div>
                );
            case "planificacion":
                return (
                    <motion.div key="planificacion" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                        <Planification
                            isExcelLoaded={isExcelLoaded}
                            populationSize={populationSize}
                            expectedDeviation={expectedDeviation}
                            tolerableDeviation={tolerableDeviation}
                            confidenceLevel={confidenceLevel}
                            alphaConfidenceLevel={alphaConfidenceLevel}
                            controlType={controlType}
                            calculatedSampleSize={calculatedSampleSize}
                            criticalDeviation={criticalDeviation}
                            isPlanificacionDone={isPlanificacionDone}
                            handleCalculatePlanification={handleCalculatePlanification}
                            setPopulationSize={setPopulationSize}
                            setExpectedDeviation={setExpectedDeviation}
                            setTolerableDeviation={setTolerableDeviation}
                            setConfidenceLevel={setConfidenceLevel}
                            setAlphaConfidenceLevel={setAlphaConfidenceLevel}
                            setControlType={setControlType}
                            handlePrint={handlePrint}
                            handleClose={handleClose}
                            handleAcceptPlanification={handleAcceptPlanification}
                            onOpenHistory={handleOpenHistory} // ✅ Pasar función de historial
                        />
                    </motion.div>
                );
            case "aleatorio":
                return (
                    <motion.div key="aleatorio" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                        <Aleatorio
                            isPlanificacionDone={isPlanificacionDone}
                            excelData={excelData}
                            headers={headers}
                            randomSample={randomSample}
                            isAleatorioDone={isAleatorioDone}
                            calculatedSampleSize={calculatedSampleSize}
                            handleCreateRandomSample={handleCreateRandomSample}
                            handleClose={handleClose}
                            handleHelp={handleOpenHistory} // ✅ Usar historial en lugar de ayuda genérica
                            handleExportToExcel={handleExportToExcel}
                            semillaCalculada={semillaAleatoria}
                            isExportDone={isExportDone}
                            onOpenHistory={handleOpenHistory} // ✅ Pasar función de historial
                        />
                    </motion.div>
                );
            case "evaluar":
                return (
                    <motion.div key="evaluar" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                        <Evaluar
                            isAleatorioDone={isAleatorioDone}
                            populationSize={populationSize}
                            evaluatedSampleSize={randomSample.length}
                            observedDeviations={observedDeviations}
                            desiredConfidence={desiredConfidence}
                            sampleDeviationRate={sampleDeviationRate}
                            isEvaluarDone={isEvaluarDone}
                            setObservedDeviations={setObservedDeviations}
                            setDesiredConfidence={setDesiredConfidence}
                            handleCalculateEvaluation={handleCalculateEvaluation}
                            handlePrint={handlePrint}
                            handleClose={handleClose}
                            handleHelp={handleOpenHistory} // ✅ Usar historial en lugar de ayuda genérica
                            unilateralUpperLimit={unilateralUpperLimit}
                            bilateralLowerLimit={bilateralLowerLimit}
                            bilateralUpperLimit={bilateralUpperLimit}
                            randomSample={randomSample}
                            headers={headers}
                            onOpenHistory={handleOpenHistory} // ✅ Pasar función de historial
                        />
                    </motion.div>
                );
            default:
                return null;
        }
    };

    // Tabs
    const tabs = [
        { id: "visualizar", name: "Visualizar", disabled: false },
        { id: "planificacion", name: "Planificación", disabled: !isExcelLoaded },
        { id: "aleatorio", name: "Aleatorio", disabled: !isPlanificacionDone },
        { id: "evaluar", name: "Evaluar", disabled: !isExportDone },
    ];

    return (
        <main className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Título y UI */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Muestreo por Atributos</h1>
                </div>

                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-4">
                        <div>
                            <label htmlFor="file-upload" className={`cursor-pointer font-semibold py-2 px-4 rounded shadow transition-colors ${
                                isExcelLoaded ? "bg-[#008795] hover:bg-emerald-700 text-white" : "bg-[#0f3c73] hover:bg-blue-800 text-white"
                            }`}>
                                {isExcelLoaded ? "Archivo Cargado ✅" : "Cargar Archivo Excel"}
                            </label>
                            <input id="file-upload" type="file" accept=".xlsx,.xls,.csv,.xml,.dbf,.accdb,.mdb" onChange={handleFileUpload} className="hidden" ref={fileInputRef} />
                        </div>
                        <HelpButtonAtributos context="file-upload" />
                    </div>
                    
                    {/* ✅ BOTÓN DE HISTORIAL */}
                    <div className="flex gap-2">
                        <button
                            onClick={handleOpenHistory}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-full shadow w-full"
                        >
                            Ver Historial
                        </button>
                        <div className="w-32">
                            <HelpButtonAtributos 
                                context="general" 
                                className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-full shadow w-full"  
                            />
                        </div>
                    </div>
                </div>

                {/* ✅ PANEL DE HISTORIAL */}
                {showHistory && (
                    <HistoryPanel 
                        isOpen={showHistory} 
                        onClose={() => setShowHistory(false)} 
                    />
                )}

                <div className="flex items-center justify-between mb-8">
                    <div className="flex-1">
                        <AnimatedTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} className="mb-0" />
                    </div>
                </div>

                <div>{renderContent()}</div>
            </div>
        </main>
    );
}

// ✅ EXPORTACIÓN POR DEFECTO CON LOGPROVIDER
export default function AtributosPage() {
    return (
        <LogProviderAtributos>
            <AtributosPageContentWithLogs />
        </LogProviderAtributos>
    );
}