"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Registro = Record<string, any>;

export default function DataPreview({ data }: { data: Registro[] }) {
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const totalPages = Math.ceil(data.length / rowsPerPage);

  const currentRows = data.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  return (
    <div className="mt-6 ">
      <h3 className="text-lg font-semibold mb-4">Datos del Archivo</h3>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              {Object.keys(data[0]).map((col) => (
                <th
                  key={col}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentRows.map((row, i) => (
              <tr
                key={i}
                className={`${
                  i % 2 === 0 ? "" : ""
                } hover:bg-gray-50 transition-colors`}
              >
                {Object.values(row).map((val, j) => (
                  <td key={j} className="px-6 py-4 whitespace-nowrap text-sm  text-gray-500">
                    {String(val)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
        {/* Paginación */}
        <div className="flex items-center justify-between mt-4 mb-10">
            {/* Botón Anterior */}
            <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className={`flex items-center gap-2 px-4 py-2 rounded font-medium transition ${
                page === 1
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-[#e7b952] text-white hover:bg-[#edc977]"
                }`}
            >
                <ChevronLeft size={18} />
                Anterior
            </button>

            {/* Texto */}
            <span className="text-gray-700 font-medium">
                Página {page} de {totalPages}
            </span>

            {/* Botón Siguiente */}
            <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className={`flex items-center gap-2 px-4 py-2 rounded font-medium transition ${
                page === totalPages
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-[#e7b952] text-white hover:bg-[#edc977]"
                }`}
            >
                Siguiente
                <ChevronRight size={18} />
            </button>
        </div>
    </div>
  );
}
