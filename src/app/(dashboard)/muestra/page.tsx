"use client";
import { useState, useEffect } from "react";
import { FileBarChart, Download, History, Upload, Printer } from "lucide-react";
import { useSession } from "next-auth/react";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  SortingState
} from "@tanstack/react-table";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Settings } from "lucide-react";


type SampleParams = {
  records: number;
  seed: number;
  start: number;
  end: number;
  allowDuplicates: boolean;
  fileName: string;
  totalRows?: number;
};
const DEFAULT_SAMPLE_PARAMS: SampleParams = {
  records: 0,
  seed: 0,
  start: 1,
  end: 100,
  allowDuplicates: false,
  fileName: "",
  totalRows: 0,        //  NUEVO
};
type HistorialState = {
  imports: any[];
  muestras: any[];
  exports: any[];
};

const NO_SPIN_CSS = `
  /* hide number input spinners for webkit and firefox */
  .no-spin::-webkit-outer-spin-button,
  .no-spin::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .no-spin {
    -moz-appearance: textfield;
  }
`;
const PROGRESS_CSS = `
  .progress-bar {
    background: linear-gradient(90deg, #3b82f6, #60a5fa, #3b82f6);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite linear;
  }
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

const TablaGenerica = ({ rows, columns }: { rows: any[]; columns?: string[] }) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const filasPorPagina = 10;

  useEffect(() => {
    setPaginaActual(1);
  }, [rows]);

  const columnDefs =
    (columns && columns.length > 0 ? columns : rows.length > 0 ? Object.keys(rows[0]) : [])
      .map((col) => ({
        accessorKey: col,
        header: () => (
          <div className="flex items-center gap-1 cursor-pointer select-none">
            {col === "_POS_ORIGINAL" ? "Posición Original" : col}

            <span>
              {sorting.find((s) => s.id === col)?.desc === false && <ChevronUp size={14} />}
              {sorting.find((s) => s.id === col)?.desc === true && <ChevronDown size={14} />}
            </span>
          </div>
        ),
      }));

  const table = useReactTable({
    data: rows,
    columns: [
      {
        accessorKey: "__row_number",
        header: "Nro",
        cell: (info) => info.row.index + 1,
      },
      ...columnDefs,
    ],
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const sortedRows = table.getRowModel().rows.map((r) => r.original);
  const totalPaginas = Math.ceil(sortedRows.length / filasPorPagina);
  const filasActuales = sortedRows.slice(
    (paginaActual - 1) * filasPorPagina,
    paginaActual * filasPorPagina
  );

  // 🚫 SI NO HAY FILAS → NO RENDERIZAR TABLA
  if (!rows || rows.length === 0) {
    return (
      <div className="p-10 text-center text-gray-500 text-lg">
        Aún no se cargó ningún dataset.
        <br />
        📄 Cargue un archivo para visualizar la información.
      </div>
    );
  }
  return (
    <div className="bg-white rounded shadow-md">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              {table.getHeaderGroups()[0].headers.map((header) => (
                <th
                  key={header.id}
                  className="px-6  py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filasActuales.map((row, i) => (
              <tr
                key={i}
                className="hover:bg-gray-50 transition border-b border-gray-200"
                style={{ height: "48px" }} // ALTURA MÁS PROFESIONAL
              >
                {/* Columna NRO */}
                <td className="px-6 py-3 text-[15px] text-gray-700 font-medium">
                  {(paginaActual - 1) * filasPorPagina + i + 1}
                </td>

                {/* Columnas dinámicas */}
                {columnDefs.map((col, j) => {
                  const isWide =
                    col.accessorKey?.toLowerCase().includes("glosa") ||
                    col.accessorKey?.toLowerCase().includes("descripcion");

                  return (
                    <td
                      key={j}
                      className={`px-6 py-3 text-[15px] text-gray-700 ${isWide
                          ? "max-w-[350px] truncate hover:whitespace-normal"
                          : "max-w-[200px] truncate hover:whitespace-normal"
                        }`}
                      title={String(row[col.accessorKey] ?? "")} // tooltip texto completo
                    >
                      {String(row[col.accessorKey] ?? "")}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* === Paginación (MISMO DISEÑO, SOLO REORDENADA Y CON INPUT) === */}
      {sortedRows.length > filasPorPagina && (
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 rounded-b">

          {/* IZQUIERDA: Inicio + Anterior */}
          <div className="flex items-center gap-2">
            {/* Botón: Primera página */}
            <button
              onClick={() => setPaginaActual(1)}
              disabled={paginaActual === 1}
              className={`flex items-center gap-1 px-3 py-2 rounded font-medium transition ${paginaActual === 1
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-[#e7b952] text-white hover:bg-[#edc977]"
                }`}
            >
              ⏮
            </button>

            {/* Botón: Anterior */}
            <button
              onClick={() => setPaginaActual((p) => Math.max(p - 1, 1))}
              disabled={paginaActual === 1}
              className={`flex items-left gap-2 px-4 py-2 rounded font-medium transition ${paginaActual === 1
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-[#e7b952] text-white hover:bg-[#edc977]"
                }`}
            >
              Anterior
            </button>
          </div>

          {/* CENTRO: Página X de Y + Input para escribir página */}
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            Página

            <input
              type="number"
              min={1}
              max={totalPaginas}
              value={paginaActual}
              onChange={(e) => {
                let value = Number(e.target.value);
                if (!Number.isNaN(value)) {
                  value = Math.max(1, Math.min(totalPaginas, value));
                  setPaginaActual(value);
                }
              }}
              className="w-14 px-2 py-1 border rounded text-center"
            />

            de {totalPaginas}
          </div>

          {/* DERECHA: Siguiente + Última */}
          <div className="flex items-center gap-2">

            {/* Botón: Siguiente */}
            <button
              onClick={() => setPaginaActual((p) => Math.min(p + 1, totalPaginas))}
              disabled={paginaActual === totalPaginas}
              className={`flex items-center gap-2 px-4 py-2 rounded font-medium transition ${paginaActual === totalPaginas
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-[#e7b952] text-white hover:bg-[#edc977]"
                }`}
            >
              Siguiente
            </button>

            {/* Botón: Última página */}
            <button
              onClick={() => setPaginaActual(totalPaginas)}
              disabled={paginaActual === totalPaginas}
              className={`flex items-center gap-1 px-3 py-2 rounded font-medium transition ${paginaActual === totalPaginas
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-[#e7b952] text-white hover:bg-[#edc977]"
                }`}
            >
              ⏭
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
// === VISTA PRINCIPAL DEL HISTORIAL (3 TABS) ===
const HistorialTabs = ({ historial }: { historial: HistorialState }) => {
  const [tab, setTab] = useState<"imports" | "muestras" | "exports">("muestras");
  const [search, setSearch] = useState("");

  const norm = (s: any) =>
    (s ?? "").toString().trim().toLowerCase();

  const filteredImports = historial.imports.filter(item =>
    Object.values(item).some(val => norm(val).includes(norm(search)))
  );

  const filteredMuestras = historial.muestras.filter(item =>
    Object.values(item).some(val => norm(val).includes(norm(search)))
  );

  const filteredExports = historial.exports.filter(item =>
    Object.values(item).some(val => norm(val).includes(norm(search)))
  );

  return (
    <div className="mt-4 bg-white p-4 rounded shadow-md">

      {/* === BOTONES DE TABS === */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab("imports")}
          className={`px-4 py-2 rounded font-semibold ${
            tab === "imports" ? "bg-purple-800 text-white" : "bg-gray-200"
          }`}
        >
          Importaciones
        </button>

        <button
          onClick={() => setTab("muestras")}
          className={`px-4 py-2 rounded font-semibold ${
            tab === "muestras" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          Muestreos
        </button>

        <button
          onClick={() => setTab("exports")}
          className={`px-4 py-2 rounded font-semibold ${
            tab === "exports" ? "bg-green-600 text-white" : "bg-gray-200"
          }`}
        >
          Exportaciones
        </button>
      </div>

      {/* === BUSCADOR === */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre, usuario, archivo, hash..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring focus:ring-blue-300"
        />
      </div>

      {/* === TABLAS === */}
      {tab === "imports" && <TablaImportaciones rows={filteredImports} />}
      {tab === "muestras" && <TablaMuestreos rows={filteredMuestras} />}
      {tab === "exports" && <TablaExportaciones rows={filteredExports} />}
    </div>
  );
};

const TablaImportaciones = ({ rows }: { rows: any[] }) => (
  <div className="overflow-x-auto bg-white shadow-lg rounded-xl border border-gray-200">
    <table className="min-w-full text-sm">
      <thead className="bg-[#4c428f] text-white">
        <tr>
          <th className="px-6 py-3 text-left font-semibold">ARCHIVO</th>
          <th className="px-6 py-3 text-left font-semibold">FECHA</th>
          <th className="px-6 py-3 text-left font-semibold">TAMAÑO</th>
          <th className="px-6 py-3 text-left font-semibold">ORIGEN</th>
          <th className="px-6 py-3 text-left font-semibold">ENCABEZADOS</th>
          <th className="px-6 py-3 text-left font-semibold">REGISTROS</th>
          <th className="px-6 py-3 text-left font-semibold">DATASET ID</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-gray-200">
        {rows.map((i, idx) => (
          <tr key={idx} className="hover:bg-gray-100 transition">

            <td className="px-6 py-3 font-medium">{i.nombreArchivo}</td>

            <td className="px-6 py-3">{formatDate(i.fecha)}</td>

            <td className="px-6 py-3">{(i.tamanoBytes / 1024).toFixed(1)} KB</td>

            <td className="px-6 py-3">{i.origenDatos}</td>

            <td className="px-6 py-3">
              {i.tieneEncabezados ? "Sí" : "No"}
            </td>

            <td className="px-6 py-3">{i.registrosTotales}</td>

            <td className="px-6 py-3 font-mono text-xs">{i.datasetId}</td>

          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
const TablaMuestreos = ({ rows }: { rows: any[] }) => (
  <div className="overflow-x-auto bg-white shadow-lg rounded-xl border border-gray-200">
    <table className="min-w-full text-sm">
      <thead className="bg-[#003055] text-white">
        <tr>
          <th className="px-6 py-3 text-left font-semibold">NOMBRE</th>
          <th className="px-6 py-3 text-left font-semibold">FECHA</th>
          <th className="px-6 py-3 text-left font-semibold">USUARIO</th>
          <th className="px-6 py-3 text-left font-semibold">REGISTROS</th>
          <th className="px-6 py-3 text-left font-semibold">RANGO</th>
          <th className="px-6 py-3 text-left font-semibold">SEMILLA</th>
          <th className="px-6 py-3 text-left font-semibold">DUPLICADOS</th>
          <th className="px-6 py-3 text-left font-semibold">ARCHIVO FUENTE</th>
          <th className="px-6 py-3 text-left font-semibold">HASH</th>
          <th className="px-6 py-3 text-left font-semibold">TIPO</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-gray-200">
        {rows.map((h, i) => (
          <tr key={i} className="hover:bg-gray-100 transition">
            
            <td className="px-6 py-3 font-medium">{h.name}</td>

            <td className="px-6 py-3">{formatDate(h.fecha)}</td>

            <td className="px-6 py-3">{h.userDisplay}</td>

            <td className="px-6 py-3">{h.records}</td>

            <td className="px-6 py-3">{h.range}</td>

            <td className="px-6 py-3">{h.seed}</td>

            <td className="px-6 py-3">{h.allowDuplicates ? "Sí" : "No"}</td>

            <td className="px-6 py-3">{h.source}</td>

            <td className="px-6 py-3 font-mono text-xs">{h.hash}</td>

            <td className="px-6 py-3">
              {h.tipo === "masivo" ? (
                <span className="px-3 py-1 rounded-md bg-yellow-300 text-[#003055] font-semibold">
                  Masivo
                </span>
              ) : (
                <span className="px-3 py-1 rounded-md bg-blue-600 text-white font-semibold">
                  Estandar
                </span>
              )}
            </td>

          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
const TablaExportaciones = ({ rows }: { rows: any[] }) => (
  <div className="overflow-x-auto bg-white shadow-lg rounded-xl border border-gray-200">
    <table className="min-w-full text-sm">
      <thead className="bg-[#5c9ca7] text-white">
        <tr>
          <th className="px-6 py-3 text-left font-semibold">EXPORTADO</th>
          <th className="px-6 py-3 text-left font-semibold">FECHA</th>
          <th className="px-6 py-3 text-left font-semibold">FORMATO</th>
          <th className="px-6 py-3 text-left font-semibold">REGISTROS</th>
          <th className="px-6 py-3 text-left font-semibold">RANGO</th>
          <th className="px-6 py-3 text-left font-semibold">ARCHIVO FUENTE</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-gray-200">
        {rows.map((e, idx) => (
          <tr key={idx} className="hover:bg-gray-100 transition">

            <td className="px-6 py-3 font-medium">{e.nombreExportado}</td>

            <td className="px-6 py-3">{formatDate(e.fecha)}</td>

            <td className="px-6 py-3">{e.formato}</td>

            <td className="px-6 py-3">{e.registrosExportados}</td>

            <td className="px-6 py-3">{`${e.rangoInicio} - ${e.rangoFin}`}</td>

            <td className="px-6 py-3">{e.archivoFuenteNombre}</td>

          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default function MuestraPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;
  // Evitar hydration mismatch
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  // Estado persistente: pestañas, historial, pestaña activa
  const [tabs, setTabs] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("tabs");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [historial, setHistorial] = useState<HistorialState>({
    imports: [],
    muestras: [],
    exports: [],
  });
  // Activar las pestañas de las tablas
  const [activeTab, setActiveTab] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("activeTab") || null;
    }
    return null;
  });

  // nuevo estado: subtabs estilo parametrización
  const [subTab, setSubTab] = useState<"estandar" | "masivo">("estandar");
  // Estado: parámetros del muestreo (persistentes)
  const [sampleParams, setSampleParams] = useState<SampleParams>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sampleParams");
      return saved ? JSON.parse(saved) : DEFAULT_SAMPLE_PARAMS;
    }
    return DEFAULT_SAMPLE_PARAMS;
  });

  // Para Data Masivo (cambia solo los iniciales que quieras distintos)
  const [sampleParamsMasivo, setSampleParamsMasivo] = useState<SampleParams>({
    ...DEFAULT_SAMPLE_PARAMS,
    records: 0,   // aquí lo adaptas a tu lógica
    seed: 0,      // diferente semilla inicial
    end: 0,     // porque aún no se sabe el tamaño del dataset masivo
    allowDuplicates: false,
    fileName: "",
  });

  // === IMPRIMIR HISTORIAL COMPLETO (Estandar + Masivo) ===
  const exportPdf = async () => {
    try {
      // ruta correcta del endpoint: /api/export/pdf
      const res = await fetch("/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // incluir cookies/sesión para que getServerSession funcione
        credentials: "include",
      });

      if (!res.ok) {
        // intentar parsear respuesta de error
        let errBody: any = {};
        try {
          errBody = await res.json();
        } catch (e) {
          try {
            const txt = await res.text();
            errBody = { error: txt };
          } catch (e2) {
            errBody = { error: res.statusText || 'Error desconocido' };
          }
        }

        // Mostrar mensaje más útil según lo que devuelva el servidor
        const msg = errBody?.error || errBody?.details || res.statusText || 'Error al generar el PDF';
        alert(msg);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "historial_general.pdf";
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("❌ Error al imprimir historial:", err);
      alert("Error al generar el PDF del historial.");
    }
  };

  // estado para indicar que se está generando el PDF
  const [pdfLoading, setPdfLoading] = useState(false);

  // Guardar pestañas (solo metadata ligera, no las filas pesadas)
  useEffect(() => {
    const lightTabs = tabs.map(t => ({
      id: t.id,
      name: t.name,
      sourceFile: t.sourceFile,
      datasetLabel: t.datasetLabel,
      datasetId: t.datasetId,
    }));
    localStorage.setItem("tabs", JSON.stringify(lightTabs));
  }, [tabs]);

  // Guardar pestaña activa
  useEffect(() => {
    if (activeTab) localStorage.setItem("activeTab", activeTab);
  }, [activeTab]);

  // Guardar parámetros del muestreo
  useEffect(() => {
    localStorage.setItem("sampleParams", JSON.stringify(sampleParams));
  }, [sampleParams]);

  // Recargar historial al cambiar entre Data Estándar / Masivo
  useEffect(() => {
    if (activeTab === "historial") {
      console.log("🔁 Cambio de subTab detectado. Recargando historial...");
      openHistorial();
    }
  }, [subTab]);

  useEffect(() => {
    setTabs(prev => {
      const map = new Map<string, any>();
      for (const t of prev) map.set(t.id, t); // la última gana
      const deduped = Array.from(map.values());
      return deduped.length === prev.length ? prev : deduped;
    });
  }, []);

  // UI: modales y estados auxiliares ESTANDAR
  const [showModal, setShowModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [useHeaders, setUseHeaders] = useState(true);
  const [datasetName, setDatasetName] = useState("");
  // Estado nuevo para exportación
  const [selectedTabId, setSelectedTabId] = useState<string>("");
  // === Estados para Data Masivo ===
  const [showUploadModalMasivo, setShowUploadModalMasivo] = useState(false);
  const [showModalMasivo, setShowModalMasivo] = useState(false);
  const [showExportModalMasivo, setShowExportModalMasivo] = useState(false);
  const [uploadedFileMasivo, setUploadedFileMasivo] = useState<File | null>(null);
  const [datasetNameMasivo, setDatasetNameMasivo] = useState("");
  const [useHeadersMasivo, setUseHeadersMasivo] = useState(true);
  const [progressMasivo, setProgressMasivo] = useState(0);
  const [uploadingMasivo, setUploadingMasivo] = useState(false);
  const [selectedTabIdMasivo, setSelectedTabIdMasivo] = useState("");
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [isSampling, setIsSampling] = useState(false);
  // === Progreso del indexado ===
  const [progressIndex, setProgressIndex] = useState<number>(0);
  const [progressLog, setProgressLog] = useState(0);
  const [processedLines, setProcessedLines] = useState(0);
  const [progressFile, setProgressFile] = useState("");
  // Modal: Carpeta Base
  // === Estados del modal de Carpeta Base ===
  const [showDirModal, setShowDirModal] = useState(false);
  const [currentDir, setCurrentDir] = useState("");
  const [savingDir, setSavingDir] = useState(false);
  // Estados del explorador tipo Windows
  const [disks, setDisks] = useState<string[]>([]);
  const [folders, setFolders] = useState<{ name: string; fullPath: string }[]>([]);
  const [currentPath, setCurrentPath] = useState("");
  const [loadingList, setLoadingList] = useState(false);

  // Mensaje dinámico de estado del proceso masivo
  const [useStreaming, setUseStreaming] = useState(false);
  const [masivoStatus, setMasivoStatus] = useState<string>("");
  const [progressLines, setProgressLines] = useState<string[]>([]);
  const [targetDir, setTargetDir] = useState("/mnt/data/datasets");   

  // === Estados de Historial ===
  const [search, setSearch] = useState("");
  const [historialCategoria, setHistorialCategoria] =
    useState<"imports" | "muestras" | "exports" | "todo">("todo");

  const [searchTerm, setSearchTerm] = useState("");
  const filteredHistorial = [
    ...(historial?.imports ?? []),
    ...(historial?.muestras ?? []),
    ...(historial?.exports ?? []),
  ].filter((h) => {
    // Filtrar por categoría
    if (historialCategoria === "imports" && h.origen !== "import") return false;
    if (historialCategoria === "muestras" && h.origen !== "muestra") return false;
    if (historialCategoria === "exports" && h.origen !== "export") return false;

    // Filtrar por texto
    const txt = `${h.name ?? ""} ${h.source ?? ""} ${h.hash ?? ""} ${h.userDisplay ?? ""}`.toLowerCase();
    return txt.includes(searchTerm.toLowerCase());
  });


  // === Estado para paginación ===
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50); // opcional, si usas paginación por filas
  // === Estado: información del índice ===
  const [indexInfo, setIndexInfo] = useState<{
    exists: boolean;
    totalRows: number | null;          // total reportado por el backend (con o sin cabecera)
    adjustedTotalRows: number | null;  // total real para muestreo (sin cabecera si useHeadersMasivo)
    fileName: string | null;
    message: string;
  }>({
    exists: false,
    totalRows: null,
    adjustedTotalRows: null,
    fileName: null,
    message: "Sin verificar",
  });
  // Dataset de pestaña activa (ya lo tienes)
  const currentRows =
  activeTab === "historial"
    ? filteredHistorial
    : tabs.find((t) => t.id === activeTab)?.rows || [];
   // Referencias a las pestañas activas (para modales)
  
  const currentTab = tabs.find((t) => t.id === selectedTabId);
  const currentTabMasivo = tabs.find((t) => t.id === selectedTabIdMasivo);
  
  useEffect(() => {
    if (!showModalMasivo || !selectedTabIdMasivo) return;

    const tab = tabs.find((t) => t.id === selectedTabIdMasivo);
    if (!tab) return;

    const nuevaSemilla = Math.floor(Math.random() * 9000) + 1000;

    (async () => {

      // 1️⃣ Chequear lock del meta (si todavía se está generando)
      const lockCheck = await fetch("/api/meta-lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: tab.fileName || tab.name })
      });
      const lockStatus = await lockCheck.json();

      if (lockStatus.processing) {
        console.log("⏳ Meta generándose… reintentando en 2s…");

        setIndexInfo(prev => ({
          exists: false,
          totalRows: null,
          adjustedTotalRows: null,
          fileName: prev.fileName ?? null,
          message: "⏳ Generando metadatos…"
        }));

        // 🔁 Reintentar automáticamente después de 2 segundos
        setTimeout(() => {
          setSelectedTabIdMasivo(tab.id); // dispara otra vez el useEffect
        }, 2000);
        return; // NO continuar
      }

      // 2️⃣ Meta disponible → ahora sí generar/usar índice
      try {
        const res = await fetch("/api/muestra-masiva", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "buildIndex",
            fileName: tab.fileName || tab.name,
            useHeaders: true,
          }),
        });

        const data = await res.json();
        const totalDelBackend = Number(data?.totalRows ?? 0);
        const adjusted = Math.max(0, useHeadersMasivo ? totalDelBackend - 1 : totalDelBackend);

        if (res.ok && data?.ok) {
          setIndexInfo(prev => ({
            exists: true,
            totalRows: totalDelBackend,
            adjustedTotalRows: adjusted,
            fileName: prev.fileName ?? null,
            message: `✅ Indexado — ${totalDelBackend.toLocaleString("es-BO")} filas`,
          }));
        } else {
          setIndexInfo(prev => ({
            exists: false,
            totalRows: null,
            adjustedTotalRows: null,
            fileName: prev.fileName ?? null,
            message: "⚙️ No indexado, se generará automáticamente",
          }));
        }

        setSampleParamsMasivo((prev) => ({
          ...prev,
          seed: nuevaSemilla,
          records: 0,
          start: 1,
          end: adjusted || (tab.totalRows ?? tab.rows?.length ?? 0),
          totalRows: adjusted || (tab.totalRows ?? tab.rows?.length ?? 0),
          fileName: tab.name || prev.fileName,
          allowDuplicates: prev.allowDuplicates ?? false,
        }));

        if (!selectedTabIdMasivo) setSelectedTabIdMasivo(tab.id);

      } catch (err) {
        console.error("Error verificando/creando índice:", err);
        setIndexInfo(prev => ({
          exists: false,
          totalRows: null,
          adjustedTotalRows: null,
          fileName: prev.fileName ?? null,
          message: "❌ Error verificando índice",
        }));
      }
    })();

  }, [showModalMasivo, selectedTabIdMasivo, tabs, activeTab, useHeadersMasivo]);

  useEffect(() => {
    const current = tabs.find(t => t.id === activeTab);
    if (current?.type === "masivo") {
      setSelectedTabIdMasivo(current.id);
    }
  }, [activeTab, tabs]);

  // === AUTO-NOMBRE DEL ARCHIVO PARA EL MODAL ESTÁNDAR ===
  useEffect(() => {
    if (!showModal || !selectedTabId) return;

    const tab = tabs.find((t) => t.id === selectedTabId);
    if (!tab) return;

    const nombreDetectado =
      tab.displayName ||
      tab.fileName ||
      tab.name ||
      `Dataset_${selectedTabId}`;

    setSampleParams((prev) => ({
      ...prev,
      fileName: nombreDetectado,
    }));
  }, [showModal, selectedTabId, tabs]);

  // Trackeo de progreso durante el indexado masivo
  useEffect(() => {
    if (!showModalMasivo) return;

    // 🚫 Si ya existe el índice → NO hacer polling
    if (indexInfo?.exists) return;

    let active = true;

    const poll = async () => {
      try {
        const res = await fetch("/api/log-progress");
        if (!res.ok) return;

        const data = await res.json();
        if (!active) return;

        // Si ya terminó
        if (data.completed || data.percent === 100) {
          setProgressLog(100);
          setProgressIndex(100);
          setProcessedLines(data.totalRows ?? 0);

          setIndexInfo((prev: any) => ({
            ...prev,
            exists: true,
            totalRows: data.totalRows,
            message: "Índice generado correctamente",
          }));

          return;
        }

        // En progreso
        setProgressLog(data.percent ?? 0);
        setProgressIndex(data.percent ?? 0);
        setProcessedLines(data.processedLines ?? 0);

        if (data.totalRows) {
          setIndexInfo((prev: any) => ({
            ...prev,
            totalRows: data.totalRows,
            exists: false,
          }));
        }

        if (data.file) setProgressFile(data.file);

      } catch (err) {
        console.error("Error leyendo /api/log-progress:", err);
      }
    };

    poll();
    const interval = setInterval(poll, 3000);

    return () => {
      active = false;
      clearInterval(interval);
    };

  }, [showModalMasivo, indexInfo.fileName]);


  // Guardar historial / parámetros según pestaña activa
  useEffect(() => {
    if (activeTab && activeTab !== "historial") {
      const rows = tabs.find((t) => t.id === activeTab)?.rows || [];
      setSampleParams((prev) => ({
        ...prev,
        start: 1,
        end: rows.length,
        totalRows: rows.length,
      }));
    }
  }, [activeTab, tabs]);

  // Recargar historial automáticamente cada vez que activeTab sea "historial"
  useEffect(() => {
    if (activeTab === "historial") {
      openHistorial();
    }
  }, [activeTab]);
  
  useEffect(() => {
    if (activeTab === "historial") {
      // evitar loop: solo cargar una vez
      openHistorial();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Sanitize rows for display: remove columns named __EMPTY* and columns that are entirely empty
  const sanitizeRows = (rows: any[]) => {
    if (!Array.isArray(rows) || rows.length === 0) return rows;
    // Limit check to first N rows for performance on very large datasets
    const SAMPLE_LIMIT = 500;
    const sample = rows.slice(0, SAMPLE_LIMIT);
    const cols = Object.keys(rows[0] || {});
    const visibleCols = cols.filter((col) => {
      if (/^__?EMPTY/i.test(col)) return false;
      const allEmpty = sample.every((r) => {
        const v = r[col];
        return v === undefined || v === null || String(v).trim() === "" || String(v).toLowerCase() === "null";
      });
      return !allEmpty;
    });
    // If nothing to filter, return original rows (preserve identity)
    if (visibleCols.length === cols.length) return rows;
    // Map rows to objects containing only visible columns (preserve order)
    return rows.map((r) => {
      const out: any = {};
      for (const c of visibleCols) out[c] = r[c];
      return out;
    });
  };

  // === Integración con la interfaz principal (handleOk ESTÁNDAR) ===
  const handleOk = async () => {
    if (!currentTab) {
      alert("No hay dataset seleccionado.");
      return;
    }

    try {
      // 2️⃣ Generar muestreo
      const response = await fetch("/api/muestra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sample",
          datasetId: currentTab.datasetId,              // ID real del dataset cargado
          n: sampleParams.records,                      // Cantidad de registros
          seed: sampleParams.seed,                      // Semilla del muestreo
          start: sampleParams.start,                    // Inicio del rango
          end: sampleParams.end,                        // Fin del rango
          allowDuplicates: sampleParams.allowDuplicates,
          fileName: sampleParams.fileName || currentTab.name,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({} as any));
        alert(`Error: ${err.details || err.error || "No se pudo generar la muestra"}`);
        return;
      }

      // ⬅️ AHORA SÍ LEEMOS TODO LO QUE MANDA EL BACKEND
      const {
        sample,
        hash,
        totalRows,
        datasetName,
        sourceFile,
        rangeStart,
        rangeEnd,
        datasetId: sampleDatasetId,
      } = await response.json();

      const newTabId = Date.now().toString();

      //  Crear nueva pestaña con los datos de la muestra
      setTabs((prev) => [
        ...prev,
        {
          id: newTabId,
          name: datasetName || sampleParams.fileName || `Muestra-${newTabId}`,
          rows: sample,
          // datasetId de la muestra (por si el backend quiere usar uno propio,
          // si no, usamos el que ya tenías)
          datasetId: sampleDatasetId || currentTab.datasetId,
          // fuente REAL que viene del backend (safeName / originalName):
          sourceFile: sourceFile || currentTab.sourceFile,
          datasetLabel: currentTab.datasetLabel,

          // 🔥 NUEVO: guardamos el rango real del muestreo
          rangeStart: rangeStart ?? sampleParams.start,
          rangeEnd: rangeEnd ?? sampleParams.end,
        },
      ]);

      setTimeout(() => setCurrentPage(1), 50);
      setActiveTab(newTabId);

      // (Opcional) tu actualización local de historial de muestras la puedes dejar igual
      setHistorial((prev) => ({
        ...prev,
        muestras: [
          ...prev.muestras,
          {
            id: newTabId,
            hash,
            name: datasetName || sampleParams.fileName || `Muestra-${newTabId}`,
            date: new Date().toLocaleString(),
            user: "Administrador",
            records: sample.length,
            range: `${sampleParams.start} - ${sampleParams.end}`,
            seed: sampleParams.seed,
            allowDuplicates: sampleParams.allowDuplicates ? "Sí" : "No",
            source: currentTab.fileName || "dataset local",
          },
        ],
      }));

      setShowModal(false);
    } catch (e: any) {
      alert(`Error inesperado: ${e.message}`);
    }
  };

  // === Integración con la interfaz principal (handleOkMasivo)
  const handleOkMasivo = async () => {
    // helper de timeout
    const withTimeout = async (promise: Promise<Response>, ms = 60000) => {
      const ac = new AbortController();
      const t = setTimeout(() => ac.abort(), ms);
      try {
        const res = await promise;
        return res; // no vuelvas a llamar fetch
      } catch (e: any) {
        if (e?.name === "AbortError") throw new Error("Tiempo de espera agotado (timeout).");
        throw e;
      } finally {
        clearTimeout(t);
      }
    };

    try {
      // 1️⃣ Validar que haya dataset seleccionado
      if (!selectedTabIdMasivo) {
        alert("⚠️ No hay un dataset masivo seleccionado.");
        return;
      }

      // 2️⃣ Buscar la pestaña activa
      const tab = tabs.find((t) => t.id === selectedTabIdMasivo);
      if (!tab) {
        alert("⚠️ No se encontró la pestaña seleccionada.");
        return;
      }

      // 3️⃣ Determinar nombre físico (archivo en disco)
      const physicalFile = tab.fileName || tab.name;
      if (!physicalFile) {
        alert("⚠️ No se pudo determinar el nombre del archivo.");
        return;
      }

      // 4️⃣ Validar parámetros del muestreo
      const totalRows =
        indexInfo.adjustedTotalRows ??
        sampleParamsMasivo.totalRows ??
        tab.totalRows ??
        0;

      if (totalRows === 0) {
        alert("⚠️ El dataset no contiene filas válidas.");
        return;
      }
      const n = sampleParamsMasivo.records ?? 0;
      const seed = sampleParamsMasivo.seed ?? Date.now();
      const start = sampleParamsMasivo.start ?? 1;
      const end = sampleParamsMasivo.end ?? totalRows;
      const allowDuplicates = sampleParamsMasivo.allowDuplicates ?? false;

      if (n <= 0) {
        alert("Debes ingresar un número de registros para muestrear.");
        return;
      }
      if (end < start || end > totalRows) {
        alert(`El rango (${start}-${end}) no es válido para un total de ${totalRows.toLocaleString("es-BO")} filas.`);
        return;
      }
      //  Validar que si n > rango, debe permitir duplicados
      const rango = end - start + 1;
      if (n > rango && !allowDuplicates) {
        alert(
          `⚠️ Estás pidiendo ${n} registros pero el rango solo tiene ${rango} filas.\n` +
          `Para permitir repetir registros, marca la opción "Seleccionar Duplicados".`
        );
        return;
      }
      // 5️⃣ Mostrar estado visual
      setIsSampling(true);
      setMasivoStatus("📘 Generando índice optimizado...");
      setProgressIndex(0);
      // --- Generar índice si no existe ---
      const resIndex = await fetch("/api/muestra-masiva", {
        method: "POST",
        body: JSON.stringify({
          action: "buildIndex",
          fileName: tab.archivoResultado || tab.fileName || tab.name, // 👈 siempre usa el archivo real
          filePath: tab.archivoResultado || tab.fileName || tab.name, // 👈 añadimos filePath explícito
          useHeaders: true,
        }),
      });
      setProgressIndex(100);
      setMasivoStatus("✅ Índice generado correctamente");
      setIsSampling(false);

      // ⚠️ Si ya hay un proceso de indexado activo, el backend responderá 429
      if (resIndex.status === 429) {
        const data = await resIndex.json().catch(() => ({}));
        alert(data.error || "⏳ Ya hay un proceso de indexado en curso. Espera a que finalice antes de iniciar otro.");
        setMasivoStatus("⏳ Indexado en curso... espera que termine.");
        return; // salimos del flujo
      }

      if (!resIndex.ok) {
        const err = await resIndex.json().catch(() => ({}));
        throw new Error(err?.error || "Error generando índice en el backend.");
      }
      setMasivoStatus("🎯 Realizando muestreo aleatorio...");
      console.log(`🎯 Muestreo masivo con índice sobre ${totalRows.toLocaleString("es-BO")} filas...`);

      const endLine = useHeadersMasivo ? (end + 1) : end;
      console.log("📤 Enviando al backend:", {
        n,
        seed,
        start,
        end: endLine,
        allowDuplicates: sampleParamsMasivo.allowDuplicates,
      });
      // muestreo con timeout de 60s
      const res = await withTimeout(
        fetch("/api/muestra-masiva", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "sample",
            fileName: tab.archivoResultado || tab.fileName || tab.name,
            filePath: tab.archivoResultado || tab.fileName || tab.name,
            datasetName: sampleParamsMasivo.fileName || tab.name || physicalFile,
            n,
            seed,
            start,
            end: endLine,
            useHeaders: true,
            allowDuplicates: !!sampleParamsMasivo.allowDuplicates,
          }),
        }),
        60000
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (err?.error?.includes("n mayor")) {
          alert("⚠️ Has pedido más registros que los disponibles en el rango sin duplicados. Ajusta el número de registros o habilita 'Duplicados'.");
          return;
        }
        throw new Error(err?.error || "Error generando muestra masiva en el backend.");
      }

      const data = await res.json();
      // data: { ok, sample, hash, archivoResultado, message }

      // columnas originales del dataset (si las tenés en la pestaña masiva)
      const sourceCols: string[] =
        (tabs.find(t => t.id === selectedTabIdMasivo)?.columns as string[]) || [];

      // Construir filas visibles para la UI (mapear COL_1 -> nombre real, etc)
      const displayRows = Array.isArray(data.sample)
        ? data.sample.map((r: any) => {
          if (sourceCols.length === 0) return r;
          const out: Record<string, any> = {};
          let i = 1;
          for (const colName of sourceCols) {
            out[colName] = r[`COL_${i}`];
            i++;
          }
          if (r._POS_ORIGINAL != null) out["_POS_ORIGINAL"] = r._POS_ORIGINAL;
          return out;
        })
        : [];

      const displayColumns =
        sourceCols.length > 0
          ? [...sourceCols, "_POS_ORIGINAL"]
          : (displayRows[0] ? Object.keys(displayRows[0]) : []);

      // 👇 ESTA es la info crítica: el archivo físico real guardado en F:/datasets
      const archivoResultado = data.archivoResultado || null;

      // Creamos una pestaña NUEVA con type "muestra-masiva"
      const newId = `sample_${Date.now()}`;
      setTabs(prev => [
        ...prev,
        {
          id: newId,
          name:
            sampleParamsMasivo.fileName ||
            `Muestra(${displayRows.length} de ${totalRows})`,
          rows: displayRows,
          columns: displayColumns,
          totalRows: displayRows.length,
          type: "muestra-masiva",
          datasetId: newId,
          archivoResultado, // <-- 🔥 guardamos el nombre físico sample_....csv
          fileName: archivoResultado || tab.fileName || physicalFile,
          sourceFile: physicalFile, // 👈 referencia al dataset original
        },
      ]);

      // Activar la nueva pestaña
      setActiveTab(newId);

      // También guardamos en historial local para que el modal y la lista sigan coherentes
      setHistorial(prev => ({
        ...prev,
        muestras: [
          ...prev.muestras,
          {
            id: newId,
            name:
              sampleParamsMasivo.fileName ||
              `Muestra(${displayRows.length} de ${totalRows})`,
            date: new Date().toLocaleString(),
            userDisplay: "Administrador",
            records: displayRows.length,
            range: `${start}-${end}`,
            seed,
            allowDuplicates: allowDuplicates,
            source: physicalFile,            // archivo masivo original msv_...
            archivoResultado,                // <-- 🔥 importante guardarlo también aquí
            hash: data.hash,
            tipo: "masivo",
          }
        ]
      }));

      setShowModalMasivo(false);
      setMasivoStatus("🏁 Muestreo completado correctamente ✅");
      alert(
        `✅ Muestra generada correctamente (${(data.sample?.length ?? n)} registros).`
      );
    } catch (err: any) {
      console.error("❌ Error en muestreo masivo:", err);
      alert("Error en el muestreo masivo: " + err.message);
      setMasivoStatus("❌ Error durante el proceso de muestreo.");
    } finally {
      setIsSampling(false);
    }
  };

  // === Exportación Data Estándar ===
  const exportData = async (format: string) => {
    if (!selectedTabId) {
      alert("Debes seleccionar una pestaña de muestreo.");
      return;
    }

    const tab = tabs.find((t) => t.id === selectedTabId);
    if (!tab) {
      alert("La pestaña seleccionada no existe.");
      return;
    }

    try {
      // calcular datasetId real (
      const datasetId = tab.datasetId || tab.id;
      const res = await fetch("/api/muestra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "export",

          // ✔ Filas reales del muestreo
          rows: tab.rows,

          // ✔ Dataset de la pestaña (igual que lo tenías)
          datasetId,

          // ✔ Formato (igual que antes)
          format,

          // ✔ Archivo original REAL del SAMPLE
          sourceFile: tab.sourceFile || tab.fileName || "desconocido",

          // ✔ Rango real del SAMPLE (viene del backend en SAMPLE)
          rangeStart: tab.rangeStart,
          rangeEnd: tab.rangeEnd,

          // ✔ Nombre del archivo exportado
          fileName: tab.fileName || `${tab.name}.${format}`,
        }),
      });
      //  Manejo de errores de red o backend: intentar parsear JSON, 
      if (!res.ok) {
        let errBody: any = {};
        try {
          errBody = await res.json();
        } catch (e) {
          try {
            const txt = await res.text();
            errBody = { error: txt };
          } catch (e2) {
            errBody = { error: res.statusText || 'Error desconocido' };
          }
        }
        console.error("❌ Error al exportar:", errBody);
        alert(`Error al exportar: ${errBody.error || res.statusText}`);
        return;
      }

      // Descargar archivo
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      // 📦 Nombre del archivo exportado
      const exportName = tab.name?.replace(/\s+/g, "_") || "dataset";
      const extension = format.toLowerCase();
      const link = document.createElement("a");
      link.href = url;
      link.download = `${exportName}.${extension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
      console.log(` Exportación completada: ${exportName}.${extension}`);
    } catch (e: any) {
      console.error("🚨 Error inesperado en exportación:", e);
      alert(`Error inesperado: ${e?.message || String(e)}`);
    }
  };

  // === Exportar SOLO el contenido de la pestaña de muestreo (sin usar el archivo físico) ===
  const exportDataMasivo = async (format: string) => {
    const tab = tabs.find((t) => t.id === activeTab);
    if (!tab) {
      alert("⚠️ No hay pestaña activa para exportar.");
      return;
    }

    if (tab.type !== "muestra-masiva") {
      alert("⚠️ Solo puedes exportar una pestaña de muestreo masivo.");
      return;
    }

    console.log("🧾 Exportando contenido de muestreo:", tab.name);

    try {
      const res = await fetch("/api/muestra-masiva", {   // ← CAMBIO AQUÍ
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "export",
          format,
          rows: tab.rows,
          fileName: tab.archivoResultado,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`❌ Error al exportar: ${err.error || res.statusText}`);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${tab.name}.${format}`;
      link.click();
      URL.revokeObjectURL(url);

      console.log(`✅ Exportación de muestra completada (${format.toUpperCase()})`);
    } catch (e: any) {
      alert(`💥 Error inesperado: ${e.message}`);
      console.error("Error al exportar muestra masiva:", e);
    }
  };

  // === Exportar por STREAMING (ideal para grandes muestreos) ===
  const exportDataMasivoStreaming = async (format: string) => {
    // usamos la pestaña activa o la elegida en el select
    const tab =
      tabs.find((t) => t.id === selectedTabIdMasivo) ||
      tabs.find((t) => t.id === activeTab);

    if (!tab) {
      alert("⚠️ No hay pestaña seleccionada para exportar.");
      return;
    }

    if (tab.type !== "muestra-masiva") {
      alert("⚠️ Solo puedes exportar una pestaña de muestreo masivo.");
      return;
    }

    if (!tab.archivoResultado) {
      alert(
        "⚠️ Esta muestra no tiene un archivo físico asociado en el servidor (archivoResultado faltante)."
      );
      console.error("No hay archivoResultado en la pestaña:", tab);
      return;
    }

    const fileNameToSend = tab.archivoResultado.trim();
    console.log("🌊 Export-stream del archivo físico:", fileNameToSend);

    try {
      const res = await fetch("/api/muestra-masiva", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "export-stream",
          format,
          fileName: fileNameToSend, // <- le mandamos el sample_....csv exacto
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`❌ Error al exportar: ${err.error || res.statusText}`);
        console.error("❌ Error backend export-stream:", err);
        return;
      }

      // Descargar el archivo resultante
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // nombre bonito para el usuario
      link.download = `${tab.name}_stream.${format}`;
      link.click();

      URL.revokeObjectURL(url);
      console.log(`✅ Exportación por streaming completada (${format.toUpperCase()})`);
    } catch (e: any) {
      console.error("🚨 Error en exportación por streaming:", e);
      alert(`Error inesperado: ${e.message}`);
    }
  };
  // Estados adicionales en tu componente
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // === Subida de archivo Excel/CSV/TXT/XML/JSON (Data Estándar) ===
  const handleFileUpload = async () => {
    if (!uploadedFile) {
      alert("Seleccione un archivo");
      return;
    }

    const maxSize = 150 * 1024 * 1024; // 150 MB
    if (uploadedFile.size > maxSize) {
      alert(
        `El archivo excede el límite permitido en DataEstandar (100 MB).\n` +
        `Tamaño recibido: ${(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB`
      );
      return;
    }

    const name = uploadedFile.name.toLowerCase();
    const okExt = [".xlsx", ".xls", ".csv", ".txt", ".json", ".xml"].some(ext => name.endsWith(ext));
    if (!okExt) {
      alert("Tipo de archivo no soportado. Use .xlsx, .xls, .csv, .txt, .json o .xml");
      return;
    }

    try {
      setUploading(true);
      setProgress(0);

      // 👉 Enviar a /api/muestra (no a masiva-chunk) y con campo 'file'
      const form = new FormData();
      form.append("file", uploadedFile); // ← campo correcto para tu route estándar
      form.append("datasetName", datasetName || uploadedFile.name);
      form.append("useHeader", useHeaders ? "true" : "false");

      const res = await fetch("/api/muestra", { method: "POST", body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any));
        throw new Error(err?.error || `Error subiendo archivo: ${res.statusText}`);
      }

      const payload = await res.json(); // tu backend devuelve: { datasetId, rows, total, dataset, fileName }
      const datasetId: string = payload.datasetId;
      const fullRows: any[] = Array.isArray(payload.rows) ? payload.rows : [];
      const totalRows: number = payload.total ?? fullRows.length ?? 0;
      const displayName = datasetName || payload.dataset || payload.fileName || `Dataset-${datasetId}`;

      // Crear/registrar pestaña con TODAS las filas
      setTabs(prev => {
        if (prev.some(t => t.datasetId === datasetId)) return prev;
        return [
          ...prev,
          {
            id: datasetId,
            name: displayName,
            rows: fullRows,      // ← todas
            totalRows,           // ← total real
            datasetId,
            sourceFile: uploadedFile.name,
            datasetLabel: displayName,
            type: "estandar",
          },
        ];
      });

      // Prefijar el modal con el total correcto
      setSampleParams(prev => ({
        ...prev,
        start: 1,
        end: totalRows,
        totalRows,
        fileName: "",
      }));

      setActiveTab(datasetId);
      setShowUploadModal(false);
      setUploadedFile(null);
      setUploading(false);
      setProgress(100);
      setTimeout(() => setProgress(0), 500);
    } catch (e: any) {
      setUploading(false);
      setProgress(0);
      alert(`Error inesperado: ${e.message}`);
    }
  };

  // === Subida de archivo Masivo (optimizada con reintentos, pausas y compatibilidad con backend incremental) ===
  const handleFileUploadMasivo = async () => {
    if (!uploadedFileMasivo) {
      alert("Seleccione un archivo masivo");
      return;
    }
    // Espera robusta hasta que el meta.json esté disponible
    async function waitForMetaFile(fileName: string) {
      const timeoutMs = 1000 * 60 * 45; // 45 min
      const intervalMs = 5000;          // 
      const start = Date.now();

      // Normalización básica
      const cleanName = fileName.replace(/\s+/g, "_");

      while (Date.now() - start < timeoutMs) {
        const res = await fetch("/api/masiva-info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: cleanName }),
        });

        const data = await res.json().catch(() => null);
        if (!data) {
          console.warn("⚠️ No se pudo decodificar respuesta de masiva-info");
          await new Promise(r => setTimeout(r, intervalMs));
          continue;
        }
        if (data.status === "ready") {
          console.log("✅ Meta.json final listo:", data);
          return data;
        }

        if (data.status === "processing") {
          const prog = data.progress ?? 0;
          console.log(`⏳ Generando meta… líneas procesadas: ${prog.toLocaleString("es-BO")}`);
          await new Promise(r => setTimeout(r, intervalMs));
          continue;
        }

        if (data.status === "pending") {
          console.log("🕐 Meta pendiente… backend aún no inicia workerMeta");
          await new Promise(r => setTimeout(r, intervalMs));
          continue;
        }
        if (data.status === "error") {
          console.error("❌ Error en meta-info:", data);
          throw new Error("Meta.json corrupto o proceso falló");
        }
        // Estado no reconocido
        console.warn("⚠️ Estado desconocido:", data.status);
        await new Promise(r => setTimeout(r, intervalMs));
      }
      throw new Error("Timeout esperando meta.json (45 min). El worker podría haber fallado.");
    }
    setUploadingMasivo(true);
    setProgressMasivo(0);
    try {
      const CHUNK_SIZE = 16 * 1024 * 1024;  // 16 MB (más estable en dev)
      const totalChunks = Math.ceil(uploadedFileMasivo.size / CHUNK_SIZE);
      const fileId = `${uploadedFileMasivo.name}-${Date.now()}`;
      // === Reanudador inteligente ===
      const resumeKey = `upload-progress-${uploadedFileMasivo.name}`;
      let lastUploaded = Number(localStorage.getItem(resumeKey) || "0");

      if (lastUploaded > 0) {
        const resume = confirm(
          `💾 Se detectó una subida previa de este archivo (${lastUploaded} chunks).\n¿Deseas continuar desde el chunk ${lastUploaded + 1}?`
        );
        if (!resume) {
          lastUploaded = 0;
          localStorage.removeItem(resumeKey);
        }
      }
      console.log(`📂 Subida masiva iniciada (${totalChunks} chunks)`);
      let finalResult: any = null;
      // ✅ Obtener sesión de forma segura antes de enviar los chunks
      let userId: string | null = null;
      try {
        const sessRes = await fetch("/api/auth/session", { credentials: "include" });
        if (sessRes.ok) {
          const sess = await sessRes.json().catch(() => ({}));
          userId = sess?.user?.id || null;
        } else {
          console.warn("⚠️ No se pudo obtener la sesión (respuesta no OK)");
        }
      } catch (err) {
        console.warn("⚠️ Sesión no disponible temporalmente (posible reinicio del servidor). Continuamos sin userId.", err);
      }

      // === Subida por partes (loop de chunks) ===
      for (let i = lastUploaded; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(uploadedFileMasivo.size, start + CHUNK_SIZE);
        const chunk = uploadedFileMasivo.slice(start, end);

        const formData = new FormData();
        formData.append("targetDir", targetDir);
        formData.append("useHeaders", useHeadersMasivo ? "true" : "false");
        formData.append("chunk", chunk);
        formData.append("index", i.toString());
        formData.append("total", totalChunks.toString());
        formData.append("fileId", fileId);
        formData.append("fileName", uploadedFileMasivo.name);
        formData.append("datasetName", datasetNameMasivo || uploadedFileMasivo.name);
        if (i === totalChunks - 1) formData.append("isLast", "true");

        // === Envío con reintentos automáticos ===
        let success = false;
        let attempt = 0;

        while (!success && attempt < 3) {
          try {
            const res = await fetch("/api/masiva-chunk", {
              method: "POST",
              headers: {
                "x-user-id": userId || "",
              },
              body: formData
            });

            if (res.headers.get("x-background-process")) {
              console.log("🕐 El servidor sigue procesando en segundo plano...");
              continue; // pasa al siguiente chunk o espera meta.json
            }
            if (res.ok) {
              // 💾 Guardar progreso local
              localStorage.setItem(resumeKey, (i + 1).toString());
              // último chunk → guardar resultado final
              if (i === totalChunks - 1) {
                try {
                  finalResult = await res.json();
                  // === Mostrar vista previa emergente ===
                  if (finalResult?.previewStart?.length && finalResult?.previewEnd?.length) {
                    alert(
                      `📊 Vista previa generada:\n` +
                      `• Primeras ${finalResult.previewStart.length} filas\n` +
                      `• Últimas ${finalResult.previewEnd.length} filas\n\n` +
                      `El archivo tiene ${finalResult.totalRows.toLocaleString("es-BO")} filas reales cargadas exitosamente.`
                    );
                  }
                } catch {
                  throw new Error("Respuesta inválida del servidor al finalizar ensamblado.");
                }
              }
              success = true;
            } else {
              console.warn(`⚠️ Falló chunk ${i + 1}/${totalChunks} (intento ${attempt + 1})`);
              attempt++;
              await new Promise((r) => setTimeout(r, 1000));
            }
          }
          catch (err) {
            console.warn(`⚠️ Error en chunk ${i + 1}/${totalChunks}, intento ${attempt + 1}`, err);
            attempt++;
            await new Promise((r) => setTimeout(r, 1500));
          }
        }
        if (!success) {
          throw new Error(`No se pudo subir chunk ${i + 1} tras 3 intentos.`);
        }

        // Pequeña pausa entre envíos para aliviar carga en disco/CPU
        await new Promise((r) => setTimeout(r, 100));
        // Progreso visible
        const percent = Math.round(((i + 1) / totalChunks) * 100);
        setProgressMasivo(percent);
        console.log(`📦 Chunk ${i + 1}/${totalChunks} subido (${percent}%)`);
      }

      //  Caso especial: filas vacías detectadas
      if (finalResult.requiresCleaning) {
        console.warn("⚠️ Se detectaron filas vacías en el archivo masivo.");

        const userConfirmed = window.confirm(
          `⚠️ Se detectaron ${finalResult.emptyLines} filas vacías en el archivo.\n\n¿Deseas eliminarlas antes de continuar?`
        );

        if (!userConfirmed) {
          alert("⚠️ Has cancelado la limpieza. El archivo no fue procesado.");
          return;
        }

        // Mostrar loader visual
        setUploadingMasivo(true);
        setProgressMasivo(0);
        alert("🧹 Eliminando filas vacías, por favor espera...");

        //  Petición al backend para limpiar filas vacías
        const cleanRes = await fetch("/api/masiva-chunk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "cleanFile",
            fileName: finalResult.fileName,
            useHeaders: useHeadersMasivo, // ✅ enviamos valor real
          }),
        }).then((r) => r.json());

        // Ocultar loader
        setUploadingMasivo(false);
        setProgressMasivo(100);

        if (!cleanRes.ok) {
          throw new Error("Error al limpiar el archivo masivo.");
        }

        alert(`✅ ${cleanRes.message}`);

        // ⚙️ Procesamiento local del resultado limpio
        const hasHeader = useHeadersMasivo;
        const totalClean = hasHeader
          ? cleanRes.totalRows > 0
            ? cleanRes.totalRows - 1
            : 0
          : cleanRes.totalRows;

        //  Crear vista previa 50/50 (primeras 50 y últimas 50 filas)
        const startRows = Array.isArray(cleanRes.previewStart)
          ? cleanRes.previewStart
            .slice(0, 50)
            .map((r: any) => ({ ...r, _section: "inicio" }))
          : [];

        const endRows = Array.isArray(cleanRes.previewEnd)
          ? cleanRes.previewEnd
            .slice(-50)
            .map((r: any) => ({ ...r, _section: "final" }))
          : [];

        const combinedPreview = [...startRows, ...endRows];
        const rowsToDisplay = hasHeader
          ? combinedPreview.slice(1)
          : combinedPreview.length > 0
            ? combinedPreview
            : [{ line: "…" }];

        // 🧾 Crear nueva pestaña con dataset limpio
        const cleanedId = `msv_clean_${Date.now()}`;
        // 🔍 Eliminar duplicados de columna _section / _SECTION si ambos existen
        rowsToDisplay.forEach((row: any) => {
          if (row._SECTION && row._section) delete row._section;
        });
        const cleanedName =
          datasetNameMasivo || `${finalResult.fileName.replace(/\.[^/.]+$/, "")}_clean`;

        setTabs((prev) => [
          ...prev,
          {
            id: cleanedId,
            name: cleanedName,
            rows: rowsToDisplay,
            columns: finalResult?.columns || [], // NUEVA LÍNEA
            totalRows: totalClean,
            type: "masivo",
            datasetId: cleanedId, //  importante para muestreo
          },
        ]);

        // 🧮 Actualizar parámetros del muestreo
        setSampleParamsMasivo((prev) => ({
          ...prev,
          totalRows: totalClean,
          end: totalClean,
        }));

        //  Cerrar modal y activar la nueva pestaña
        setActiveTab(cleanedId);
        setSelectedTabIdMasivo(cleanedId);
        setShowUploadModalMasivo(false);
        setUploadedFileMasivo(null);
        setDatasetNameMasivo("");

        //  Mensaje final
        alert(
          `✅ Archivo limpio cargado exitosamente (${totalClean.toLocaleString(
            "es-BO"
          )} filas válidas).`
        );

        return; // detener flujo normal
      }

      // === Crear nueva pestaña con preview ===
      const newDatasetId = finalResult.datasetId || `msv_${Date.now()}`;
      // nombre físico exacto en disco (con .txt)
      const physicalFileName = (finalResult.fileName || "").replace(/\s+/g, "_");
      // nombre visible (limpio para mostrar en UI)
      const displayName = (datasetNameMasivo || finalResult.fileName || uploadedFileMasivo?.name || "dataset")
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_.-]/g, "");

      // Combinar ambas partes de la vista previa inicial
      const startRows = Array.isArray(finalResult.previewStart)
        ? finalResult.previewStart.map((r: any) => (r._SECTION || r._section ? r : { ...r, _SECTION: "inicio" }))
        : [];
      const endRows = Array.isArray(finalResult.previewEnd)
        ? finalResult.previewEnd.map((r: any) => (r._SECTION || r._section ? r : { ...r, _SECTION: "final" }))
        : [];
      const combinedPreview = [...startRows, { line: "..." }, ...endRows];
      const safeRows = combinedPreview.length > 0 ? combinedPreview : [{ line: "..." }];
      const rowsToDisplay = useHeadersMasivo ? safeRows.slice(1) : safeRows;

      // ✅ Elimina posibles duplicados de columnas internas
      rowsToDisplay.forEach((row: any) => {
        if (row._SECTION && row._section) delete row._section;
      });

      // === Crear payload de pestaña unificado ===
      const tabPayload = {
        id: newDatasetId,
        datasetId: newDatasetId,
        name: displayName,
        fileName: physicalFileName,
        rows: rowsToDisplay,
        totalRows: finalResult.totalRows || 0,
        type: "masivo" as const,
      };

      // ✅ Actualiza pestañas sin duplicados
      setTabs(prev => {
        const filtered = prev.filter(t => t.name !== displayName && t.id !== newDatasetId);
        return [...filtered, tabPayload];
      });

      // Actualizar parámetros de muestreo
      setSampleParamsMasivo(prev => ({
        ...prev,
        totalRows: finalResult.totalRows,
        end: finalResult.totalRows,
      }));

      setActiveTab(newDatasetId);
      setSelectedTabIdMasivo(newDatasetId);
      setTimeout(() => setActiveTab(newDatasetId), 200);
      const totalSizeMB = (uploadedFileMasivo.size / 1024 / 1024).toFixed(2);
      alert(`✅ Archivo subido correctamente aceptar carga meta datos(${totalSizeMB} MB en ${totalChunks} partes)`);
      localStorage.removeItem(resumeKey); // 🧹 Limpieza del progreso

      console.log("📩 Respuesta backend masiva-chunk:", finalResult);
      // === Esperar meta.json con total real ===
      if (finalResult?.fileName) {
        console.log("⏸️ Esperando 5 segundos antes de consultar meta.json");
        setLoadingMeta(true);               // << mostrar loader redondo
        const metaData = await waitForMetaFile(finalResult.fileName.replace(/\s+/g, "_"));
        setLoadingMeta(false);

        if (metaData?.ready) {
          const newId = finalResult.datasetId;
          const displayName = datasetNameMasivo || finalResult.fileName;

          console.log("📘 Meta.json recibido:", metaData);

          // === Construir filas visibles desde el meta ===
          const rowsToDisplay: Record<string, any>[] = [];

          //  Nuevo formato (objetos): usar directamente
          if (Array.isArray(metaData.previewStart) && typeof metaData.previewStart[0] === "object") {
            rowsToDisplay.push(...metaData.previewStart);
            if (Array.isArray(metaData.previewEnd) && typeof metaData.previewEnd[0] === "object") {
              rowsToDisplay.push(...metaData.previewEnd);
            }
          }

          //  Formato antiguo (arrays): mapear a objeto usando columns
          else if (Array.isArray(metaData.previewStart) && Array.isArray(metaData.previewStart[0])) {
            const cols = Array.isArray(metaData.columns) ? metaData.columns : [];
            for (const row of metaData.previewStart) {
              const obj: Record<string, any> = {};
              cols.forEach((col: string, i: number) => (obj[col] = row[i] ?? ""));
              rowsToDisplay.push(obj);
            }
            if (Array.isArray(metaData.previewEnd) && Array.isArray(metaData.previewEnd[0])) {
              for (const row of metaData.previewEnd) {
                const obj: Record<string, any> = {};
                cols.forEach((col: string, i: number) => (obj[col] = row[i] ?? ""));
                rowsToDisplay.push(obj);
              }
            }
          }

          console.log("📋 Filas cargadas desde meta.json:", rowsToDisplay.length, "filas");

          // ✅ Adaptación al nuevo formato del meta
          const columns = Array.isArray(metaData.columns) ? metaData.columns : ["COL1"];
          const rowsPreview = Array.isArray(metaData.rowsPreview)
            ? metaData.rowsPreview.map((rowArr: any[]) => {
              const rowObj: Record<string, any> = {};
              columns.forEach((col: string, i: number) => (rowObj[col] = rowArr[i] ?? ""));
              return rowObj;
            })
            : [];

          // === Crear nueva pestaña visual ===
          setTabs(prev => {
            const idx = prev.findIndex(t => t.id === newId);
            const newTab = {
              id: newId,
              name: displayName,
              rows: rowsToDisplay,
              columns: metaData?.columns || [], //  <-- AGREGAR ESTA LÍNEA
              totalRows: metaData.totalRows || 0,
              type: "masivo" as const,
              datasetId: newId,
            };

            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = { ...copy[idx], ...newTab };
              return copy;
            } else {
              return [...prev, newTab];
            }
          });

          // === Actualizar parámetros del muestreo ===
          setSampleParamsMasivo(prev => ({
            ...prev,
            totalRows: metaData.totalRows,
            end: metaData.totalRows,
            delimiter: metaData.delimiter || "|",
          }));

          setActiveTab(newId);
          setSelectedTabIdMasivo(newId);
          setTimeout(() => setActiveTab(newId), 200);

          console.log(
            `📊 Total de filas reales detectadas: ${metaData.totalRows.toLocaleString("es-BO")}`
          );
        } else {
          console.warn("⚠️ No se pudo obtener meta.json o aún no está listo.");
        }
      } else {
        console.warn("⚠️ No se recibió fileName válido desde el backend masiva-chunk.");
      }
      // === Limpieza de estado ===
      setShowUploadModalMasivo(false);
      setUploadedFileMasivo(null);
      setDatasetNameMasivo("");
      setUploadingMasivo(false);
      setProgressMasivo(100);
    } catch (err: any) {
      console.error("❌ Error en carga masiva:", err);
      alert("Error al subir archivo masivo: " + err.message);
      setUploadingMasivo(false);
      // === Recuperación automática si el meta.json ya existe ===
      if (err?.message?.includes("Timeout esperando meta.json")) {
        console.warn("🕐 Timeout detectado, intentando recuperar meta.json...");

        try {
          const lastFile = uploadedFileMasivo?.name
            ? `msv_${Date.now()}_${uploadedFileMasivo.name}`
            : null;

          // Usa el último fileName conocido si lo tienes en finalResult
          const fileToRecover =
            datasetNameMasivo || uploadedFileMasivo?.name?.replace(/\s+/g, "_");
          if (fileToRecover) {
            const res = await fetch("/api/masiva-info", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ fileName: fileToRecover }),
            });

            const meta = await res.json();
            if (meta?.ok && meta.ready) {
              alert(
                `✅ Meta.json recuperado automáticamente.\n` +
                `Archivo: ${fileToRecover}\n` +
                `Filas totales: ${meta.totalRows.toLocaleString("es-BO")}`
              );

              // Crear nueva pestaña usando los datos recuperados
              const recoveredId = `msv_recover_${Date.now()}`;
              const startRows = meta.previewStart?.map((r: any) => ({ ...r, _SECTION: "inicio" })) || [];
              const endRows = meta.previewEnd?.map((r: any) => ({ ...r, _SECTION: "final" })) || [];
              const rowsToDisplay = useHeadersMasivo
                ? [...startRows, ...endRows].slice(1)
                : [...startRows, ...endRows];

              setTabs((prev) => [
                ...prev,
                {
                  id: recoveredId,
                  name: fileToRecover,
                  rows: rowsToDisplay,
                  totalRows: meta.totalRows || 0,
                  type: "masivo",
                  datasetId: recoveredId,
                },
              ]);

              setSampleParamsMasivo({
                ...sampleParamsMasivo,
                totalRows: meta.totalRows,
                end: meta.totalRows,
              });

              setActiveTab(recoveredId);
              setSelectedTabIdMasivo(recoveredId);
            } else {
              alert("⚠️ No se pudo recuperar el meta.json automáticamente.");
            }
          }
        } catch (recoveryErr) {
          console.error("❌ Error al intentar recuperar meta.json:", recoveryErr);
        }
      }
    }
  };
  // === Acciones UI ===
  const closeTab = (id: string) => {
    const newTabs = tabs.filter((tab) => tab.id !== id);
    setTabs(newTabs);
    if (activeTab === id) setActiveTab(null);
  };

  // === ABRIR HISTORIAL (fusionado estándar + masivo) ===
  const openHistorial = async () => {
    console.log("🟦 Ejecutando historial...");

    try {
      const res = await fetch("/api/muestra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "historial",
          userId: session?.user?.id,
        }),
      });

      const data = await res.json();

      console.log("🟩 Historial COMPLETO cargado.", data);

      setHistorial({
        imports: data.imports || [],
        muestras: data.muestras || [],
        exports: data.exports || [],
      });
    } catch (err) {
      console.error("❌ Error cargando historial:", err);
    }
  };

  const openDirectoryModal = async () => {
    setShowDirModal(true);

    await loadDisks();

    try {
      const res = await fetch("/api/get-dataset-dir");
      const data = await res.json();
      if (data.ok) {
        setCurrentDir(data.dir);
        await loadFolders(data.dir);
      }
    } catch (err) {
      console.error("Error obteniendo carpeta actual:", err);
    }
  };

  const saveDirectory = async (path: string) => {
    if (!path.trim()) {
      alert("Seleccione una carpeta válida.");
      return;
    }
    setSavingDir(true);
    try {
      const res = await fetch("/api/set-dataset-dir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dir: path }),
      });

      const data = await res.json();
      if (data.ok) {
        alert("Directorio actualizado correctamente.");
        setShowDirModal(false);
        setCurrentDir(path);
      } else {
        alert("Error: " + data.error);
      }
    } catch (e: any) {
      alert("Error inesperado: " + e.message);
    } finally {
      setSavingDir(false);
    }
  };

  const loadDisks = async () => {
  const res = await fetch("/api/fs/disk");
  const data = await res.json();
  if (data.ok) setDisks(data.disks);
  };

  const goBack = () => {
  if (!currentPath) return;

  const clean = currentPath.replace(/\\$|\/$/, "");
  const idx = Math.max(clean.lastIndexOf("\\"), clean.lastIndexOf("/"));
  if (idx <= 0) return;
  const parent = clean.substring(0, idx + 1);
  loadFolders(parent);
  };

  const loadFolders = async (path: string) => {
  setLoadingList(true);
  try {
    const res = await fetch(`/api/fs/list?path=${encodeURIComponent(path)}`);
    const data = await res.json();

    if (data.ok) {
      setCurrentPath(data.path);
      setFolders(data.folders);
    }
  } finally {
    setLoadingList(false);
  }
  };


  // Hasta que esté hidratado, no renders (evita mismatch SSR/CSR)
  if (!hydrated) {
    return <div className="p-6 text-gray-500">Cargando…</div>;
  }
  // === Render ===
  return (
    <div className="h-screen flex flex-col">
      <style>{NO_SPIN_CSS}</style>
      <style>{PROGRESS_CSS}</style>
      {/* Header superior con botón de configuración */}
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="text-2xl font-bold text-gray-800">
          Módulo de Muestra
        </h1>
        {subTab === "masivo" && (
          <button
            onClick={openDirectoryModal}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 
                      text-white font-semibold py-2 px-4 rounded shadow transition-colors"
          >
            <Settings size={18} />
            Carpeta Base
          </button>
        )}
      </div>
      {/* === Barra de SubTabs al estilo parametrización === */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6" aria-label="Tabs">
          <button
            onClick={() => setSubTab("estandar")}
            className={`px-3 py-2 text-sm font-medium ${subTab === "estandar"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
              }`}
          >
            Data Estandar
          </button>
          <button
            onClick={() => setSubTab("masivo")}
            className={`px-3 py-2 text-sm font-medium ${subTab === "masivo"

                ? "border-b-2 border-red-600 text-red-600"
                : "text-gray-500 hover:text-gray-700"
              }`}
          >
            Data Masivo
          </button>
        </nav>
      </div>
      {loadingMeta && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[9999]">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-3 text-gray-700 font-semibold">Cargando metadatos...</p>
            <p className="text-sm text-gray-500">Por favor espera unos segundos</p>
          </div>
        </div>
      )}

      {/* === Contenido dinámico según el subTab === */}
      <div className="flex flex-1">
        <div className="flex-1 p-4 overflow-x-auto overflow-y-auto">
          {/* === ESTANDAR === */}
          {subTab === "estandar" && (
            <>
              {/* Barra de pestañas */}
              <div className="flex space-x-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300">
                {tabs.map((tab) => (
                  <div
                    key={tab.id}
                    className={`flex items-center px-4 py-1 rounded-t-lg cursor-pointer select-none ${activeTab === tab.id
                        ? "bg-gradient-to-r from-[#003055] to-[#005080] text-white shadow-md"
                        : "bg-gray-400 text-gray-100 hover:bg-[#005080]"
                      }`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <span className="truncate max-w-[100px]">{tab.name}</span>
                    <button
                      onClick={() => closeTab(tab.id)}
                      className="ml-2 text-xs font-bold hover:text-red-500"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              {/* Contenido */}
              {activeTab === "historial" ? (
                filteredHistorial.length === 0 ? (
                  <div className="p-6 text-gray-500 text-center">
                    No hay registros en el historial aún.
                  </div>
                ) : (
                  <>
                    <HistorialTabs historial={historial} />
                  </>
                )
              ) : (
                <TablaGenerica
                  rows={sanitizeRows(currentRows)}
                  columns={tabs.find((t) => t.id === activeTab)?.columns || []}
                />
              )}
            </>
          )}
          {/* === MASIVO === */}
          {subTab === "masivo" && (
            <>
              {/* Barra de pestañas */}
              <div className="flex space-x-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300">
                {tabs.map((tab) => (
                  <div
                    key={tab.id}
                    className={`flex items-center px-4 py-1 rounded-t-lg cursor-pointer select-none ${activeTab === tab.id
                        ? "bg-gradient-to-r from-[#550000] to-[#800000] text-white shadow-md"
                        : "bg-gray-400 text-gray-100 hover:bg-[#800000]"
                      }`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <span className="truncate max-w-[100px]">{tab.name}</span>
                    <button
                      onClick={() => closeTab(tab.id)}
                      className="ml-2 text-xs font-bold hover:text-red-500"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              {/* Contenido */}
              {activeTab === "historial" ? (
                filteredHistorial.length === 0 ? (
                  <div className="p-6 text-gray-500 text-center">
                    No hay registros en el historial aún.
                  </div>
                ) : (
                  <>
                    <HistorialTabs historial={historial} />
                  </>
                )
              ) : (
                <TablaGenerica
                  rows={sanitizeRows(currentRows)}
                  columns={tabs.find((t) => t.id === activeTab)?.columns || []}
                />
              )}
            </>
          )}
        </div>
        {/* SIDEBAR */}
        <div className="w-60 bg-gray-50 p-6 space-y-4 self-start">
          {/* Cargar Datos */}
          <button
            onClick={() => {
              if (subTab === "estandar") {
                setDatasetName("");
                setUploadedFile(null);
                setShowUploadModal(true); // modal estándar
              } else {
                setDatasetNameMasivo("");
                setUploadedFileMasivo(null);
                setShowUploadModalMasivo(true);
              }
            }}
            className="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow transition-colors"
          >
            <Upload size={18} />
            Cargar Datos
          </button>

          {/* Muestreo */}
          <button
            onClick={() => {
              // === MUETREO MASIVO ===
              if (subTab === "masivo") {
                const activeDataset = tabs.find(t => t.id === activeTab && t.type === "masivo");
                if (!activeDataset) {
                  alert("⚠️ Selecciona primero una pestaña masiva antes de abrir el muestreo.");
                  return;
                }
                // Fijar dataset actual para el modal
                setSelectedTabIdMasivo(activeDataset.id);
                setShowModalMasivo(true);
              }
              // === MUESTREO ESTÁNDAR (sin cambios)
              else if (subTab === "estandar") {
                const tab = tabs.find(t => t.id === activeTab);
                if (!tab) return;

                // 1️⃣ MUY IMPORTANTE: asignar pestaña activa
                setSelectedTabId(activeTab ?? "");
                const totalRows = tab.totalRows ?? tab.rows?.length ?? 0;
                // 2️⃣ NO BORRAR EL FILE NAME
                const nombreDetectado =
                  tab.displayName ||
                  tab.fileName ||
                  tab.name ||
                  `Dataset_${activeTab}`;

                // 3️⃣ Cargar valores iniciales
                setSampleParams(prev => ({
                  ...prev,
                  records: 0,
                  fileName: nombreDetectado,
                  seed: Math.floor(Math.random() * 9000) + 1000,
                  start: 1,
                  end: totalRows,
                  totalRows,
                }));

                // 4️⃣ Abrir modal
                setShowModal(true);
              }
            }}
            className="w-full flex items-center gap-2 bg-gray-400 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded shadow transition-colors"
          >
            <FileBarChart size={18} />
            Muestreo
          </button>

          {/* Exportar */}
          <button
            onClick={() => {
              if (subTab === "estandar") {
                setShowExportModal(true);
              } else {
                setShowExportModalMasivo(true);
              }
            }}
            className="w-full flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded shadow transition-colors"
          >
            <Download size={18} />
            Exportar DataSet
          </button>

          {/* Historial */}
          <button
              onClick={() => {
                setActiveTab("historial");
                openHistorial();
              }}
            className="w-full flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded shadow transition-colors"
          >
            <History size={18} />
            Historial
          </button>
          {/* Imprimir Historial */}
          <button
            onClick={async () => {
              if (pdfLoading) return;
              try {
                setPdfLoading(true);
                await exportPdf();
              } finally {
                setPdfLoading(false);
              }
            }}
            disabled={pdfLoading}
            className={`w-full flex items-center gap-2 ${pdfLoading ? 'bg-purple-800 cursor-wait' : 'bg-purple-800 hover:bg-[#4c428f]'} text-white font-semibold py-2 px-4 rounded shadow transition-colors`}
          >
            <Printer size={18} />
            {pdfLoading ? 'Generando PDF...' : 'Imprimir Historial'}
          </button>
        </div>
      </div>

      {/* MODAL: Muestreo */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 space-y-4 z-50">
            <h2 className="text-lg font-bold mb-2">Opciones de Muestra:</h2>
            <div className="space-y-3">
              {/* Número de registros */}
              <label className="flex justify-between">
                Número de Registros:
                <input
                  type="number"
                  min="1"
                  value={sampleParams.records ?? ""}
                  onChange={(e) =>
                    setSampleParams((prev) => ({
                      ...prev,
                      records: e.target.value === "" ? 0 : parseInt(e.target.value, 10),
                    }))
                  }
                  className="border rounded px-2 py-1 w-20 text-center no-spin"
                />
              </label>

              {/* Semilla */}
              <label className="flex justify-between">
                Semilla Número Aleatorio:
                <input
                  type="number"
                  min="1"
                  value={sampleParams.seed ?? ""}
                  onChange={(e) =>
                    setSampleParams((prev) => ({
                      ...prev,
                      seed: e.target.value === "" ? 0 : parseInt(e.target.value, 10),
                    }))
                  }
                  className="border rounded px-2 py-1 w-20 text-center no-spin"
                />
              </label>

              {/* Inicio */}
              <label className="flex justify-between">
                Inicio:
                <input
                  type="number"
                  min="1"
                  value={sampleParams.start ?? ""}
                  onChange={(e) => {
                    const v = e.target.value === "" ? 0 : parseInt(e.target.value, 10);
                    setSampleParams((prev) => ({
                      ...prev,
                      start: Math.max(1, v), // nunca menor que 1
                    }));
                  }}
                  className="border rounded px-2 py-1 w-20 text-center no-spin"
                />
              </label>

              {/* Fin */}
              <label className="flex justify-between">
                Fin:
                <input
                  type="number"
                  min="1"
                  value={sampleParams.end ?? ""}
                  onChange={(e) => {
                    const v = e.target.value === "" ? 0 : parseInt(e.target.value, 10);
                    const maxLen = currentRows.length || Number.MAX_SAFE_INTEGER;
                    setSampleParams((prev) => ({
                      ...prev,
                      end: Math.min(Math.max(1, v), maxLen), // clamp entre 1 y dataset.length
                    }));
                  }}
                  className="border rounded px-2 py-1 w-20 text-center no-spin"
                />
              </label>

              {/* Checkbox duplicados */}
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={sampleParams.allowDuplicates}
                  onChange={(e) =>
                    setSampleParams((prev) => ({
                      ...prev,
                      allowDuplicates: e.target.checked,
                    }))
                  }
                />
                <span>Seleccionar Duplicados</span>
              </label>

              {/* Nombre del archivo */}
              <label className="flex justify-between">
                Nombre del Archivo:
                <input
                  type="text"
                  value={sampleParams.fileName}
                  onChange={(e) =>
                    setSampleParams((prev) => ({ ...prev, fileName: e.target.value }))
                  }
                  className="border rounded px-2 py-1 w-40"
                />
              </label>
              <p className="italic text-gray-600 text-sm text-right mb-2">
                El archivo tiene {(tabs.find(t => t.id === activeTab)?.totalRows ?? currentRows.length ?? 0)} filas cargadas.
              </p>
            </div>

            <div className="flex justify-end space-x-1 mt-2">
              <button
                onClick={handleOk}
                className="bg-sky-600 text-white px-4 py-2 rounded"
              >
                Aceptar
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL: Muestreo Masivo */}
      {showModalMasivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 space-y-4 z-50">
            <h2 className="text-lg font-bold mb-2">Opciones de Muestra (Masivo):</h2>
            <div className="space-y-3">
              {/* Número de registros */}
              <label className="flex justify-between">
                Número de Registros:
                <input
                  type="number"
                  min="1"
                  value={sampleParamsMasivo.records ?? ""}
                  onChange={(e) =>
                    setSampleParamsMasivo((prev) => ({
                      ...prev,
                      records: e.target.value === "" ? 0 : parseInt(e.target.value, 10),
                    }))
                  }
                  className="border rounded px-2 py-1 w-20 text-center no-spin"
                />
              </label>

              {/* Semilla */}
              <label className="flex justify-between">
                Semilla Número Aleatorio:
                <input
                  type="number"
                  min="1"
                  value={sampleParamsMasivo.seed ?? ""}
                  onChange={(e) =>
                    setSampleParamsMasivo((prev) => ({
                      ...prev,
                      seed: e.target.value === "" ? 0 : parseInt(e.target.value, 10),
                    }))
                  }
                  className="border rounded px-2 py-1 w-20 text-center no-spin"
                />
              </label>

              {/* Inicio */}
              <label className="flex justify-between">
                Inicio:
                <input
                  type="number"
                  min="1"
                  value={sampleParamsMasivo.start ?? ""}
                  onChange={(e) => {
                    const v = e.target.value === "" ? 0 : parseInt(e.target.value, 10);
                    setSampleParamsMasivo((prev) => ({
                      ...prev,
                      start: Math.max(1, v),
                    }));
                  }}
                  className="border rounded px-2 py-1 w-20 text-center no-spin"
                />
              </label>

              {/* Fin */}
              <label className="flex justify-between">
                Fin:
                <input
                  type="number"
                  min="1"
                  value={sampleParamsMasivo.end ?? ""}
                  onChange={(e) => {
                    const v = e.target.value === "" ? 0 : parseInt(e.target.value, 10);
                    setSampleParamsMasivo((prev) => ({
                      ...prev,
                      end: Math.max(1, v),
                    }));
                  }}
                  className="border rounded px-2 py-1 w-20 text-center no-spin"
                />
              </label>

              {/* Checkbox duplicados */}
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={sampleParamsMasivo.allowDuplicates}
                  onChange={(e) =>
                    setSampleParamsMasivo((prev) => ({
                      ...prev,
                      allowDuplicates: e.target.checked,
                    }))
                  }
                />
                <span>Seleccionar Duplicados</span>
              </label>

              {/* Nombre del archivo */}
              <label className="flex justify-between">
                Nombre del Archivo:
                <input
                  type="text"
                  value={sampleParamsMasivo.fileName}
                  onChange={(e) =>
                    setSampleParamsMasivo((prev) => ({ ...prev, fileName: e.target.value }))
                  }
                  className="border rounded px-2 py-1 w-40"
                />
              </label>
              <p className="italic text-gray-600 text-sm text-right mb-2">
                Mostrando{" "}
                {(currentTabMasivo?.rows?.filter?.((r: any) => !r?.__sep).length ?? 0).toLocaleString("es-BO")}
                {" "}de{" "}
                {(indexInfo.totalRows ?? 0).toLocaleString("es-BO")}
                {" "}filas reales detectadas.
              </p>
            </div>
            {/* Estado del índice */}
            <div className="mt-3 p-2 bg-gray-50 rounded border border-gray-200 text-sm">
              <strong>Estado del índice:</strong>
              <span
                className={`ml-2 font-semibold ${indexInfo.exists ? "text-green-600" : "text-orange-600"
                  }`}
              >
                {indexInfo.exists ? "Índice generado correctamente" : "Generando índice..."}
              </span>
              {/* === Barra de progreso del indexado === */}
              {!indexInfo.exists && (
                <div className="mt-4 bg-gray-100 p-3 rounded shadow-sm">
                  <p className="text-sm text-blue-700 font-semibold mb-1 text-center">
                    📊 Indexando {progressFile || "archivo"}...
                  </p>

                  {/* Filas procesadas */}
                  <p className="text-xs text-gray-600 text-center mb-2">
                    {processedLines.toLocaleString("es-BO")} filas procesadas
                  </p>

                  {/* Barra visual */}
                  <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${progressLog || 0}%` }}
                    ></div>
                  </div>

                  {/* Porcentaje */}
                  <p className="text-xs text-gray-700 mt-1 text-center">
                    {progressLog.toFixed(2)}%
                  </p>
                </div>
              )}
              {/* === Indexado completado === */}
              {indexInfo.exists && (
                <div className="mt-3 text-green-600 text-center font-semibold text-sm">
                  ✅ Indexado completado correctamente
                </div>
              )}
            </div>
            {/* Estado dinámico del proceso masivo */}
            {isSampling && (
              <div className="mt-4 text-center">
                {progressIndex > 0 && (
                  <div className="w-full bg-gray-200 h-2 rounded mt-2">
                    <div className="bg-blue-500 h-2 rounded transition-all duration-500"
                      style={{ width: `${progressIndex}%` }}>
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-700 mt-1">
                  Progreso: {progressLog.toFixed(2)}%
                </p>
                <div className="flex items-center justify-center space-x-3">
                  {/* 🔄 Spinner animado */}
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  {/* Mensaje dinámico */}
                  <span className="text-blue-700 font-medium text-sm">
                    {masivoStatus || "Procesando muestreo masivo..."}
                  </span>
                </div>
                {/* Barra de progreso real del indexado */}
                {masivoStatus.toLowerCase().includes("indice") && (
                  <div className="mt-3">
                    <div className="text-xs text-gray-600 mb-1">
                      Progreso del indexado: {progressIndex.toFixed(1)}%
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${progressLog}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* === PROGRESO EN VIVO DEL LOG === */}
            {progressLines.length > 0 && (
              <div className="bg-neutral-900 text-white p-2 mt-3 text-xs font-mono rounded max-h-40 overflow-y-auto border border-gray-700">
                {progressLines.map((l, i) => (
                  <div key={i}>{l}</div>
                ))}
              </div>
            )}
            <div className="flex justify-end space-x-1 mt-2">
              <Button
                onClick={handleOkMasivo}
                disabled={isSampling}
                className={`${isSampling ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
                  } text-white px-4 py-2 rounded`}
              >
                {isSampling ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Procesando...</span>
                  </div>
                ) : (
                  "Aceptar"
                )}
              </Button>
              <button
                onClick={() => {
                  setShowModalMasivo(false);
                  setMasivoStatus("");
                  setIsSampling(false);
                  setProgressLog(0);
                  setProcessedLines(0);
                  setProgressFile("");
                }} className="bg-gray-400 text-white px-4 py-2 rounded">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL: Cargar Datos */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[32rem] space-y-4">
            <h2 className="text-lg font-bold mb-2">Cargar Datos</h2>
            <div className="space-y-3">

              {/* Selección de archivo */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Archivo:</span>
                <div className="flex items-center space-x-3 w-full ml-4">
                  {/* Input oculto */}
                  <input
                    id="fileInput"
                    type="file"
                    accept=".xlsx,.xls,.csv,.txt,.json,.xml"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setUploadedFile(file);

                        //  Extraer nombre base sin extensión
                        const baseName = file.name.replace(/\.[^/.]+$/, "");
                        setDatasetName(baseName);
                      } else {
                        setUploadedFile(null);
                      }
                    }}
                  />
                  {/* Botón abrir selector */}
                  <button
                    type="button"
                    onClick={() => document.getElementById("fileInput")?.click()}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded shadow text-sm"
                  >
                    Seleccionar Archivo
                  </button>
                  {/* Nombre del archivo */}
                  <span className="flex-grow text-gray-900 text-sm text-right pl-3 truncate">
                    {uploadedFile ? uploadedFile.name : "Ningún archivo seleccionado"}
                  </span>
                </div>
              </div>

              {/* Nombre dataset */}
              <label className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Nombre del Dataset:</span>
                <input
                  type="text"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  placeholder="Ej: Ventas2024"
                  className="border rounded px-2 py-1 w-48"
                />
              </label>

              {/* Checkbox cabecera */}
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={useHeaders}
                  onChange={(e) => setUseHeaders(e.target.checked)}
                />
                <span className="text-sm">Usar primera fila como cabecera</span>
              </label>

              {/* Loader de progreso */}
              {uploading && (
                <div className="w-full mt-4">
                  <div className="text-sm text-gray-600 mb-1">Subiendo archivo... {progress}%</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={handleFileUpload}
                disabled={uploading}
                className={`px-4 py-2 rounded text-white ${uploading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                  }`}
              >
                {uploading ? "Cargando..." : "Aceptar"}
              </button>
              <button
                onClick={() => setShowUploadModal(false)}
                disabled={uploading}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL: Cargar Datos Masivo */}
      {showUploadModalMasivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[32rem] space-y-4">
            <h2 className="text-lg font-bold mb-2">Cargar Datos Masivos</h2>
            <div className="space-y-3">
              {/* Selección de archivo */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Archivo:</span>
                <div className="flex items-center space-x-3 w-full ml-4">
                  <input
                    id="fileInputMasivo"
                    type="file"
                    accept=".csv,.json,.xml,.txt"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setUploadedFileMasivo(file);

                        //  Quita la extensión del nombre del archivo
                        const baseName = file.name.replace(/\.[^/.]+$/, "");
                        setDatasetNameMasivo(baseName);
                      } else {
                        setUploadedFileMasivo(null);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById("fileInputMasivo")?.click()}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded shadow text-sm"
                  >
                    Seleccionar Archivo
                  </button>
                  <span className="flex-grow text-gray-900 text-sm text-right pl-3 truncate">
                    {uploadedFileMasivo ? uploadedFileMasivo.name : "Ningún archivo seleccionado"}
                  </span>
                    {/* Directorio destino
                    <label className="flex flex-col text-sm font-medium text-gray-700">
                      Directorio destino:
                      <input
                        type="text"
                        value={targetDir}
                        onChange={(e) => setTargetDir(e.target.value)}
                        placeholder="/mnt/data/datasets"
                        className="mt-1 px-2 py-1 border rounded"
                      />
                    </label> */}
                </div>
              </div>

              {/* Nombre dataset */}
              <label className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Nombre del Dataset:</span>
                <input
                  type="text"
                  value={datasetNameMasivo}
                  onChange={(e) => setDatasetNameMasivo(e.target.value)}
                  placeholder="Ej: VentasMasivas2024"
                  className="border rounded px-2 py-1 w-48"
                />
              </label>
              {/* Checkbox cabecera */}
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={useHeadersMasivo}
                  onChange={(e) => setUseHeadersMasivo(e.target.checked)}
                />
                <span className="text-sm">Usar primera fila como cabecera</span>
              </label>
              {/* Loader de progreso */}
              {uploadingMasivo && (
                <div className="w-full mt-4">
                  <div className="text-sm text-gray-600 mb-1">Subiendo archivo... {progressMasivo}%</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${progressMasivo}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={handleFileUploadMasivo}
                disabled={uploadingMasivo}
                className={`px-4 py-2 rounded text-white ${uploadingMasivo
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                  }`}
              >
                {uploadingMasivo ? "Cargando..." : "Aceptar"}
              </button>
              <button
                onClick={() => setShowUploadModalMasivo(false)}
                disabled={uploadingMasivo}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL: Exportación */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40">
          <div className="bg-white p-6 rounded shadow-lg w-80 space-y-4">
            <h2 className="text-lg font-bold mb-2">Exportar Datos</h2>
            <p className="text-sm text-gray-600">Selecciona el formato:</p>
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => exportData("xlsx")}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Excel (.xlsx)
              </button>
              <button
                onClick={() => exportData("csv")}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                CSV (.csv)
              </button>
              <button
                onClick={() => exportData("json")}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                JSON (.json)
              </button>
              <button
                onClick={() => exportData("xml")}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                XML (.xml)
              </button>
              <button
                onClick={() => exportData("txt")}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                TXT (.txt)
              </button>
            </div>
            {/* Selector de pestaña */}
            <label className="flex flex-col text-sm font-medium text-gray-700">
              Selecciona la pestaña de muestreo:
              <select
                value={selectedTabId}
                onChange={(e) => setSelectedTabId(e.target.value)}
                className="mt-1 border rounded px-2 py-1"
              >
                <option value="">Seleccionar pestaña</option>
                {tabs.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-xs text-gray-500">
              Solo se exportarán los datos de la pestaña seleccionada.
            </p>
            <div className="flex justify-end mt-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL: Exportación Masivo */}
      {showExportModalMasivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40">
          <div className="bg-white p-6 rounded shadow-lg w-80 space-y-4">
            <h2 className="text-lg font-bold mb-2">Exportar Datos Masivos</h2>

            {/* 🔁 INTERRUPTOR DE MODO */}
            <div className="flex items-center space-x-2 border border-gray-300 rounded px-2 py-1 bg-gray-50">
              <input
                id="streamingToggle"
                type="checkbox"
                checked={useStreaming}
                onChange={(e) => setUseStreaming(e.target.checked)}
                className="cursor-pointer w-4 h-4 accent-green-600"
              />
              <label htmlFor="streamingToggle" className="text-sm text-gray-700 select-none">
                Usar exportación segura (Streaming)
              </label>
            </div>

            <p className="text-sm text-gray-600">Selecciona el formato:</p>

            {/* BOTONES DE EXPORTACIÓN */}
            <div className="flex flex-col space-y-2">
              <button
                onClick={() =>
                  useStreaming
                    ? exportDataMasivoStreaming("csv")
                    : exportDataMasivo("csv")
                }
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                CSV (.csv)
              </button>
              <button
                onClick={() =>
                  useStreaming
                    ? exportDataMasivoStreaming("json")
                    : exportDataMasivo("json")
                }
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                JSON (.json)
              </button>
              <button
                onClick={() =>
                  useStreaming
                    ? exportDataMasivoStreaming("xml")
                    : exportDataMasivo("xml")
                }
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                XML (.xml)
              </button>
              <button
                onClick={() =>
                  useStreaming
                    ? exportDataMasivoStreaming("txt")
                    : exportDataMasivo("txt")
                }
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                TXT (.txt)
              </button>
            </div>

            {/* SELECCIONADOR DE PESTAÑA */}
            <label className="flex flex-col text-sm font-medium text-gray-600">
              Selecciona la pestaña de muestreo:
              <select
                value={selectedTabIdMasivo}
                onChange={(e) => setSelectedTabIdMasivo(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm mt-1"
              >
                {tabs.map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.name} — {tab.source || "Sin fuente registrada"}
                  </option>
                ))}
              </select>
            </label>

            {/* BOTÓN DE CIERRE */}
            <div className="flex justify-end mt-3">
              <button
                onClick={() => setShowExportModalMasivo(false)}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      {showDirModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
          <div className="bg-white w-[600px] rounded-xl shadow-xl p-5">

            <h2 className="text-xl font-bold mb-3">Seleccionar Carpeta</h2>

            {/* Discos arriba */}
            <div className="flex gap-2 mb-3">
              {disks.map((d) => (
                <button
                  key={d}
                  onClick={() => loadFolders(d)}
                  className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Breadcrumb + botón atrás */}
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={goBack}
                className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                ⬅
              </button>

              <div className="text-gray-700 font-mono">{currentPath}</div>
            </div>

            {/* Lista de carpetas */}
            <div className="border rounded h-[250px] overflow-auto p-2 bg-gray-50">
              {loadingList ? (
                <p>Cargando...</p>
              ) : (
                folders.map((f) => (
                  <div
                    key={f.fullPath}
                    onClick={() => loadFolders(f.fullPath)}
                    className="cursor-pointer px-2 py-1 hover:bg-gray-200 rounded flex items-center gap-2"
                  >
                    📁 <span>{f.name}</span>
                  </div>
                ))
              )}
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowDirModal(false)}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              >
                Cancelar
              </button>

              <button
                onClick={() => saveDirectory(currentPath)}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
              >
                Seleccionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}