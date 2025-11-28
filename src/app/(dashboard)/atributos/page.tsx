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

    // ✅ ESTADOS PARA MODO DE MUESTREO
    const [samplingMode, setSamplingMode] = useState<'web' | 'local'>('web');
    const [localFilePath, setLocalFilePath] = useState('');

    // ✅ FUNCIÓN MEJORADA PARA CARGAR ARCHIVO CON LOGS (WEB)
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            addLog(
                'Usuario cargó archivo Excel para muestreo por atributos (Web)',
                `Archivo: ${file.name}\nTamaño: ${(file.size / 1024 / 1024).toFixed(2)} MB`,
                'visualización',
                'user'
            );

            if (file.size > 1024 * 1024 * 1024) { // 1GB
                alert("El archivo es demasiado grande para carga web. Por favor use el modo 'Procesamiento Local'.");
                return;
            }

            // Si es grande (>50MB), solo cargamos preview
            if (file.size > 50 * 1024 * 1024) {
                alert("Archivo grande detectado. Se cargará una vista previa y el procesamiento será por streaming.");

                // Leer solo los primeros 50KB para cabeceras y preview
                const chunk = file.slice(0, 50 * 1024);
                const { headers, data } = await fetchDataWithHeaders(new File([chunk], file.name));

                setHeaders(headers);
                setExcelData(data); // Solo preview
                setPopulationSize(0); // Desconocido, usuario debe ingresar o estimar
                setIsExcelLoaded(true);
                setActiveTab("visualizar");
                setSelectedDataFile(file); // Guardamos referencia al archivo completo

                addLog(
                    'Archivo grande procesado (Preview)',
                    `Columnas: ${headers.length}\nRegistros (Preview): ${data.length}`,
                    'visualización',
                    'system'
                );
            } else {
                // Carga normal para archivos pequeños
                const { headers, data } = await fetchDataWithHeaders(file);

                setHeaders(headers);
                setExcelData(data);
                setPopulationSize(data.length);
                setIsExcelLoaded(true);
                setActiveTab("visualizar");
                setSelectedDataFile(file);

                addLog(
                    'Archivo procesado exitosamente',
                    `Columnas: ${headers.length}\nRegistros: ${data.length}`,
                    'visualización',
                    'system'
                );
            }

            // Reiniciar estados comunes
            setIsPlanificacionDone(false);
            setIsAleatorioDone(false);
            setIsEvaluarDone(false);
            setCalculatedSampleSize(0);
            setCriticalDeviation(0);

        } catch (error) {
            console.error("Error al cargar el archivo:", error);
            addLog('Error al cargar archivo', `Error: ${error}`, 'visualización', 'error');
            alert("Hubo un problema al cargar el archivo.");
            setIsExcelLoaded(false);
        }
    };

    // ✅ FUNCIÓN PARA PROCESAMIENTO LOCAL (MASIVO)
    const handleLocalProcessing = async () => {
        if (!localFilePath.trim()) {
            alert("Por favor ingrese la ruta del archivo local.");
            return;
        }

        try {
            addLog(
                'Usuario inició procesamiento local (Masivo)',
                `Ruta: ${localFilePath}`,
                'visualización',
                'user'
            );

            // Llamar al endpoint de info masiva
            const info = await apiClient.atributos.getMassiveFileInfo(localFilePath);

            setHeaders(info.headers);
            setExcelData(info.previewData); // Preview de las primeras líneas
            setPopulationSize(info.populationSize);
            setIsExcelLoaded(true);
            setActiveTab("visualizar");

            addLog(
                'Archivo masivo conectado exitosamente',
                `Ruta: ${localFilePath}\nRegistros Totales: ${info.populationSize}\nPreview: ${info.previewData.length} líneas`,
                'visualización',
                'system'
            );

            alert(`Conexión exitosa.\nRegistros detectados: ${info.populationSize}\nSe muestra una vista previa.`);

        } catch (error) {
            console.error("Error en procesamiento local:", error);
            const msg = error instanceof Error ? error.message : String(error);
            addLog('Error conexión local', msg, 'visualización', 'error');
            alert("Error al conectar con el archivo local: " + msg);
        }
    };

    // ✅ FUNCIÓN MEJORADA PARA PLANIFICACIÓN CON LOGS
    const handleCalculatePlanification = async () => {
        ```javascript

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
import { useState, useRef } from 'react'; // Importar useState y useRef
import { motion } from 'framer-motion'; // Importar motion

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
            `Historial abierto desde página principal - Pestaña activa: ${ activeTab } `,
            'general',
            'user'
        );
    };

    // ✅ ESTADOS PARA MODO DE MUESTREO
    const [samplingMode, setSamplingMode] = useState<'web' | 'local'>('web');
    const [localFilePath, setLocalFilePath] = useState('');

    // ✅ FUNCIÓN MEJORADA PARA CARGAR ARCHIVO CON LOGS (WEB)
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            addLog(
                'Usuario cargó archivo Excel para muestreo por atributos (Web)',
                `Archivo: ${ file.name } \nTamaño: ${ (file.size / 1024 / 1024).toFixed(2) } MB`,
                'visualización',
                'user'
            );

            if (file.size > 1024 * 1024 * 1024) { // 1GB
                alert("El archivo es demasiado grande para carga web. Por favor use el modo 'Procesamiento Local'.");
                return;
            }

            // Si es grande (>50MB), solo cargamos preview
            if (file.size > 50 * 1024 * 1024) {
                alert("Archivo grande detectado. Se cargará una vista previa y el procesamiento será por streaming.");

                // Leer solo los primeros 50KB para cabeceras y preview
                const chunk = file.slice(0, 50 * 1024);
                const { headers, data } = await fetchDataWithHeaders(new File([chunk], file.name));

                setHeaders(headers);
                setExcelData(data); // Solo preview
                setPopulationSize(0); // Desconocido, usuario debe ingresar o estimar
                setIsExcelLoaded(true);
                setActiveTab("visualizar");
                setSelectedDataFile(file); // Guardamos referencia al archivo completo

                addLog(
                    'Archivo grande procesado (Preview)',
                    `Columnas: ${ headers.length } \nRegistros(Preview): ${ data.length } `,
                    'visualización',
                    'system'
                );
            } else {
                // Carga normal para archivos pequeños
                const { headers, data } = await fetchDataWithHeaders(file);

                setHeaders(headers);
                setExcelData(data);
                setPopulationSize(data.length);
                setIsExcelLoaded(true);
                setActiveTab("visualizar");
                setSelectedDataFile(file);

                addLog(
                    'Archivo procesado exitosamente',
                    `Columnas: ${ headers.length } \nRegistros: ${ data.length } `,
                    'visualización',
                    'system'
                );
            }

            // Reiniciar estados comunes
            setIsPlanificacionDone(false);
            setIsAleatorioDone(false);
            setIsEvaluarDone(false);
            setCalculatedSampleSize(0);
            setCriticalDeviation(0);

        } catch (error) {
            console.error("Error al cargar el archivo:", error);
            addLog('Error al cargar archivo', `Error: ${ error } `, 'visualización', 'error');
            alert("Hubo un problema al cargar el archivo.");
            setIsExcelLoaded(false);
        }
    };

    // ✅ FUNCIÓN PARA PROCESAMIENTO LOCAL (MASIVO)
    const handleLocalProcessing = async () => {
        if (!localFilePath.trim()) {
            alert("Por favor ingrese la ruta del archivo local.");
            return;
        }

        try {
            addLog(
                'Usuario inició procesamiento local (Masivo)',
                `Ruta: ${ localFilePath } `,
                'visualización',
                'user'
            );

            // Llamar al endpoint de info masiva
            const info = await apiClient.atributos.getMassiveFileInfo(localFilePath);

            setHeaders(info.headers);
            setExcelData(info.previewData); // Preview de las primeras líneas
            setPopulationSize(info.populationSize);
            setIsExcelLoaded(true);
            setActiveTab("visualizar");

            addLog(
                'Archivo masivo conectado exitosamente',
                `Ruta: ${ localFilePath } \nRegistros Totales: ${ info.populationSize } \nPreview: ${ info.previewData.length } líneas`,
                'visualización',
                'system'
            );

            alert(`Conexión exitosa.\nRegistros detectados: ${ info.populationSize } \nSe muestra una vista previa.`);

        } catch (error) {
            console.error("Error en procesamiento local:", error);
            const msg = error instanceof Error ? error.message : String(error);
            addLog('Error conexión local', msg, 'visualización', 'error');
            alert("Error al conectar con el archivo local: " + msg);
        }
    };

    // ✅ FUNCIÓN MEJORADA PARA PLANIFICACIÓN CON LOGS
    const handleCalculatePlanification = async () => {
        if (samplingMode === 'web' && !selectedDataFile) {
            alert("Debe cargar un archivo Excel primero.");
            return;
        }
        if (samplingMode === 'local' && !localFilePath) {
            alert("Debe especificar una ruta de archivo local.");
            return;
        }

        try {
            addLog(
                'Usuario inició cálculo de planificación',
                `Tamaño población: ${ populationSize } \nDesviación tolerable: ${ tolerableDeviation }%\nNivel confianza: ${ confidenceLevel }% `,
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

            // Nota: La planificación es puramente matemática.
            const fileToSend = (samplingMode === 'web' && selectedDataFile && selectedDataFile.size < 50 * 1024 * 1024)
                ? selectedDataFile
                : null;

            const result = await apiClient.atributos.planification(planificationData, fileToSend);

            setSemillaAleatoria(result.semillaCalculada);
            setCalculatedSampleSize(result.calculatedSampleSize);
            setCriticalDeviation(result.criticalDeviation);
            setIsPlanificacionDone(true);

            addLog(
                'Planificación calculada exitosamente',
                `Tamaño muestra: ${ result.calculatedSampleSize } \nDesviación crítica: ${ result.criticalDeviation } \nSemilla: ${ result.semillaCalculada } `,
                'planificación',
                'system'
            );

        } catch (error) {
            console.error("Error en planificación:", error);
            addLog(
                'Error en cálculo de planificación',
                `Error: ${ error instanceof Error ? error.message : "Error desconocido" } `,
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
                `Muestra: ${ calculatedSampleSize } \nDesviaciones críticas: ${ criticalDeviation } `,
                'general',
                'user'
            );
            alert(`Imprimiendo resultados: \nMuestra: ${ calculatedSampleSize } \nDesviaciones críticas: ${ criticalDeviation } `);
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
            `Avanzando a módulo de muestreo aleatorio\nTamaño muestra aceptado: ${ calculatedSampleSize } `,
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
            `Muestra exportada con ${ randomSample.length } registros\nAvanzando a módulo de evaluación`,
            'aleatorio',
            'user'
        );
    };

    // ✅ FUNCIÓN MEJORADA PARA MUESTREO ALEATORIO CON LOGS
    const handleCreateRandomSample = async (sampleSize: number, seed: number) => {
        try {
            addLog(
                'Usuario generó muestra aleatoria',
                `Tamaño muestra: ${ sampleSize } \nSemilla: ${ seed } \nPoblación: ${ populationSize } registros`, // Corrected to use populationSize
                'aleatorio',
                'user'
            );

            let result;
            if (samplingMode === 'web') {
                if (!selectedDataFile) throw new Error("No hay archivo seleccionado");

                // Usar endpoint de streaming para WEB
                result = await apiClient.atributos.generateReducedSample(selectedDataFile, {
                    sampleSize,
                    seed
                });
            } else {
                // Usar endpoint masivo para LOCAL
                result = await apiClient.atributos.generateMassiveSample({
                    filePath: localFilePath,
                `Muestra creada: ${ sampleData.length } registros`,
                'aleatorio',
                'system'
            );

        } catch (error) {
            console.error("Error en el muestreo aleatorio:", error);
            addLog(
                'Error al generar muestra aleatoria',
                `Error: ${ error } `,
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
                `Desviaciones observadas: ${ observedDeviations } \nConfianza deseada: ${ desiredConfidence }% `,
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
                `Tasa desviación: ${ result.sampleDeviationRate || 0 }%\nLímite superior unilateral: ${ result.unilateralUpperLimit || 0 } `,
                'evaluación',
                'system'
            );

        } catch (error) {
            console.error("Error en evaluación:", error);
            const errorMessage = error instanceof Error ? error.message : "Error desconocido";

            addLog(
                'Error en evaluación de resultados',
                `Error: ${ errorMessage } `,
                'evaluación',
                'error'
            );
            alert("Error al calcular la evaluación: " + errorMessage);
        }
    };

    // Dummy function for handleReproduce, assuming it will be implemented later
    const handleReproduce = (logEntry: any) => {
        addLog(
            'Usuario intentó reproducir acción',
            `Acción: ${ logEntry.action } \nDetalles: ${ logEntry.details } `,
            'general',
            'user'
        );
        alert(`Reproduciendo acción: ${ logEntry.action } `);
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

                        {/* SELECTOR DE MODO */}
                        <div className="flex bg-white rounded-lg shadow p-1 border border-gray-200">
                            <button
                                onClick={() => setSamplingMode('web')}
                                className={`px - 4 py - 2 rounded - md text - sm font - medium transition - colors ${
            samplingMode === 'web' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
        } `}
                            >
                                Carga Web (&lt;1GB)
                            </button>
                            <button
                                onClick={() => setSamplingMode('local')}
                                className={`px - 4 py - 2 rounded - md text - sm font - medium transition - colors ${
            samplingMode === 'local' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'
        } `}
                            >
                                Local / Masivo (&gt;1TB)
                            </button>
                        </div>

                        {samplingMode === 'web' ? (
                            <div>
                                <label htmlFor="file-upload" className={`cursor - pointer font - semibold py - 2 px - 4 rounded shadow transition - colors ${
            isExcelLoaded ? "bg-[#008795] hover:bg-emerald-700 text-white" : "bg-[#0f3c73] hover:bg-blue-800 text-white"
        } `}>
                                    {isExcelLoaded ? "Archivo Cargado ✅" : "Cargar Archivo Excel"}
                                </label>
                                <input id="file-upload" type="file" accept=".xlsx,.xls,.csv,.xml,.dbf,.accdb,.mdb" onChange={handleFileUpload} className="hidden" ref={fileInputRef} />
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Ruta absoluta (ej: C:\Data\archivo.csv)"
                                    className="border rounded px-3 py-2 w-64"
                                    value={localFilePath}
                                    onChange={(e) => setLocalFilePath(e.target.value)}
                                />
                                <button
                                    onClick={handleLocalProcessing}
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded shadow"
                                >
                                    Conectar
                                </button>
                            </div>
                        )}

                        <HelpButtonAtributos context="file-upload" />
                    </div>
                    <div className="flex items-center gap-4">
                        <AnimatedTabs
                            tabs={tabs}
                            activeTab={activeTab}
                            onTabChange={setActiveTab}
                        />
                        <button
                            onClick={handleOpenHistory}
                            className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                            title="Ver Historial"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Contenido Principal */}
                {renderContent()}

                {/* Panel de Historial */}
                <HistoryPanel
                    isOpen={showHistory}
                    onClose={() => setShowHistory(false)}
                    onReproduce={handleReproduce}
                />
            </div>
        </main>
    );
}

// ✅ ENVOLTORIO PARA PROVEER EL CONTEXTO
export default function AtributosPage() {
    return (
        <LogProviderAtributos>
            <AtributosPageContentWithLogs />
        </LogProviderAtributos>
    );
}
```