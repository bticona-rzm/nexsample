// /app/dashboard/atributos/components/Aleatorio.tsx

import React from 'react';

import Visualizer from './Visualizer'; 

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
    handleExportToExcel, // <== Desestructurar
}) => {
    // Si la planificación no está lista, muestra un mensaje
    if (!isPlanificacionDone) {
        return (
            <div className="p-4 text-center text-gray-500">
                Debes completar el paso de Planificación primero.
            </div>
        );
    }

    return (
        // 1. Contenedor principal: Usamos FLEX para las dos columnas.
        // 2. Definimos la altura a la altura visible de la pantalla (view height) 
        //    menos la altura de tu barra de navegación/cabecera (asumimos 80px).
        // 3. Agregamos overflow-y-auto aquí para el scroll general de todo el contenido si es necesario.
        <div className="flex space-x-6 p-4 h-[calc(100vh-80px)]"> 
            
            {/* Columna Izquierda: Formulario y Tabla de Resultados */}
            {/* Usamos flex-1 para que ocupe todo el espacio disponible y overflow-y-auto 
                para que tenga su propio scroll si el contenido se desborda */}
            <div className="flex-1 space-y-6 overflow-y-auto pr-2"> 
                
                {/* Contenedor del Formulario (altura fija) */}
                <div className="bg-white p-6 rounded-lg shadow-md flex-shrink-0">
                    <h3 className="text-xl font-bold mb-4 text-gray-800">Generación de Muestra Aleatoria</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                        {/* ... (Controles del formulario) ... */}
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700">Número de registros a seleccionar:</label>
                            <input
                                type="number"
                                min="1"
                                value={numRecordsToSelect}
                                onChange={(e) => setNumRecordsToSelect(Number(e.target.value))}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700">Semilla (Número aleatorio inicial):</label>
                            <input
                                type="number"
                                min="1"
                                value={startRandomNumber}
                                onChange={(e) => setStartRandomNumber(Number(e.target.value))}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700">Registro inicial:</label>
                            <input
                                type="number"
                                min="1"
                                value={startRecordToSelect}
                                onChange={(e) => setStartRecordToSelect(Number(e.target.value))}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700">Registro final:</label>
                            <input
                                type="number"
                                min="1"
                                value={endRecordToSelect}
                                onChange={(e) => setEndRecordToSelect(Number(e.target.value))}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                checked={allowDuplicates}
                                onChange={(e) => setAllowDuplicates(e.target.checked)}
                                className="form-checkbox h-5 w-5 text-blue-600"
                            />
                            <label className="ml-2 text-sm font-medium text-gray-700">Permitir duplicados</label>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700">Nombre del archivo de salida (.xlsx):</label>
                            <input
                                type="text"
                                value={outputFileName}
                                onChange={(e) => setOutputFileName(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                placeholder="Ej: Muestra Aleatoria"
                            />
                        </div>
                    </div>
                </div>

                {/* Contenedor del Visualizer: Usamos FLEX y ALTURA TOTAL para que ocupe el resto del espacio */}
                <div className="bg-white p-6 rounded-lg shadow-md flex-1 min-h-0 flex flex-col">
                    {isAleatorioDone && randomSample.length > 0 ? (
                        <div className="flex flex-col flex-1 min-h-0">
                            <h4 className="text-lg font-bold mb-2 flex-shrink-0">Muestra Aleatoria Generada</h4>
                            {/* El Visualizer debe usar el espacio restante y permitir scroll horizontal/vertical */}
                            <div className="flex-1 min-h-0 overflow-auto">
                                <Visualizer 
                                    excelData={randomSample} 
                                    headers={headers} 
                                />
                            </div>
                        </div>
                    ) : (
                        isAleatorioDone && <div className="text-center text-gray-500 py-10">No hay datos en la muestra generada.</div>
                    )}
                </div>
            </div>
            
            {/* Columna Derecha: Botones de Acción */}
            {/* Mantener w-48 y flex-none para que no se encoja */}
            <div className="w-48 flex-none flex flex-col space-y-4 mt-2">
                <button
                    onClick={handleCreateRandomSample}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded shadow"
                >
                    Generar Muestra
                </button>
                <button
                    onClick={handleExportToExcel}
                    disabled={!isAleatorioDone || randomSample.length === 0}
                    className={`font-semibold py-2 px-4 rounded shadow ${!isAleatorioDone || randomSample.length === 0 ? "bg-gray-400 text-gray-700 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 text-white"}`}
                >
                    Guardar en Excel
                </button>
                <button
                    onClick={handleFields}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded shadow"
                >
                    Campos
                </button>
                <button
                    onClick={handleClose}
                    className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded shadow"
                >
                    Cerrar
                </button>
                <button
                    onClick={handleHelp}
                    className="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-full shadow"
                >
                    ? Ayuda
                </button>
            </div>
        </div>
    );
};

export default Aleatorio;