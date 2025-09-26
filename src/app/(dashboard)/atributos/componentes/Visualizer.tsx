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

const Visualizer: React.FC<VisualizerProps> = ({ excelData, headers }) => {
    // COMPROBACIÓN RÁPIDA AL INICIO
    if (!headers || !excelData || excelData.length === 0) {
        return (
            <div className="text-center text-gray-500 py-10">
                No hay datos de archivo para visualizar. Por favor, carga un archivo Excel.
            </div>
        );
    }
    const columns = useMemo<ColumnDef<ExcelRow>[]>(() => {
        // AÑADIR ESTA VERIFICACIÓN
        if (!headers || headers.length === 0) {
            return []; // Devuelve un array vacío si no hay headers
        }
        return headers.map((header) => ({
            accessorKey: header,
            header: () => <span className="capitalize">{header}</span>,
            cell: (info) => <span>{info.getValue() as string}</span>,
        }));
    }, [headers]); // useMemo ahora está protegido contra 'undefined'

    const table = useReactTable({
        data: excelData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    return (
        <div className="p-4">
            <h3 className="text-xl font-bold mb-4">Datos del Archivo</h3>

            {excelData.length > 0 ? (
                <div className="overflow-x-auto bg-white rounded-lg shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <th key={header.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {table.getRowModel().rows.map((row) => (
                                <tr key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Controles de paginación */}
                    <div className="flex justify-between items-center mt-4">
                        <button
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                        >
                            Anterior
                        </button>
                        <span>
                            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
                        </span>
                        <button
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            ) : (
                <div className="text-center text-gray-500 py-10">
                    No hay datos de archivo para visualizar. Por favor, carga un archivo Excel.
                </div>
            )}
        </div>
    );
};

export default Visualizer;