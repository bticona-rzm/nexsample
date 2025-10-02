"use client";
import { useState, useEffect } from "react";
import printJS from "print-js";
import { ChevronLeft, ChevronRight ,  FileBarChart, Download, History, Upload, Printer, Trash2} from "lucide-react";
import { useSession } from "next-auth/react";
import { formatDate } from "@/lib/format"; 

type SampleParams = {
  records: number;
  seed: number;
  start: number;
  end: number;
  allowDuplicates: boolean;
  fileName: string;
};

const DEFAULT_SAMPLE_PARAMS: SampleParams = {
  records: 1,
  seed: 2561,
  start: 1,
  end: 100,
  allowDuplicates: false,
  fileName: "",
  };

// === COMPONENTES DE TABLAS ===
const TablaHistorial = ({ historial }: { historial: any[] }) => (
  <div className="overflow-x-auto bg-white rounded shadow-md">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">NOMBRE</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">FECHA</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">USUARIO</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">REGISTROS</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">RANGO</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">SEMILLA</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">DUPLICADOS</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">ARCHIVO FUENTE</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">HASH</th>
        </tr>
      </thead>
        <tbody>
          {historial.map((h, i) => (
            <tr key={i} className="text-sm text-gray-600">
              <td className="px-6 py-2">{h.name}</td>
              <td className="px-6 py-2">{formatDate(h.createdAt)}</td>
              <td className="px-6 py-2">{h.userDisplay}</td>
              <td className="px-6 py-2">{h.records}</td>
              <td className="px-6 py-2">{h.range}</td>
              <td className="px-6 py-2">{h.seed}</td>
              <td className="px-6 py-2">{h.allowDuplicates ? "Sí" : "No"}</td>
              <td className="px-6 py-2">{h.source || "Desconocido"}</td>
              <td className="px-6 py-2 font-mono text-xs">{h.hash}</td>
            </tr>
          ))}
        </tbody>
    </table>
  </div>
);

//=== generica con paginacion
const TablaGenerica = ({ rows }: { rows: any[] }) => {
  const [paginaActual, setPaginaActual] = useState(1);
  const filasPorPagina = 10;

  const totalPaginas = Math.ceil(rows.length / filasPorPagina);

  const inicio = (paginaActual - 1) * filasPorPagina;
  const fin = inicio + filasPorPagina;
  const filasActuales = rows.slice(inicio, fin);

  return (
    <div className="bg-white rounded shadow-md">
      {/* Tabla con scroll */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              {/* Nueva columna contador */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Nro
              </th>
              {/* Columnas del dataset */}
              {rows.length > 0 &&
                Object.keys(rows[0]).map((col, i) => (
                  <th
                    key={i}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                  >
                    {col}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {filasActuales.map((row, i) => (
              <tr
                key={i}
                className={`${
                  i % 2 === 0 ? "bg-white" : "bg-white"
                } hover:bg-gray-50 transition`}
              >
                {/*  Celda contador (índice global) */}
                <td className="px-6 py-3 text-sm text-gray-600 whitespace-nowrap  ">
                  {inicio + i + 1}
                </td>

                {/*  Resto de columnas */}
                {Object.values(row).map((val, j) => (
                  <td
                    key={j}
                    className="px-6 py-3 text-sm text-gray-600 whitespace-nowrap"
                  >
                    {String(val)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación (fuera del scroll) */}
      {rows.length > filasPorPagina && (
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 rounded-b">
          {/* Botón Anterior */}
          <button
            onClick={() => setPaginaActual((p) => Math.max(p - 1, 1))}
            disabled={paginaActual === 1}
            className={`flex items-center gap-2 px-4 py-2 rounded font-medium transition ${
              paginaActual === 1
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-[#e7b952] text-white hover:bg-[#edc977]"
            }`}
          >
            <ChevronLeft size={18} />
            Anterior
          </button>

          {/* Texto de página */}
          <span className="text-sm font-medium text-gray-700">
            Página {paginaActual} de {totalPaginas}
          </span>

          {/* Botón Siguiente */}
          <button
            onClick={() =>
              setPaginaActual((p) => Math.min(p + 1, totalPaginas))
            }
            disabled={paginaActual === totalPaginas}
            className={`flex items-center gap-2 px-4 py-2 rounded font-medium transition ${
              paginaActual === totalPaginas
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-[#e7b952] text-white hover:bg-[#edc977]"
            }`}
          >
            Siguiente
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};


// === PÁGINA PRINCIPAL ===
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

  // Importante: historial SIEMPRE como array vacío (no localStorage)
  const [historial, setHistorial] = useState<any[]>([]);


  const [activeTab, setActiveTab] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("activeTab") || null;
    }
    return null;
  });

    // Estado: parámetros del muestreo (persistentes)
  const [sampleParams, setSampleParams] = useState<SampleParams>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sampleParams");
      return saved ? JSON.parse(saved) : DEFAULT_SAMPLE_PARAMS;
    }
    return DEFAULT_SAMPLE_PARAMS;
  });
  
  
  // // Función imprimir
  // const printCurrentTab = () => {
  //   const currentRows = tabs.find((t) => t.id === activeTab)?.rows || [];
  //   if (!currentRows.length) {
  //     alert("No hay datos para imprimir.");
  //     return;
  //   }

  //   printJS({
  //     printable: currentRows,
  //     properties: Object.keys(currentRows[0]),
  //     type: "json",
  //     header: `Muestra: ${tabs.find((t) => t.id === activeTab)?.name || "Datos"}`,
  //   });
  // };

  const exportPdf = async () => {
  const res = await fetch("/api/export/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      rows: currentRows,
      title: `Reporte de Muestra: ${tabs.find((t) => t.id === activeTab)?.name || "Datos"}`,
    }),
  });

  if (!res.ok) {
    alert("Error al generar PDF");
    return;
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "muestra.pdf";
  link.click();
  URL.revokeObjectURL(url);
  };

  // Función limpiar historial
  const clearHistorial = async () => {
    if (!userId) {
      alert("Necesitas iniciar sesión para limpiar tu historial.");
      return;
    }

    if (confirm("¿Seguro que quieres borrar todo el historial?")) {
      try {
        const res = await fetch("/api/muestra", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "clearHistorial", userId }),
        });

        if (!res.ok) {
          alert("No se pudo limpiar el historial.");
          return;
        }

        setHistorial([]); //  limpio en UI
      } catch (e: any) {
        alert(`Error al limpiar historial: ${e.message}`);
      }
    }
  };

  // Guardar pestañas
  // Guardar pestañas (solo metadata ligera, no las filas pesadas)
  useEffect(() => {
    const lightTabs = tabs.map(t => ({
      id: t.id,
      name: t.name,
      sourceFile: t.sourceFile,
      datasetLabel: t.datasetLabel,
      datasetId: t.datasetId,   // 🔑 guardamos solo la referencia al dataset
    }));
    localStorage.setItem("tabs", JSON.stringify(lightTabs));
  }, [tabs]);

  // Guardar historial
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

  // Guardar pestaña activa
  useEffect(() => {
    if (activeTab) localStorage.setItem("activeTab", activeTab);
  }, [activeTab]);

  // Guardar parámetros del muestreo
  useEffect(() => {
    localStorage.setItem("sampleParams", JSON.stringify(sampleParams));
  }, [sampleParams]);

  // UI: modales y estados auxiliares
  const [showModal, setShowModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [useHeaders, setUseHeaders] = useState(true);
  const [datasetName, setDatasetName] = useState("");
  // Estado nuevo para exportación
  const [selectedTabId, setSelectedTabId] = useState<string>("");

  // Dataset de pestaña activa (ya lo tienes)
  const currentRows =
    activeTab === "historial"
      ? []
      : tabs.find((t) => t.id === activeTab)?.rows || [];

  // Valida reglas en el cliente con el tamaño real del dataset
  const validateParams = () => {
    const len = currentRows.length;

    if (len === 0) {
      alert("Primero carga un dataset y selecciona su pestaña.");
      return false;
    }
    if (sampleParams.start < 1) {
      alert("El inicio debe ser al menos 1.");
      return false;
    }
    if (sampleParams.end < sampleParams.start) {
      alert("El fin no puede ser menor que el inicio.");
      return false;
    }
    if (sampleParams.end > len) {
      alert(`El fin (${sampleParams.end}) no puede superar el tamaño del dataset (${len}).`);
      return false;
    }
    if (
      !sampleParams.allowDuplicates &&
      sampleParams.records > (sampleParams.end - sampleParams.start + 1)
    ) {
      alert("No se pueden tomar más registros que el rango disponible sin duplicados.");
      return false;
    }
    return true;
  };
  
  // === Muestreo vía API con validaciones y manejo de error ===
  const handleOk = async () => {
    if (!validateParams()) return;

    const currentTab = tabs.find((t) => t.id === activeTab);
    if (!currentTab) {
      alert("No hay pestaña activa con datos cargados");
      return;
    }

    if (!currentTab.datasetId) {
      alert("Este dataset no tiene identificador válido.");
      return;
    }

    try {
      const response = await fetch("/api/muestra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sample",
          datasetId: currentTab.datasetId,   // 🔑 solo enviamos el ID
          n: sampleParams.records,
          seed: sampleParams.seed,
          start: sampleParams.start,
          end: sampleParams.end,
          allowDuplicates: sampleParams.allowDuplicates,
          nombreMuestra: sampleParams.fileName || currentTab.name,
          datasetLabel: currentTab.datasetLabel,
          sourceFile: currentTab.sourceFile,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({} as any));
        alert(`Error: ${err.details || err.error || "No se pudo generar la muestra"}`);
        return;
      }

      // backend responde { sample, hash, totalRows }
      const { sample, hash } = await response.json();
      const newTabId = Date.now().toString();

      setTabs((prev) => [
        ...prev,
        {
          id: newTabId,
          name: sampleParams.fileName || `Muestra-${newTabId}`,
          rows: sample,
          datasetId: currentTab.datasetId,   // 🔑 seguimos guardando el id
          sourceFile: currentTab.sourceFile,
          datasetLabel: currentTab.datasetLabel,
        },
      ]);
      setActiveTab(newTabId);

      setHistorial((prev) => [
        ...prev,
        {
          id: newTabId,
          hash,
          name: sampleParams.fileName || `Muestra-${newTabId}`,
          date: new Date().toLocaleString(),
          user: "Administrador",
          records: sample.length,
          range: `${sampleParams.start} - ${sampleParams.end}`,
          seed: sampleParams.seed,
          allowDuplicates: sampleParams.allowDuplicates ? "Sí" : "No",
          source: currentTab.sourceFile || "Desconocido",
        },
      ]);

      setShowModal(false);
    } catch (e: any) {
      alert(`Error inesperado: ${e.message}`);
    }
  };


  //implementamos el fetch
  const fetchHistorial = async () => {
    try {
      const res = await fetch("/api/muestra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "historial", userId }),
      });

      if (!res.ok) {
        setHistorial([]); // fallback seguro
        return;
      }

      const data = await res.json();
      setHistorial(Array.isArray(data) ? data : []); // 🔒 siempre array
    } catch (e) {
      setHistorial([]); // fallback seguro
    }
  };

  // === Exportación vía API con manejo de error ===
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

    if (!tab.datasetId) {
      alert("Este dataset no tiene un identificador válido.");
      return;
    }

    try {
      const res = await fetch("/api/muestra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "export",
          datasetId: tab.datasetId,   // solo mandamos el id
          format,
          fileName: sampleParams.fileName || tab.name,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`Error al exportar: ${err.error || res.statusText}`);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${sampleParams.fileName || tab.name}.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(`Error inesperado: ${e.message}`);
    }
  };

  // === Subida de archivo Excel/CSV vía API con manejo de error ===
  const handleFileUpload = async () => {
    if (!uploadedFile) {
      alert("Seleccione un archivo");
      return;
    }

  const name = uploadedFile.name.toLowerCase();
  if (
    !name.endsWith(".xlsx") &&
    !name.endsWith(".xls") &&
    !name.endsWith(".csv") &&
    !name.endsWith(".txt")       // ahora también soporta .txt
  ) {
    alert("Tipo de archivo no soportado. Use .xlsx, .xls, .csv o .txt");
    return;
  }


    try {
      const formData = new FormData();
      formData.append("file", uploadedFile);
      formData.append("datasetName", datasetName || uploadedFile.name);
      formData.append("useHeader", useHeaders ? "true" : "false");

      const res = await fetch("/api/muestra", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`Error al procesar el archivo: ${err.error || res.statusText}`);
        return;
      }

      // Backend devuelve { rows, total, dataset, datasetId }
      const { rows, total, dataset, datasetId } = await res.json();

      const newTabId = Date.now().toString();
      setTabs((prev) => [
        ...prev,
        {
          id: newTabId,
          name: dataset || uploadedFile.name,
          rows: rows || [],          // 🔑 aseguramos que siempre sea array
          datasetId,                 // 🔑 guardamos el ID para muestreo/export
          sourceFile: uploadedFile.name,
          datasetLabel: datasetName || "",
        },
      ]);

      setSampleParams((prev) => ({
        ...prev,
        start: 1,
        end: total,
        totalRows: total,
      }));

      setActiveTab(newTabId);
      setShowUploadModal(false);
      setUploadedFile(null);
    } catch (e: any) {
      alert(`Error inesperado: ${e.message}`);
    }
  };

  // === Acciones UI ===
  const closeTab = (id: string) => {
    const newTabs = tabs.filter((tab) => tab.id !== id);
    setTabs(newTabs);
    if (activeTab === id) setActiveTab(null);
  };

  const openHistorial = () => {
    setActiveTab("historial");
    fetchHistorial(); // carga desde backend
  };

  // Hasta que esté hidratado, no renders (evita mismatch SSR/CSR)
  if (!hydrated) {
    return <div className="p-6 text-gray-500">Cargando…</div>;
  }

  // === Render ===
  return (
    <div className="h-screen flex flex-col">
      <h1 className="text-2xl font-bold px-4 py-3 text-gray-800">
        Módulo de Muestra
      </h1>
      <div className="flex flex-1">
        {/* Contenedor Tabs + Contenido */}
        <div className="flex-1 p-4 overflow-x-auto overflow-y-auto">
          {/* Barra de pestañas */}
          <div className="flex space-x-2 mb-0 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`flex items-center px-4 py-1 rounded-t-lg cursor-pointer select-none ${
                  activeTab === tab.id
                  ? "bg-gradient-to-r from-[#003055] to-[#005080] text-white shadow-md"
                  : "bg-gray-400 text-gray-100 hover:bg-[#005080]"
                }`}
              >
                {/* Renombrar pestaña con doble click */}
                <span
                  onClick={() => setActiveTab(tab.id)}
                  onDoubleClick={() => {
                    const newName = prompt("Nuevo nombre para la pestaña:", tab.name);
                    if (newName) {
                      setTabs(
                        tabs.map((t) => (t.id === tab.id ? { ...t, name: newName } : t))
                      );
                    }
                  }}
                  className="truncate max-w-[100px]"
                >
                  {tab.name}
                </span>
                <button
                  onClick={() => closeTab(tab.id)}
                  className="ml-2 text-xs font-bold hover:text-red-500"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Contenido de pestañas */}
          <div className="overflow-x-auto">
            {!activeTab ? (
              <div className="p-6 text-gray-500 text-center">
                No hay datos cargados. Usa <b>Cargar Datos</b>.
              </div>
            ) : activeTab === "historial" ? (
              <TablaHistorial historial={Array.isArray(historial) ? historial : []} />
            ) : (
              <TablaGenerica rows={currentRows} />
            )}
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="w-60 bg-gray-50 p-6 space-y-4 self-start">
          
          {/* Cargar Datos */}
          <button
            onClick={() => {
              // al abrir modal, reiniciar datasetName vacío
              setDatasetName("");
              setShowUploadModal(true);
            }}
            className="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow transition-colors"
          >
            <Upload size={18} />
            Cargar Datos
          </button>

          {/* Muestreo */}
          <button
            onClick={() => {
              // al abrir modal, reiniciar fileName vacío
              setSampleParams((prev) => ({
                ...prev,
                fileName: "",
              }));
              setShowModal(true);
            }}
            className="w-full flex items-center gap-2 bg-gray-400 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded shadow transition-colors"
          >
            <FileBarChart size={18} />
            Muestreo
          </button>

          {/* Exportar Muestreo*/}
          <button
            onClick={() => setShowExportModal(true)}
            className="w-full flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded shadow transition-colors"
          >
            <Download size={18} />
            Exportar DataSet
          </button>

          {/* Historial */}
          <button
            onClick={openHistorial}
            className="w-full flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded shadow transition-colors"
          >
            <History size={18} />
            Historial
          </button>

          {/* Imprimir Historial */}
          <button
            onClick={exportPdf}
            className="w-full flex items-center gap-2 bg-purple-600 hover:bg-purple-900 text-white font-semibold py-2 px-4 rounded shadow transition-colors"
          >
            <Printer size={18} />
            Imprimir Historial
          </button>

          {/* Limpiar Historial */}
          <button
            onClick={clearHistorial}
            className="w-full flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded shadow transition-colors"
          >
            <Trash2 size={18} />
            Limpiar Historial
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
                  className="border rounded px-2 py-1 w-20 text-center"
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
                  className="border rounded px-2 py-1 w-20 text-center"
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
                  className="border rounded px-2 py-1 w-20 text-center"
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
                  className="border rounded px-2 py-1 w-20 text-center"
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

      {/* MODAL: Cargar Datos */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[32rem] space-y-4">
            <h2 className="text-lg font-bold mb-2">Cargar Datos</h2>
            <div className="space-y-3">
              
              {/* Selección de archivo con botón y nombre */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Archivo:</span>
                <div className="flex items-center space-x-3 w-full ml-4">
                  {/* Input oculto */}
                  <input
                    id="fileInput"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                  />
                  {/* Botón para abrir selector */}
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

              {/* Nombre del dataset */}
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
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={handleFileUpload}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Aceptar
              </button>
              <button
                onClick={() => setShowUploadModal(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded"
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
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Excel (.xlsx)
                </button>
                <button
                  onClick={() => exportData("csv")}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  CSV (.csv)
                </button>
                <button
                  onClick={() => exportData("json")}
                  className="bg-violet-600 text-white px-4 py-2 rounded hover:bg-violet-700"
                >
                  JSON (.json)
                </button>
                <button
                  onClick={() => exportData("xml")}
                  className="bg-yellow-400 text-white px-4 py-2 rounded hover:bg-yellow-500"
                >
                  XML (.xml)
                </button>
                <button
                  onClick={() => exportData("txt")}
                  className="bg-orange-400 text-white px-4 py-2 rounded hover:bg-orange-500"
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
                  <option value="">--Seleccionar pestaña--</option>
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
    </div>
  );
}