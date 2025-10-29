// /app/dashboard/atributos/components/Visualizer.tsx
import React, { useMemo } from 'react';

import {
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel,
    flexRender,
    ColumnDef,
} from '@tanstack/react-table';

type ExcelRow = { [key: string]: any };

type VisualizerProps = {
    excelData: ExcelRow[];
    headers: string[];
};

const Visualizer: React.FC<VisualizerProps> = ({ excelData, headers}) => {
    // COMPROBACIÓN RÁPIDA AL INICIO
    if (!headers || !excelData || excelData.length === 0) {
        return (
            <div className="text-center text-gray-500 py-10 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                <div className="inline-block p-4 bg-white rounded-full shadow-sm mb-4">
                    <span className="text-2xl">📊</span>
                </div>
                <p className="text-lg font-medium text-gray-600">No hay datos para visualizar</p>
                <p className="text-sm text-gray-500 mt-1">Por favor, carga un archivo Excel</p>
            </div>
        );
    }

    const columns = useMemo<ColumnDef<ExcelRow>[]>(() => {
        if (!headers || headers.length === 0) { 
            return [];
        }
        return headers.map((header) => ({
            accessorKey: header,
            header: () => (
                <span className="capitalize font-semibold text-gray-700 tracking-wide">
                    {header}
                </span>
            ),
            cell: (info) => (
                <span className="text-gray-600 font-medium">
                    {info.getValue() as string}
                </span>
            ),
        }));
    }, [headers]);

    const table = useReactTable({
        data: excelData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl shadow-lg border border-blue-100">
            {/* Header con efecto visual */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg shadow-sm">
                        <span className="text-blue-600 text-lg">📋</span>
                    </div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Datos del Archivo
                    </h3>
                </div>
                <div className="px-3 py-1 bg-white rounded-full shadow-sm border border-blue-200">
                    <span className="text-sm font-medium text-blue-600">
                        {excelData.length} registros
                    </span>
                </div>
            </div>

            {excelData.length > 0 ? (
                <div className="flex flex-col">
                    {/* Contenedor de tabla con efectos visuales */}
                    <div className="overflow-x-auto bg-white rounded-xl shadow-lg border border-gray-200 mb-6 hover:shadow-xl transition-all duration-300">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <tr key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <th 
                                                key={header.id} 
                                                className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-blue-200"
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-blue-500 text-xs">●</span>
                                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                ))}
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {table.getRowModel().rows.map((row, index) => (
                                    <tr 
                                        key={row.id} 
                                        className={`
                                            transition-all duration-200 hover:bg-blue-50 hover:scale-[1.002]
                                            ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                                        `}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <td 
                                                key={cell.id} 
                                                className="px-6 py-4 whitespace-nowrap text-sm border-r border-gray-100 last:border-r-0"
                                            >
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/*Controles de paginación mejorados - REEMPLAZAR esta sección*/}
                    <div className="flex justify-between items-center px-2">
                        <button
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-50 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                        >
                            <span className="text-gray-600">←</span>
                            <span className="font-medium text-gray-700">Anterior</span>
                        </button>
                        
                        <div className="flex items-center space-x-2">
                            {/* Botón primera página */}
                            <button
                                onClick={() => table.setPageIndex(0)}
                                disabled={!table.getCanPreviousPage()}
                                className="w-8 h-8 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 bg-gray-100 text-gray-600 hover:bg-gray-200"
                                title="Primera página"
                            >
                                «
                            </button>

                            {/* Páginas dinámicas */}
                            {(() => {
                                const currentPage = table.getState().pagination.pageIndex;
                                const totalPages = table.getPageCount();
                                const pages = [];
                                
                                // Siempre mostrar primera página
                                if (currentPage > 2) {
                                    pages.push(1);
                                    if (currentPage > 3) pages.push('...');
                                }
                                
                                // Páginas alrededor de la actual
                                for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages - 2, currentPage + 1); i++) {
                                    pages.push(i + 1);
                                }
                                
                                // Siempre mostrar última página
                                if (currentPage < totalPages - 3) {
                                    if (currentPage < totalPages - 4) pages.push('...');
                                    pages.push(totalPages);
                                } else if (totalPages > 1) {
                                    // Si estamos cerca del final, mostrar las últimas páginas
                                    for (let i = Math.max(totalPages - 3, currentPage - 1); i < totalPages; i++) {
                                        if (i > currentPage + 1 && pages.length < 5) pages.push(i + 1);
                                    }
                                }
                                
                                return pages.map((page, index) =>
                                    page === '...' ? (
                                        <span key={`ellipsis-${index}`} className="w-8 h-8 flex items-center justify-center text-gray-400">
                                            ...
                                        </span>
                                    ) : (
                                        <button
                                            key={page}
                                            onClick={() => table.setPageIndex(Number(page) - 1)}
                                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-all duration-200 ${
                                                currentPage + 1 === page
                                                    ? 'bg-blue-600 text-white shadow-md'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    )
                                );
                            })()}

                            {/* Botón última página */}
                            <button
                                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                                disabled={!table.getCanNextPage()}
                                className="w-8 h-8 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 bg-gray-100 text-gray-600 hover:bg-gray-200"
                                title="Última página"
                            >
                                »
                            </button>
                        </div>

                        <button
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-50 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                        >
                            <span className="font-medium text-gray-700">Siguiente</span>
                            <span className="text-gray-600">→</span>
                        </button>
                    </div>

                    {/* Información adicional */}
                    <div className="mt-4 text-center">
                        <p className="text-xs text-gray-500 bg-white/50 rounded-full px-3 py-1 inline-block">
                            📊 Mostrando {table.getRowModel().rows.length} de {excelData.length} registros
                        </p>
                    </div>
                </div>
            ) : (
                <div className="text-center text-gray-500 py-10 bg-white rounded-lg border-2 border-dashed border-gray-300">
                    <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
                        <span className="text-2xl">📁</span>
                    </div>
                    <p className="text-lg font-medium text-gray-600">No hay datos para mostrar</p>
                    <p className="text-sm text-gray-500 mt-1">Los datos aparecerán aquí después de cargar un archivo</p>
                </div>
            )}
        </div>
    );
};

export default Visualizer;