import React, { useState, useEffect } from 'react';
import Visualizer from './Visualizer'; 
import { HelpButtonAleatorioAtributos } from './HelpButtonAleatorioAtributos';
import { exportarMuestraAtributos, descargarExcelDesdeBase64 } from '@/lib/atributosExcelService';
import { useLogAtributos } from '@/contexts/LogContextAtributos'; // ✅ Añadir import

type ExcelRow = { [key: string]: any };

// ✅ INTERFACE SIMPLIFICADA
type AleatorioProps = {
    isPlanificacionDone: boolean;
    excelData: ExcelRow[];
    headers: string[];
    randomSample: ExcelRow[];
    isAleatorioDone: boolean;
    calculatedSampleSize: number;
    handleCreateRandomSample: (sampleSize: number, seed: number) => void;
    handleClose: () => void;
    handleHelp: () => void;
    handleExportToExcel: () => void;
    semillaCalculada?: number;
    isExportDone?: boolean;
    onOpenHistory: () => void; // ✅ NUEVA PROP PARA HISTORIAL
};

const Aleatorio: React.FC<AleatorioProps> = ({
    isPlanificacionDone,
    excelData,
    headers,
    randomSample,
    isAleatorioDone,
    calculatedSampleSize,
    handleCreateRandomSample,
    handleClose,
    handleHelp,
    handleExportToExcel,
    isExportDone = false,
    semillaCalculada,
    onOpenHistory, // ✅ NUEVA PROP
}) => {
    // ✅ CONTEXTO DE LOGS
    const { addLog } = useLogAtributos();

    // ✅ ESTADOS LOCALES SIMPLES
    const [numRecordsToSelect, setNumRecordsToSelect] = useState(0);
    const [allowDuplicates, setAllowDuplicates] = useState(false);
    const [outputFileName, setOutputFileName] = useState("muestra_aleatoria");
    const [startRandomNumber, setStartRandomNumber] = useState(
        semillaCalculada || 123456789
    );

    // ✅ FUNCIÓN MEJORADA PARA EXPORTAR CON LOGS
    const handleExportToExcelReal = () => {
        if (randomSample.length === 0) {
            alert("No hay muestra para exportar.");
            return;
        }

        try {
            // ✅ LOG ANTES DE EXPORTAR
            addLog(
                'Usuario inició exportación de muestra',
                `Parámetros:\n- Tamaño muestra: ${randomSample.length}\n- Semilla: ${startRandomNumber}\n- Población: ${excelData.length}\n- Duplicados: ${allowDuplicates}\n- Nombre archivo: ${outputFileName}`,
                'aleatorio',
                'user'
            );

            // 1. GENERAR EXCEL
            const { base64, filename } = exportarMuestraAtributos({
                randomSample,
                sampleSize: randomSample.length,
                seed: startRandomNumber,
                populationSize: excelData.length,
                allowDuplicates: allowDuplicates,
                outputFileName: outputFileName || 'muestra_aleatoria'
            });

            // 2. DESCARGAR ARCHIVO
            const success = descargarExcelDesdeBase64(base64, filename);
            
            if (success) {
                // ✅ LOG DE ÉXITO
                addLog(
                    'Muestra exportada exitosamente',
                    `Archivo: ${filename}\nRegistros exportados: ${randomSample.length}\nAvanzando a módulo de evaluación`,
                    'aleatorio',
                    'system'
                );

                // 3. ACTUALIZAR ESTADO
                handleExportToExcel();
                
                alert(`✅ Muestra exportada exitosamente:\n${filename}\n\nAhora puedes avanzar al siguiente paso.`);
            } else {
                throw new Error("Error en la descarga del archivo");
            }
            
        } catch (error) {
            console.error("❌ Error al exportar a Excel:", error);
            
            // ✅ LOG DE ERROR
            addLog(
                'Error al exportar muestra a Excel',
                `Error: ${error}\nTamaño muestra: ${randomSample.length}`,
                'aleatorio',
                'error'
            );
            
            alert("Error al exportar la muestra a Excel: " + error);
        }
    };

    // ✅ INICIALIZAR CON calculatedSampleSize DE LA PLANIFICACIÓN
    useEffect(() => {
        if (calculatedSampleSize > 0) {
            setNumRecordsToSelect(calculatedSampleSize);
            
            // ✅ LOG DE INICIALIZACIÓN
            addLog(
                'Parámetros inicializados desde planificación',
                `Tamaño muestra planificado: ${calculatedSampleSize}\nSemilla: ${semillaCalculada || 'por defecto'}`,
                'aleatorio',
                'system'
            );
        } else if (excelData.length > 0) {
            // Fallback si no hay calculatedSampleSize
            const fallbackSize = Math.min(50, excelData.length);
            setNumRecordsToSelect(fallbackSize);
        }
    }, [calculatedSampleSize, excelData]);

    // ✅ FUNCIÓN MEJORADA PARA GENERAR MUESTRA CON LOGS
    const handleGenerateSample = () => {
        if (!isFormValid) {
            addLog(
                'Intento de generar muestra con parámetros inválidos',
                `Validación falló:\n- Registros a seleccionar: ${numRecordsToSelect}\n- Máximo permitido: ${excelData.length}\n- Nombre archivo: ${outputFileName}`,
                'aleatorio',
                'user'
            );
            return;
        }
        
        // ✅ LOG ANTES DE GENERAR
        addLog(
            'Usuario generó muestra aleatoria',
            `Parámetros:\n- Registros a seleccionar: ${numRecordsToSelect}\n- Semilla: ${startRandomNumber}\n- Duplicados: ${allowDuplicates}\n- Población total: ${excelData.length}`,
            'aleatorio',
            'user'
        );

        // ✅ Pasar el tamaño de muestra seleccionado al handler
        handleCreateRandomSample(numRecordsToSelect, startRandomNumber);
    };

    // ✅ FUNCIONES MEJORADAS PARA CAMBIOS DE PARÁMETROS
    const handleRecordsChange = (value: number) => {
        const newValue = Math.max(1, Number(value));
        setNumRecordsToSelect(newValue);
        
        addLog(
            'Usuario modificó número de registros',
            `Nuevo valor: ${newValue}\nMáximo permitido: ${excelData.length}`,
            'aleatorio',
            'user'
        );
    };

    const handleSeedChange = (value: number) => {
        const newValue = Math.max(1, Number(value));
        setStartRandomNumber(newValue);
        
        addLog(
            'Usuario modificó semilla aleatoria',
            `Nueva semilla: ${newValue}`,
            'aleatorio',
            'user'
        );
    };

    const handleDuplicatesChange = (checked: boolean) => {
        setAllowDuplicates(checked);
        
        addLog(
            'Usuario modificó permitir duplicados',
            `Nuevo valor: ${checked ? 'SÍ' : 'NO'}`,
            'aleatorio',
            'user'
        );
    };

    // ✅ VALIDACIÓN SIMPLE
    const isFormValid = numRecordsToSelect > 0 && 
                       numRecordsToSelect <= excelData.length && 
                       outputFileName.trim() !== '';

    // ✅ MANEJO MEJORADO DE NOMBRE DE ARCHIVO CON LOGS
    const handleFileNameChange = (value: string) => {
        const cleanedValue = value.replace(/[^a-zA-Z0-9\s\-_]/g, '').slice(0, 100);
        setOutputFileName(cleanedValue);
        
        if (value !== cleanedValue) {
            addLog(
                'Usuario modificó nombre de archivo',
                `Nombre limpio: ${cleanedValue}\nOriginal: ${value}`,
                'aleatorio',
                'user'
            );
        }
    };

    // ✅ FUNCIÓN MEJORADA PARA CERRAR CON LOGS
    const handleCloseWithLog = () => {
        addLog(
            'Usuario cerró módulo de muestreo aleatorio',
            `Estado actual:\n- Muestra generada: ${isAleatorioDone}\n- Registros en muestra: ${randomSample.length}`,
            'aleatorio',
            'user'
        );
        handleClose();
    };

    if (!isPlanificacionDone) {
        return (
            <div className="p-4 text-center text-gray-500">
                Debes completar el paso de Planificación primero.
            </div>
        );
    }

    return (
        <div className="flex space-x-6 p-4 h-[calc(100vh-80px)]"> 
            {/* Columna Izquierda: Formulario y Tabla de Resultados */}
            <div className="flex-1 space-y-6 overflow-y-auto pr-2"> 
                {/* Contenedor del Formulario */}
                <div className="bg-white p-6 rounded-lg shadow-md flex-shrink-0">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-800">Generación de Muestra Aleatoria</h3>
                        <div className="flex items-center gap-2">
                            <HelpButtonAleatorioAtributos context="general" />
                        </div>
                    </div>

                    {/* Información del dataset */}
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-700">
                            <strong>Dataset disponible:</strong> {excelData.length} registros totales
                        </p>
                    </div>
                    
                    <div className="mb-4">
                        <div className="flex items-center gap-2 mb-3">
                            <h4 className="text-lg font-semibold">Parámetros de la Muestra</h4>
                            <HelpButtonAleatorioAtributos context="parameters" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            {/* Número de registros */}
                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-gray-700">
                                    Número de registros a seleccionar:
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max={excelData.length}
                                    value={numRecordsToSelect}
                                    onChange={(e) => handleRecordsChange(Number(e.target.value))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                />
                                <span className="text-xs text-gray-500 mt-1">
                                    Máximo: {excelData.length} registros
                                </span>
                            </div>

                            {/* Semilla aleatoria */}
                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-gray-700">
                                    Semilla aleatoria:
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={startRandomNumber}
                                    onChange={(e) => handleSeedChange(Number(e.target.value))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                />
                                <span className="text-xs text-gray-500 mt-1">
                                    Misma semilla = misma muestra
                                </span>
                            </div>

                            {/* Duplicados */}
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={allowDuplicates}
                                    onChange={(e) => handleDuplicatesChange(e.target.checked)}
                                    className="form-checkbox h-5 w-5 text-blue-600"
                                />
                                <label className="ml-2 text-sm font-medium text-gray-700">
                                    Permitir duplicados
                                </label>
                            </div>

                            {/* Nombre del archivo */}
                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-gray-700">
                                    Nombre del archivo:
                                </label>
                                <input
                                    type="text"
                                    value={outputFileName}
                                    onChange={(e) => handleFileNameChange(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                />
                                <span className="text-xs text-gray-500 mt-1">
                                    Se agregará .xlsx automáticamente
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contenedor del Visualizer */}
                <div className="bg-white p-6 rounded-lg shadow-md flex-1 min-h-0 flex flex-col">
                    {isAleatorioDone && randomSample.length > 0 ? (
                        <div className="flex flex-col flex-1 min-h-0">
                            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                                <h4 className="text-lg font-bold">Muestra Aleatoria Generada</h4>
                                <HelpButtonAleatorioAtributos context="results" />
                            </div>
                            <div className="flex-1 min-h-0 overflow-auto">
                                <Visualizer 
                                    excelData={randomSample} 
                                    headers={headers} 
                                />
                            </div>
                        </div>
                    ) : (
                        isAleatorioDone && (
                            <div className="text-center text-gray-500 py-10">
                                No hay datos en la muestra generada.
                            </div>
                        )
                    )}
                </div>
            </div>
            
            {/* Columna Derecha: Botones de Acción */}
            <div className="w-48 flex-none flex flex-col space-y-4 mt-2">
                {/* ✅ BOTÓN GENERAR MUESTRA CON LOGS */}
                <button
                    onClick={handleGenerateSample}
                    disabled={!isFormValid}
                    className={`font-semibold py-2 px-4 rounded shadow transition-colors ${
                        !isFormValid 
                            ? "bg-gray-400 text-gray-700 cursor-not-allowed" 
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                >
                    Generar Muestra
                </button>
                
                {/* ✅ BOTÓN EXPORTAR CON LOGS */}
                <button
                    onClick={handleExportToExcelReal}
                    disabled={!isAleatorioDone || randomSample.length === 0}
                    className={`font-semibold py-2 px-4 rounded shadow transition-colors ${
                        !isAleatorioDone || randomSample.length === 0 
                            ? "bg-gray-400 text-gray-700 cursor-not-allowed" 
                            : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                >
                    Guardar en Excel
                </button>
                
                {/* ✅ BOTÓN CERRAR CON LOGS */}
                <button
                    onClick={handleCloseWithLog}
                    className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded shadow transition-colors"
                >
                    Cerrar
                </button>
                
                {/* ✅ BOTÓN HISTORIAL */}
                <button
                    onClick={onOpenHistory}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded shadow transition-colors"
                >
                    Ver Historial
                </button>
                
                <HelpButtonAleatorioAtributos 
                    context="general" 
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-full shadow transition-colors" 
                />
            </div>
        </div>
    );
};

export default Aleatorio;