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

// Tipos simples
type ControlType = 'beta' | 'beta-alpha';
type ExcelRow = Record<string, string | number | null>;

// ✅ FUNCIÓN PARA CALCULAR SEMILLA (método IDEA)
function calcularSemillaIDEA(intervaloMuestreo: number, poblacionTotal: number): number {
    // IDEA usa una combinación del intervalo + timestamp + factores únicos
    const timestamp = Date.now();
    const factorUnico = Math.floor(Math.random() * 10000);
    
    // Fórmula común: (intervalo * timestamp) mod factorGrande
    const semilla = (intervaloMuestreo * timestamp + factorUnico) % 1000000;
    
    return Math.floor(semilla);
}

// ✅ FUNCIÓN PARA CALCULAR INTERVALO DE MUESTREO
function calcularIntervaloMuestreo(poblacionSize: number, muestraSize: number): number {
    if (muestraSize <= 0 || poblacionSize <= 0) return 0;
    return poblacionSize / muestraSize;
}

export default function AtributosPage() {
    // Estados básicos
    const [activeTab, setActiveTab] = useState("visualizar");
    const [isExcelLoaded, setIsExcelLoaded] = useState(false);
    const [excelData, setExcelData] = useState<ExcelRow[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [selectedDataFile, setSelectedDataFile] = useState<File | null>(null);
    
    // Estados de Planificación
    const [populationSize, setPopulationSize] = useState(0);
    const [expectedDeviation, setExpectedDeviation] = useState(2.0);
    const [tolerableDeviation, setTolerableDeviation] = useState(5.0);
    const [confidenceLevel, setConfidenceLevel] = useState(95.0);
    const [alphaConfidenceLevel, setAlphaConfidenceLevel] = useState(90.0);
    const [controlType, setControlType] = useState<ControlType>('beta');
     // ✅ NUEVO ESTADO para controlar si se aceptó la planificación
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
    const [desiredConfidence, setDesiredConfidence] = useState(95.0); // ✅ NUEVO ESTADO
    const [sampleDeviationRate, setSampleDeviationRate] = useState(0); // ✅ NUEVO ESTADO

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Función simplificada para cargar archivo
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
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
            
        } catch (error) {
            console.error("Error al cargar el archivo:", error);
            alert("Hubo un problema al cargar el archivo.");
            setIsExcelLoaded(false);
        }
    };

    // Función simplificada para planificación
    const handleCalculatePlanification = async () => {
        if (!selectedDataFile) {
            alert("Debe cargar un archivo Excel primero.");
            return;
        }

        try {
            const planificationData = {
                populationSize,
                tolerableDeviation, 
                confidenceLevel,
                controlType,
                expectedDeviation,
                alphaConfidenceLevel
            };

            const result = await apiClient.atributos.planification(planificationData, selectedDataFile);

            setCalculatedSampleSize(result.calculatedSampleSize);
            setCriticalDeviation(result.criticalDeviation);
            setIsPlanificacionDone(true);

            // ✅ CALCULAR SEMILLA AUTOMÁTICAMENTE después de la planificación
            const intervalo = calcularIntervaloMuestreo(populationSize, result.calculatedSampleSize);
            const semillaCalculada = calcularSemillaIDEA(intervalo, populationSize);
            setSemillaAleatoria(semillaCalculada);
            
        } catch (error) {
            console.error("Error en planificación:", error);
            alert("Error al calcular la planificación: " + (error instanceof Error ? error.message : "Error desconocido"));
        }
    };

    // Funciones simples de manejo
    const handlePrint = () => {
        if (isPlanificacionDone) {
            alert(`Imprimiendo resultados:\nMuestra: ${calculatedSampleSize}\nDesviaciones críticas: ${criticalDeviation}`);
        }
    };

    const handleClose = () => {
        if (confirm("¿Estás seguro de que deseas cerrar? Se perderán todos los datos.")) {
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

    const handleHelp = () => {
        alert("Módulo de Muestreo por Atributos - 4 pasos:\n1. Visualizar datos\n2. Planificar muestra\n3. Generar muestra aleatoria\n4. Evaluar resultados");
    };

    // ✅ NUEVA FUNCIÓN para manejar la aceptación
    const handleAcceptPlanification = () => {
        setIsPlanificacionAccepted(true);
        setActiveTab("aleatorio"); // Avanzar automáticamente al siguiente paso
    };

    // ✅ NUEVA FUNCIÓN para manejar la exportación
    const handleExportToExcel = () => {
        setIsExportDone(true);
        setActiveTab("evaluar"); // Avanzar automáticamente al siguiente paso
    };

    const handleCreateRandomSample = async (sampleSize: number, seed: number) => {
        try {
            const result = await apiClient.atributos.createRandomSample({
                excelData,
                calculatedSampleSize: sampleSize,
                startRandomNumber: seed, // ✅ Usar la semilla que viene del componente
                startRecordToSelect: 1,
                endRecordToSelect: excelData.length,
                allowDuplicates: false,
            });
            
            setRandomSample(result.randomSample);
            setIsAleatorioDone(true);
            
        } catch (error) {
            console.error("Error en el muestreo aleatorio:", error);
            alert("Error al generar la muestra aleatoria: " + error);
        }
    };

    const handleCalculateEvaluation = async () => {
        try {
            const result = await apiClient.atributos.calculateEvaluation({
                evaluatedSampleSize: randomSample.length,
                observedDeviations: observedDeviations,
                desiredConfidence: desiredConfidence // ✅ Usar el estado correcto
            });

            // ✅ ACTUALIZAR TODOS LOS ESTADOS CON VALORES POR DEFECTO
            setSampleDeviationRate(result.sampleDeviationRate || 0);
            setUnilateralUpperLimit(result.unilateralUpperLimit || 0);
            setBilateralLowerLimit(result.bilateralLowerLimit || 0);
            setBilateralUpperLimit(result.bilateralUpperLimit || 0);
            setIsEvaluarDone(true);
            
            console.log("✅ Evaluación completada:", result);
            
        } catch (error) {
            console.error("Error en evaluación:", error);
            // ✅ MANEJO SEGURO DE ERRORES
            const errorMessage = error instanceof Error ? error.message : "Error desconocido";
            alert("Error al calcular la evaluación: " + errorMessage);
        }
    };

    // Renderizado del contenido (igual que antes)
    const renderContent = () => {
        switch (activeTab) {
            case "visualizar":
                return (
                    <motion.div key="visualizar" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                        <Visualizer excelData={excelData} headers={headers} />
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
                            handleAcceptPlanification={handleAcceptPlanification} // ✅ NUEVA PROP
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
                            handleHelp={handleHelp}
                            handleExportToExcel={handleExportToExcel}
                            semillaCalculada={semillaAleatoria}
                            isExportDone={isExportDone}
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
                            desiredConfidence={desiredConfidence} // ✅ Usar el estado específico
                            sampleDeviationRate={sampleDeviationRate} // ✅ Usar el estado del resultado
                            isEvaluarDone={isEvaluarDone}
                            setObservedDeviations={setObservedDeviations}
                            setDesiredConfidence={setDesiredConfidence} // ✅ Setter específico
                            handleCalculateEvaluation={handleCalculateEvaluation}
                            handlePrint={handlePrint}
                            handleClose={handleClose}
                            handleHelp={handleHelp}
                            unilateralUpperLimit={unilateralUpperLimit}
                            bilateralLowerLimit={bilateralLowerLimit}
                            bilateralUpperLimit={bilateralUpperLimit}
                            randomSample={randomSample}  // ✅ Pasar la muestra
                            headers={headers}            // ✅ Pasar los headers
                        />
                    </motion.div>
                );
            default:
                return null;
        }
    };

    // Tabs (igual que antes)
    const tabs = [
        { id: "visualizar", name: "Visualizar", disabled: false },
        { id: "planificacion", name: "Planificación", disabled: !isExcelLoaded },
        { id: "aleatorio", name: "Aleatorio", disabled: !isPlanificacionDone },
        { id: "evaluar", name: "Evaluar", disabled: !isExportDone },
    ];

    return (
        <main className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Título y UI (igual que antes) */}
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
                    
                    <div className="w-32">
                        <HelpButtonAtributos context="general" className="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-full shadow w-full" />
                    </div>
                </div>

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