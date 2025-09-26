// /app/dashboard/atributos/page.tsx
"use client";

import { useRef } from "react";

// Importa el Presenter/Controlador del flujo
import { useAtributosFlow } from "./useAtributosFlow"; 

// Importa los componentes UI
import Visualizer from "./componentes/Visualizer";
import Planification from "./componentes/Planification";
import Aleatorio from "./componentes/Aleatorio";
import Evaluar from "./componentes/Evaluar";

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
                return <Visualizer excelData={excelData} headers={headers} />;
            case "planificacion":
                return (
                    <Planification
                        // 🚨 CORRECCIÓN FINAL: Añadir la prop faltante 🚨
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
                );
            case "aleatorio":
                return (
                    <Aleatorio
                        isPlanificacionDone={isPlanificacionDone}
                        excelData={excelData}
                        headers={headers}
                        numRecordsToSelect={numRecordsToSelect}      // <== AHORA EXISTE
                        startRandomNumber={startRandomNumber}        // <== AHORA EXISTE
                        startRecordToSelect={startRecordToSelect}    // <== AHORA EXISTE
                        endRecordToSelect={endRecordToSelect}        // <== AHORA EXISTE
                        allowDuplicates={allowDuplicates}            // <== AHORA EXISTE
                        outputFileName={outputFileName}              // <== AHORA EXISTE
                        randomSample={randomSample}                  // <== AHORA EXISTE
                        isAleatorioDone={isAleatorioDone}
                        setNumRecordsToSelect={setNumRecordsToSelect} // <== AHORA EXISTE
                        setStartRandomNumber={setStartRandomNumber}   // <== AHORA EXISTE
                        setStartRecordToSelect={setStartRecordToSelect} // <== AHORA EXISTE
                        setEndRecordToSelect={setEndRecordToSelect}     // <== AHORA EXISTE
                        setAllowDuplicates={setAllowDuplicates}         // <== AHORA EXISTE
                        setOutputFileName={setOutputFileName}           // <== AHORA EXISTE
                        handleCreateRandomSample={handleCreateRandomSample}
                        handleFields={handleFields}                     // <== AHORA EXISTE
                        handleClose={handleClose}
                        handleHelp={handleHelp}
                        handleExportToExcel={handleExportToExcel} // 🚨 ¡PASA LA PROP AQUÍ!
                    />
                );
            case "evaluar":
                return (
                    <Evaluar
                        isAleatorioDone={isAleatorioDone}
                        populationSize={populationSize}
                        evaluatedSampleSize={evaluatedSampleSize} // <== CORREGIDO
                        observedDeviations={observedDeviations}   // <== AHORA EXISTE
                        desiredConfidence={desiredConfidence}     // <== AHORA EXISTE
                        sampleDeviationRate={sampleDeviationRate} // <== AHORA EXISTE
                        unilateralUpperLimit={unilateralUpperLimit} // <== AHORA EXISTE
                        bilateralLowerLimit={bilateralLowerLimit} // <== AHORA EXISTE
                        bilateralUpperLimit={bilateralUpperLimit} // <== AHORA EXISTE
                        isEvaluarDone={isEvaluarDone}             // <== AHORA EXISTE
                        setObservedDeviations={setObservedDeviations} // <== AHORA EXISTE
                        setDesiredConfidence={setDesiredConfidence}   // <== AHORA EXISTE
                        handleCalculateEvaluation={handleCalculateEvaluation}
                        handlePrint={handlePrint}
                        handleClose={handleClose}
                        handleHelp={handleHelp}
                    />
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
                    {renderContent()}
                </div>
            </div>
        </main>
    );
}