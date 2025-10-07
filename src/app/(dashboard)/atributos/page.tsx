// /app/dashboard/atributos/page.tsx
"use client";

import { useRef } from "react";
import { motion } from "framer-motion";

// Importa el Presenter/Controlador del flujo
import { useAtributosFlow } from "../../../lib/useAtributosFlow"; 

// Importa los componentes UI
import Visualizer from "./componentes/Visualizer";
import Planification from "./componentes/Planification";
import Aleatorio from "./componentes/Aleatorio";
import Evaluar from "./componentes/Evaluar";

// Importa el componente AnimatedTabs
import AnimatedTabs from "../../../components/visual/AnimatedTabs"; // Ajusta la ruta según tu estructura

export default function AtributosPage() {
    // 1. CORRECCIÓN: Desestructurar TODAS las propiedades y funciones del hook 'useAtributosFlow'
    const {
        activeTab, setActiveTab,
        isExcelLoaded, excelData, headers, isPlanificacionDone, isAleatorioDone, isEvaluarDone,
        
        // Estados de Planificación
        populationSize, setPopulationSize, expectedDeviation, setExpectedDeviation,
        tolerableDeviation, setTolerableDeviation, confidenceLevel, setConfidenceLevel,
        alphaConfidenceLevel, setAlphaConfidenceLevel, controlType, setControlType,
        calculatedSampleSize, criticalDeviation, excelPopulationSize,
        
        // Estados de Aleatorio
        numRecordsToSelect, setNumRecordsToSelect, startRandomNumber, setStartRandomNumber,
        startRecordToSelect, setStartRecordToSelect, endRecordToSelect, setEndRecordToSelect,
        allowDuplicates, setAllowDuplicates, outputFileName, setOutputFileName,
        randomSample,
        
        // Estados de Evaluar
        observedDeviations, setObservedDeviations, evaluatedSampleSize,
        desiredConfidence, setDesiredConfidence, sampleDeviationRate,
        unilateralUpperLimit, bilateralLowerLimit, bilateralUpperLimit,
        
        // Funciones de Manejo
        handleFileUpload, handleCalculatePlanification, handleCreateRandomSample,
        handleCalculateEvaluation, handleFields, handleClose, handleHelp, handlePrint, handleExportToExcel,

    } = useAtributosFlow();

    const fileInputRef = useRef<HTMLInputElement>(null);

    const renderContent = () => {
        switch (activeTab) {
            case "visualizar":
                return (
                  <motion.div
                    key="visualizar"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Visualizer excelData={excelData} headers={headers} />
                  </motion.div>
                );
            case "planificacion":
                return (
                  <motion.div
                    key="planificacion"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
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
                        handleHelp={handleHelp}
                    />
                  </motion.div>
                );
            case "aleatorio":
                return (
                  <motion.div
                    key="aleatorio"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Aleatorio
                        isPlanificacionDone={isPlanificacionDone}
                        excelData={excelData}
                        headers={headers}
                        numRecordsToSelect={numRecordsToSelect}
                        startRandomNumber={startRandomNumber}
                        startRecordToSelect={startRecordToSelect}
                        endRecordToSelect={endRecordToSelect}
                        allowDuplicates={allowDuplicates}
                        outputFileName={outputFileName}
                        randomSample={randomSample}
                        isAleatorioDone={isAleatorioDone}
                        setNumRecordsToSelect={setNumRecordsToSelect}
                        setStartRandomNumber={setStartRandomNumber}
                        setStartRecordToSelect={setStartRecordToSelect}
                        setEndRecordToSelect={setEndRecordToSelect}
                        setAllowDuplicates={setAllowDuplicates}
                        setOutputFileName={setOutputFileName}
                        handleCreateRandomSample={handleCreateRandomSample}
                        handleFields={handleFields}
                        handleClose={handleClose}
                        handleHelp={handleHelp}
                        handleExportToExcel={handleExportToExcel}
                    />
                  </motion.div>
                );
            case "evaluar":
                return (
                  <motion.div
                    key="evaluar"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Evaluar
                        isAleatorioDone={isAleatorioDone}
                        populationSize={populationSize}
                        evaluatedSampleSize={evaluatedSampleSize}
                        observedDeviations={observedDeviations}
                        desiredConfidence={desiredConfidence}
                        sampleDeviationRate={sampleDeviationRate}
                        unilateralUpperLimit={unilateralUpperLimit}
                        bilateralLowerLimit={bilateralLowerLimit}
                        bilateralUpperLimit={bilateralUpperLimit}
                        isEvaluarDone={isEvaluarDone}
                        setObservedDeviations={setObservedDeviations}
                        setDesiredConfidence={setDesiredConfidence}
                        handleCalculateEvaluation={handleCalculateEvaluation}
                        handlePrint={handlePrint}
                        handleClose={handleClose}
                        handleHelp={handleHelp}
                    />
                  </motion.div>
                );
            default:
                return null;
        }
    };
    
    // Array de objetos para los botones de navegación
    const tabs = [
        { id: "visualizar", name: "Visualizar", disabled: false },
        { id: "planificacion", name: "Planificación", disabled: !isExcelLoaded },
        { id: "aleatorio", name: "Aleatorio", disabled: !isPlanificacionDone },
        { id: "evaluar", name: "Evaluar", disabled: !isAleatorioDone },
    ];

    return (
        <main className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Muestreo por Atributos</h1>

                {/* Sección de carga de archivo */}
                <div className="flex justify-between items-center mb-4">
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

                <hr className="my-5 border-t border-gray-300" />

                {/* Navegación por pestañas animadas - REEMPLAZA la navegación anterior */}
                <AnimatedTabs
                  tabs={tabs}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  className="mb-8"
                />

                {/* Contenido de la pestaña activa con animación */}
                <div>
                    {renderContent()}
                </div>
            </div>
        </main>
    );
}