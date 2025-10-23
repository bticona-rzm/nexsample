// /app/dashboard/atributos/components/Aleatorio.tsx
import React, { useState, useEffect } from 'react';
import Visualizer from './Visualizer'; 
import { HelpButtonAleatorioAtributos } from './HelpButtonAleatorioAtributos';

type ExcelRow = { [key: string]: any };

type AleatorioProps = {
    isPlanificacionDone: boolean;
    excelData: ExcelRow[];
    headers: string[];
    randomSample: ExcelRow[];
    isAleatorioDone: boolean;
    numRecordsToSelect: number;
    startRandomNumber: number;
    startRecordToSelect: number;
    endRecordToSelect: number;
    allowDuplicates: boolean;
    outputFileName: string;
    setNumRecordsToSelect: (value: number) => void;
    setStartRandomNumber: (value: number) => void;
    setStartRecordToSelect: (value: number) => void;
    setEndRecordToSelect: (value: number) => void;
    setAllowDuplicates: (value: boolean) => void;
    setOutputFileName: (value: string) => void;
    handleCreateRandomSample: () => void;
    handleFields: () => void;
    handleClose: () => void;
    handleHelp: () => void;
    handleExportToExcel: () => void;
};

const Aleatorio: React.FC<AleatorioProps> = ({
    isPlanificacionDone,
    excelData,
    headers,
    randomSample,
    isAleatorioDone,
    numRecordsToSelect,
    startRandomNumber,
    startRecordToSelect,
    endRecordToSelect,
    allowDuplicates,
    outputFileName,
    setNumRecordsToSelect,
    setStartRandomNumber,
    setStartRecordToSelect,
    setEndRecordToSelect,
    setAllowDuplicates,
    setOutputFileName,
    handleCreateRandomSample,
    handleFields,
    handleClose,
    handleHelp,
    handleExportToExcel,
}) => {
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [isFormValid, setIsFormValid] = useState(false);

    // Función de validación
    const validateForm = () => {
        const errors: string[] = [];

        // 1. Validar número de registros
        if (!numRecordsToSelect || numRecordsToSelect <= 0) {
            errors.push("El número de registros debe ser mayor a 0");
        } else if (numRecordsToSelect > 10000) {
            errors.push("El número de registros no puede ser mayor a 10,000");
        }

        // 2. Validar semilla aleatoria
        if (!startRandomNumber || startRandomNumber <= 0) {
            errors.push("La semilla aleatoria debe ser mayor a 0");
        }

        // 3. Validar rango de registros
        if (!startRecordToSelect || startRecordToSelect <= 0) {
            errors.push("El registro inicial debe ser mayor a 0");
        }

        if (!endRecordToSelect || endRecordToSelect <= 0) {
            errors.push("El registro final debe ser mayor a 0");
        }

        if (startRecordToSelect > endRecordToSelect) {
            errors.push("El registro inicial no puede ser mayor al registro final");
        }

        // 4. Validar que el rango no exceda los datos disponibles
        const maxAvailableRecords = excelData.length;
        if (endRecordToSelect > maxAvailableRecords) {
            errors.push(`El registro final (${endRecordToSelect}) excede los registros disponibles (${maxAvailableRecords})`);
        }

        // 5. Validar duplicados vs rango disponible
        if (!allowDuplicates && numRecordsToSelect > (endRecordToSelect - startRecordToSelect + 1)) {
            errors.push(`No se pueden seleccionar ${numRecordsToSelect} registros sin duplicados en un rango de ${endRecordToSelect - startRecordToSelect + 1} registros`);
        }

        // 6. Validar nombre del archivo
        if (!outputFileName.trim()) {
            errors.push("El nombre del archivo es requerido");
        } else if (outputFileName.length > 100) {
            errors.push("El nombre del archivo no puede tener más de 100 caracteres");
        } else if (!/^[a-zA-Z0-9\s\-_]+$/.test(outputFileName)) {
            errors.push("El nombre del archivo solo puede contener letras, números, espacios, guiones y guiones bajos");
        }

        setValidationErrors(errors);
        setIsFormValid(errors.length === 0);
    };

    // Validar automáticamente cuando cambien los valores
    useEffect(() => {
        validateForm();
    }, [
        numRecordsToSelect,
        startRandomNumber,
        startRecordToSelect,
        endRecordToSelect,
        allowDuplicates,
        outputFileName,
        excelData.length
    ]);

    // Función para manejar el envío con validación
    const handleGenerateSample = () => {
        validateForm();
        
        if (!isFormValid) {
            // Mostrar el primer error como alerta
            if (validationErrors.length > 0) {
                alert(`Error: ${validationErrors[0]}`);
            }
            return;
        }

        handleCreateRandomSample();
    };

    // Función para formatear nombre de archivo automáticamente
    const handleFileNameChange = (value: string) => {
        // Remover caracteres inválidos y limitar longitud
        const cleanedValue = value.replace(/[^a-zA-Z0-9\s\-_]/g, '').slice(0, 100);
        setOutputFileName(cleanedValue);
    };

    // Función para establecer automáticamente el rango completo
    const setFullRange = () => {
        setStartRecordToSelect(1);
        setEndRecordToSelect(excelData.length);
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
                
                {/* Contenedor del Formulario con ayuda */}
                <div className="bg-white p-6 rounded-lg shadow-md flex-shrink-0">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-800">Generación de Muestra Aleatoria</h3>
                        <HelpButtonAleatorioAtributos context="general" />
                    </div>

                    {/* Indicador de validación */}
                    {validationErrors.length > 0 && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center">
                                <span className="text-red-500 font-medium">Corrige los siguientes errores:</span>
                            </div>
                            <ul className="mt-2 text-sm text-red-600 list-disc list-inside">
                                {validationErrors.slice(0, 3).map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                                {validationErrors.length > 3 && (
                                    <li>... y {validationErrors.length - 3} error(es) más</li>
                                )}
                            </ul>
                        </div>
                    )}

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
                                    <span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="10000"
                                    value={numRecordsToSelect}
                                    onChange={(e) => setNumRecordsToSelect(Math.max(1, Number(e.target.value)))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                    placeholder="Ej: 50"
                                />
                                <span className="text-xs text-gray-500 mt-1">
                                    Máximo: 10,000 registros
                                </span>
                            </div>

                            {/* Semilla aleatoria */}
                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-gray-700">
                                    Semilla (Número aleatorio inicial):
                                    <span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={startRandomNumber}
                                    onChange={(e) => setStartRandomNumber(Math.max(1, Number(e.target.value)))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                    placeholder="Ej: 12345"
                                />
                                <span className="text-xs text-gray-500 mt-1">
                                    Misma semilla = misma muestra
                                </span>
                            </div>

                            {/* Rango de registros */}
                            <div className="flex flex-col">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-gray-700">
                                        Registro inicial:
                                        <span className="text-red-500 ml-1">*</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={setFullRange}
                                        className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
                                    >
                                        Usar rango completo
                                    </button>
                                </div>
                                <input
                                    type="number"
                                    min="1"
                                    max={excelData.length}
                                    value={startRecordToSelect}
                                    onChange={(e) => setStartRecordToSelect(Math.max(1, Number(e.target.value)))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                />
                                <span className="text-xs text-gray-500 mt-1">
                                    Mín: 1, Máx: {excelData.length}
                                </span>
                            </div>

                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-gray-700">
                                    Registro final:
                                    <span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max={excelData.length}
                                    value={endRecordToSelect}
                                    onChange={(e) => setEndRecordToSelect(Math.min(excelData.length, Math.max(1, Number(e.target.value))))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                />
                                <span className="text-xs text-gray-500 mt-1">
                                    Mín: 1, Máx: {excelData.length}
                                </span>
                            </div>

                            {/* Duplicados */}
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={allowDuplicates}
                                    onChange={(e) => setAllowDuplicates(e.target.checked)}
                                    className="form-checkbox h-5 w-5 text-blue-600"
                                />
                                <label className="ml-2 text-sm font-medium text-gray-700">
                                    Permitir duplicados
                                </label>
                            </div>

                            {/* Nombre del archivo */}
                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-gray-700">
                                    Nombre del archivo de salida:
                                    <span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={outputFileName}
                                    onChange={(e) => handleFileNameChange(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                    placeholder="Ej: Muestra_Aleatoria"
                                />
                                <span className="text-xs text-gray-500 mt-1">
                                    Se agregará automáticamente .xlsx
                                </span>
                            </div>
                        </div>

                        {/* Resumen de validación */}
                        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <p className="text-sm text-gray-700">
                                <strong>Rango seleccionado:</strong> {startRecordToSelect} - {endRecordToSelect} 
                                ({endRecordToSelect - startRecordToSelect + 1} registros disponibles)
                            </p>
                            {!allowDuplicates && (
                                <p className="text-sm text-gray-700 mt-1">
                                    <strong>Máximo sin duplicados:</strong> {endRecordToSelect - startRecordToSelect + 1} registros
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Contenedor del Visualizer con ayuda */}
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
                <button
                    onClick={handleGenerateSample}
                    disabled={!isFormValid}
                    className={`font-semibold py-2 px-4 rounded shadow transition-colors ${
                        !isFormValid 
                            ? "bg-gray-400 text-gray-700 cursor-not-allowed" 
                            : "bg-purple-600 hover:bg-purple-700 text-white"
                    }`}
                >
                    Generar Muestra
                </button>
                <button
                    onClick={handleExportToExcel}
                    disabled={!isAleatorioDone || randomSample.length === 0}
                    className={`font-semibold py-2 px-4 rounded shadow transition-colors ${
                        !isAleatorioDone || randomSample.length === 0 
                            ? "bg-gray-400 text-gray-700 cursor-not-allowed" 
                            : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                >
                    Guardar en Excel
                </button>
                <button
                    onClick={handleFields}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded shadow transition-colors"
                >
                    Campos
                </button>
                <button
                    onClick={handleClose}
                    className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded shadow transition-colors"
                >
                    Cerrar
                </button>
                <HelpButtonAleatorioAtributos 
                    context="general" 
                    className="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-full shadow transition-colors" 
                />
            </div>
        </div>
    );
};

export default Aleatorio;