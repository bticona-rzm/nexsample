import { fetchData, calculatePlanification, createRandomSample, calculateEvaluation } from "../../../lib/apiClient";
import {PlanificationDataType } from "../../../lib/types";
import { printPlanificationResults } from "./utils/printUtils"; // Nueva utilidad
import { useState, useRef } from "react";
import * as XLSX from 'xlsx';

// 🚨 AJUSTA ESTA RUTA 🚨 Asegúrate de que apunte a tu archivo de constantes.
import { CONFIDENCE_FACTORS } from '../../../components/atributos/constants'; 

// Definiciones de tipos... (las mantienes aquí)
type ExcelRow = { [key: string]: any };
// ... otros tipos de parámetros

type ControlType = 'beta' | 'beta-alpha';
type TabName = "visualizar" | "planificacion" | "aleatorio" | "evaluar";

/**
 * Busca el factor de confianza M para el k=0 que coincida o se acerque más 
 * al nivel de confianza Beta (userConfidence) ingresado.
 * @param userConfidence Nivel de confianza Beta (%) ingresado por el usuario.
 * @returns El factor M para k=0 del nivel de confianza más cercano.
 */
const findClosestFactorM = (userConfidence: number): number | undefined => {
    // 1. Filtra solo las filas donde k=0 (se usan para calcular el tamaño de la muestra)
    const k0Factors = CONFIDENCE_FACTORS.filter(row => row.deviations === 0);

    if (k0Factors.length === 0) return undefined;

    // 2. Encuentra la confianza más cercana
    let closestRow = k0Factors.reduce((prev, curr) => {
        const prevDiff = Math.abs(prev.confidence - userConfidence);
        const currDiff = Math.abs(curr.confidence - userConfidence);
        // Si la diferencia es menor o igual (preferir mayor confianza en caso de empate), 
        // toma el valor actual.
        return (currDiff < prevDiff || (currDiff === prevDiff && curr.confidence > prev.confidence)) ? curr : prev;
    });

    return closestRow.factor;
};


export const useAtributosFlow = () => {
    // Todas las variables de estado se mantienen aquí
    const [activeTab, setActiveTab] = useState("visualizar");
    const [isExcelLoaded, setIsExcelLoaded] = useState(false);
    const [excelData, setExcelData] = useState<ExcelRow[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [isAleatorioDone, setIsAleatorioDone] = useState(false);
    const [isEvaluarDone, setIsEvaluarDone] = useState(false);

    // Estados de planificación
    const [populationSize, setPopulationSize] = useState(0); 
    const [expectedDeviation, setExpectedDeviation] = useState(1.0); // Tasa esperada (P1)
    const [tolerableDeviation, setTolerableDeviation] = useState(5.0); // Tasa tolerable (P2)
    const [confidenceLevel, setConfidenceLevel] = useState(95.0); // Riesgo Beta (1-β)
    const [alphaConfidenceLevel, setAlphaConfidenceLevel] = useState(90.0); // Riesgo Alfa (1-α)
    const [controlType, setControlType] = useState<ControlType>('beta');
    const [calculatedSampleSize, setCalculatedSampleSize] = useState(0);
    const [criticalDeviation, setCriticalDeviation] = useState(0);
    const [isPlanificacionDone, setIsPlanificacionDone] = useState(false);
    const [excelPopulationSize, setExcelPopulationSize] = useState(0); // Este guarda el valor del Excel

    // ... y el resto de estados para Aleatorio y Evaluar ...
    const [numRecordsToSelect, setNumRecordsToSelect] = useState(0);
    const [startRandomNumber, setStartRandomNumber] = useState(0);
    const [startRecordToSelect, setStartRecordToSelect] = useState(0);
    const [endRecordToSelect, setEndRecordToSelect] = useState(0);
    const [allowDuplicates, setAllowDuplicates] = useState(false);
    const [outputFileName, setOutputFileName] = useState("");
    const [randomSample, setRandomSample] = useState<ExcelRow[]>([]);

    const [observedDeviations, setObservedDeviations] = useState(0);
    const [evaluatedSampleSize, setEvaluatedSampleSize] = useState(0);
    const [desiredConfidence, setDesiredConfidence] = useState(95);
    const [sampleDeviationRate, setSampleDeviationRate] = useState(0);
    const [unilateralUpperLimit, setUnilateralUpperLimit] = useState(0);
    const [bilateralLowerLimit, setBilateralLowerLimit] = useState(0);
    const [bilateralUpperLimit, setBilateralUpperLimit] = useState(0);
    const [selectedDataFile, setSelectedDataFile] = useState<File | null>(null);

    const [planificationData, setPlanificationData] = useState<PlanificationDataType>({
        // Inicializa con valores predeterminados válidos
        populationSize: 0,
        expectedDeviation: 0,
        tolerableDeviation: 0,
        confidenceLevel: 95, 
        alphaConfidenceLevel: 5,
        controlType: '',
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Función para actualizar el archivo, expuesta a la UI
    const handleFileChange = (file: File | null) => {
        setSelectedDataFile(file);
    };

    // 2. Funciones de Manejo (Llamada a API y Actualización de Estado)
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            // Llama a la función del apiClient
            const { headers, data, populationSize } = await fetchData(file); 
            
            setHeaders(headers); // A
            setExcelData(data); // B
            setPopulationSize(populationSize); // Inicializa el valor del formulario
            setExcelPopulationSize(populationSize); // Guarda el valor del Excel para la validación
            setIsExcelLoaded(true);
            setActiveTab("visualizar");
            setSelectedDataFile(file); 
            // Reiniciar estados de planificación y muestreo
            setIsPlanificacionDone(false);
            setIsAleatorioDone(false);
            setCalculatedSampleSize(0);
            setCriticalDeviation(0);
        } catch (error) {
            console.error("Error al cargar el archivo:", error);
            alert("Hubo un problema al cargar el archivo. Asegúrate de que es un tipo válido.");
            setIsExcelLoaded(false);
        }
    };

    const handleCalculatePlanification = () => {
        
        // --- 1. VALIDACIONES (Sin Cambios) ---
        if (populationSize <= 0 || isNaN(populationSize)) {
            alert("El tamaño de la población debe ser un número positivo.");
            return;
        }
        if (tolerableDeviation <= 0 || isNaN(tolerableDeviation)) {
            alert("La desviación tolerable debe ser mayor que cero.");
            return;
        }
        
        if (controlType === 'beta-alpha' && tolerableDeviation <= expectedDeviation) {
            alert("En control Beta/Alfa, la desviación tolerable debe ser estrictamente mayor que la desviación esperada.");
            return;
        }

        if (confidenceLevel <= 0 || isNaN(confidenceLevel)) {
            alert("El nivel de confianza Beta debe ser un número positivo.");
            return;
        }

        try {
            const tolerableDeviationRate = tolerableDeviation / 100; // P2
            const expectedDeviationRate = expectedDeviation / 100;   // P1

            // --- 3. CÁLCULO DEL DIVISOR (P2 o P2 - P1) ---
            let divisor: number;
            if (controlType === 'beta') {
                divisor = tolerableDeviationRate;
            } else { // 'beta-alpha'
                divisor = tolerableDeviationRate - expectedDeviationRate;
            }
            
            if (divisor <= 0) {
                alert("Error de cálculo: El divisor de la muestra es cero o negativo.");
                return;
            }

            // --- 4. OBTENER FACTOR DE CONFIANZA BASE (M para k=0) ---
            // 🚨 CORRECCIÓN CLAVE: Usar la función de búsqueda de factor más cercano 🚨
            const targetFactorM = findClosestFactorM(confidenceLevel);
            
            if (targetFactorM === undefined) {
                 alert("Error: No se pudo obtener el factor de confianza de la tabla para el cálculo de la muestra.");
                 return;
            }

            // --- 5. CÁLCULO DE LA MUESTRA INICIAL (n0 = M / Divisor) ---
            let n0 = Math.ceil(targetFactorM / divisor);
            let finalSampleSize = n0;

            // --- 6. APLICACIÓN del FPC (Factor de Corrección para Población Finita) ---
            if (populationSize > 1 && n0 < populationSize) {
                finalSampleSize = Math.ceil(n0 / (1 + (n0 / populationSize)));
            } else if (n0 >= populationSize && populationSize > 0) {
                finalSampleSize = populationSize;
            }
            
            if (finalSampleSize < 1 && populationSize > 0) {
                finalSampleSize = 1;
            }
            
            // --- 7. CALCULAR DESVIACIÓN CRÍTICA (k) ---
            
            // Recalculamos n * P2 con el tamaño de muestra final
            const n_por_P2 = finalSampleSize * tolerableDeviationRate;
            
            // Buscamos el k más grande para el Nivel de Confianza (BETA) más cercano, tal que M(k) <= n*P2.
            const criticalRows = CONFIDENCE_FACTORS
                .filter(cf => 
                    // Filtramos por el nivel de confianza que se usó (el más cercano al input del usuario)
                    cf.confidence === findClosestConfidenceLevel(confidenceLevel) && 
                    cf.factor <= n_por_P2
                )
                .sort((a, b) => b.deviations - a.deviations);

            
            // La desviación crítica es el K más alto que cumpla la condición.
            const finalCriticalDeviation = criticalRows.length > 0 ? criticalRows[0].deviations : 0;
            
            // --- 8. ACTUALIZAR ESTADOS ---
            setCalculatedSampleSize(finalSampleSize);
            setCriticalDeviation(finalCriticalDeviation);
            setIsPlanificacionDone(true);
            
        } catch (error) {
            console.error("Error en el cálculo local:", error);
            alert("Ocurrió un error inesperado al calcular la planificación. Verifique los logs.");
            setIsPlanificacionDone(false);
        }
    };

    // Función auxiliar para obtener el nivel de confianza que realmente se usó para el cálculo
    const findClosestConfidenceLevel = (userConfidence: number): number | undefined => {
        const uniqueConfidences = [...new Set(CONFIDENCE_FACTORS.map(row => row.confidence))];
        if (uniqueConfidences.length === 0) return undefined;
    
        return uniqueConfidences.reduce((prev, curr) => {
            const prevDiff = Math.abs(prev - userConfidence);
            const currDiff = Math.abs(curr - userConfidence);
            return (currDiff < prevDiff || (currDiff === prevDiff && curr > prev)) ? curr : prev;
        });
    };

    // Reescritura de las funciones de manejo que llaman a los nuevos apiClient
    const handleCreateRandomSample = async () => {
        try {
            const result = await createRandomSample({
                excelData,
                calculatedSampleSize: numRecordsToSelect,
                startRandomNumber,
                startRecordToSelect,
                endRecordToSelect,
                allowDuplicates,
            });
            setRandomSample(result.randomSample);
            setIsAleatorioDone(true);
            setEvaluatedSampleSize(result.randomSample.length);
        } catch (error) {
            console.error("Error en el muestreo aleatorio:", error);
            alert("Error al generar la muestra aleatoria.");
        }
    };

    const handleCalculateEvaluation = async () => {
        try {
            const result = await calculateEvaluation({
                evaluatedSampleSize,
                observedDeviations,
                desiredConfidence,
            });
            setSampleDeviationRate(result.sampleDeviationRate);
            setUnilateralUpperLimit(result.unilateralUpperLimit);
            setBilateralLowerLimit(result.bilateralLowerLimit);
            setBilateralUpperLimit(result.bilateralUpperLimit);
            setIsEvaluarDone(true);
        } catch (error) {
            console.error("Error en la evaluación:", error);
            alert("Error al evaluar la muestra.");
        }
    };

    // Nuevas funciones de manejo de eventos
    const handleFields = () => {
        alert("La función 'Campos' te permite seleccionar qué columnas del archivo Excel quieres incluir en la muestra aleatoria. Esta funcionalidad aún no está implementada.");
    };

    const handleClose = () => {
        if (confirm("¿Estás seguro de que deseas cerrar? Esto borrará todos los datos cargados y calculados.")) {
            // Reinicia todos los estados a su valor inicial
            setIsExcelLoaded(false);
            setExcelData([]);
            setHeaders([]);
            setIsPlanificacionDone(false);
            setIsAleatorioDone(false);
            setIsEvaluarDone(false);
            setPopulationSize(0);
            setCalculatedSampleSize(0);
            setCriticalDeviation(0);
            setRandomSample([]);
            setSelectedDataFile(null);
            // Y cualquier otro estado que necesites reiniciar
            alert("Se han borrado los datos. Puedes cargar un nuevo archivo.");
        }
    };

    const handleHelp = () => {
        alert("El módulo de Muestreo por Atributos te guía a través de un proceso de 4 pasos: \n\n1. Visualizar: Carga y ve los datos de tu archivo. \n2. Planificación: Calcula el tamaño de la muestra y el número crítico de desviaciones. \n3. Aleatorio: Genera una muestra aleatoria basada en la planificación. \n4. Evaluar: Analiza la muestra para determinar los límites de desviación de la población.");
    };

    const handlePrint = () => {
        // Llama a la utilidad de impresión, desacoplando la lógica de jsPDF.
        printPlanificationResults(calculatedSampleSize, criticalDeviation);
    };

    const handleExportToExcel = () => {
        if (randomSample.length === 0) {
            alert("No hay muestra para exportar.");
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(randomSample);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Muestra Aleatoria");

        const fileName = `${outputFileName || 'Muestra Aleatoria'}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    };

    // 4. Retorna el estado y las funciones que necesita el componente padre (page.tsx)
    return {
        // Generales
        activeTab, setActiveTab,
        isExcelLoaded, excelData, headers,
        isPlanificacionDone, isAleatorioDone, isEvaluarDone, // <= ¡Asegúrate de incluir isEvaluarDone!
        
        // Planificación
        populationSize, setPopulationSize, 
        expectedDeviation, setExpectedDeviation,
        tolerableDeviation, setTolerableDeviation, // <= ¡Incluir tolerableDeviation!
        confidenceLevel, setConfidenceLevel,
        alphaConfidenceLevel, setAlphaConfidenceLevel,
        controlType, setControlType,
        calculatedSampleSize, criticalDeviation, excelPopulationSize,
        handleCalculatePlanification,
        handlePrint,
        handleClose,
        handleHelp,
        
        // Aleatorio
        numRecordsToSelect, setNumRecordsToSelect, 
        startRandomNumber, setStartRandomNumber,
        startRecordToSelect, setStartRecordToSelect, 
        endRecordToSelect, setEndRecordToSelect,
        allowDuplicates, setAllowDuplicates, 
        outputFileName, setOutputFileName,
        randomSample,
        
        // Evaluación
        observedDeviations, setObservedDeviations, // <= ¡Incluir observedDeviations y su setter!
        evaluatedSampleSize, // <= ¡Incluir evaluatedSampleSize!
        desiredConfidence, setDesiredConfidence, // <= ¡Incluir desiredConfidence y su setter!
        sampleDeviationRate, // <= ¡Incluir sampleDeviationRate!
        unilateralUpperLimit, bilateralLowerLimit, bilateralUpperLimit, // <= ¡Incluir todos los límites!

        // Funciones
        handleFileUpload, handleCreateRandomSample,
        handleCalculateEvaluation, 
        handleFields, // <= ¡Incluir handleFields!
        planificationData,
        handleFileChange, // Exporta la función de actualización
        handleExportToExcel
    };    

}
