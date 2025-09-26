"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import DataPreview from "./DataPreview";

type Registro = Record<string, any>;


export default function EstadisticoPage() {
  const [tab, setTab] = useState<"atributos" | "controles">("atributos");

  const [fileName, setFileName] = useState<string | null>(null);
  const [data, setData] = useState<Registro[]>([]);

  // --- Estados del formulario de planificación ---
  const [populationSize, setPopulationSize] = useState("");
  const [riskLevel, setRiskLevel] = useState<"BAJO" | "MODERADO_ALTO">("BAJO");
  const [confidenceLevel, setConfidenceLevel] = useState<
    "ALTO" | "MODERADO" | "BAJO"
  >("ALTO");
  const [selectionMethod, setSelectionMethod] = useState<
    "ALEATORIO" | "SISTEMATICO" | "MUS"
  >("ALEATORIO");

  const [result, setResult] = useState<any>(null);

  // Leer archivo
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      if (!bstr) return;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const jsonData = XLSX.utils.sheet_to_json<Registro>(ws, { defval: "" });
      setData(jsonData);
    };
    reader.readAsBinaryString(file);
  };

  

  // Enviar a API
  const handlePlanificacion = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("/api/estadistico/atributos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        populationSize: data.length > 0 ? data.length : Number(populationSize),
        riskLevel,
        confidenceLevel,
        selectionMethod,
      }),
    });

    const apiData = await res.json();
    setResult(apiData);
  };


  return (
    <div className="p-4 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Módulo de Muestreo Estadístico</h1>

      {/* Tabs */}
      <div className="flex space-x-4 border-b mb-6">
        <button
          className={`px-4 py-2 font-medium border-b-2 transition ${
            tab === "atributos"
              ? "border-[#0f3c73] text-[#0f3c73]"
              : "border-transparent text-gray-500 hover:text-[#0f3c73]"
          }`}
          onClick={() => setTab("atributos")}
        >
          Atributos
        </button>

        <button
          className={`px-4 py-2 font-medium border-b-2 transition ${
            tab === "controles"
              ? "border-[#0f3c73] text-[#0f3c73]"
              : "border-transparent text-gray-500 hover:text-[#0f3c73]"
          }`}
          onClick={() => setTab("controles")}
        >
          Controles
        </button>
      </div>

      {/* Contenido dinámico */}
      {tab === "atributos" && (
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-bold mb-4">Muestreo por Atributos</h2>

          {/* Carga de archivo */}
          <div className="mb-6">
            <label className="block font-medium mb-2">Archivo:</label>

            <div className="flex items-center space-x-3">
              {/* Input real oculto */}
              <input
                id="file-upload"
                type="file"
                accept=".xlsx,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Label que actúa como botón */}
              <label
                htmlFor="file-upload"
                className="cursor-pointer bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded font-medium transition"
              >
                Seleccionar Archivo
              </label>

              {/* Mostrar nombre del archivo */} 
              {fileName && (
                <span className="text-gray-700">{fileName}</span>
              )}
            </div>
          </div>

          {/* Vista previa */}
          {data.length > 0 && <DataPreview data={data} />}

          {/* Formulario de planificación */}
          <form onSubmit={handlePlanificacion} className="space-y-4">
            <div>
              <label className="block font-medium">Tamaño de población (N):</label>
              <input
                type="number"
                value={populationSize}
                onChange={(e) => setPopulationSize(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder={`o usa registros cargados: ${data.length}`}
              />
            </div>

            <div>
              <label className="block font-medium">Riesgo inherente:</label>
              <select
                value={riskLevel}
                onChange={(e) =>
                  setRiskLevel(e.target.value as "BAJO" | "MODERADO_ALTO")
                }
                className="w-full border rounded px-3 py-2"
              >
                <option value="BAJO">Bajo</option>
                <option value="MODERADO_ALTO">Moderado / Alto</option>
              </select>
            </div>

            <div>
              <label className="block font-medium">Nivel de confianza:</label>
              <select
                value={confidenceLevel}
                onChange={(e) =>
                  setConfidenceLevel(
                    e.target.value as "ALTO" | "MODERADO" | "BAJO"
                  )
                }
                className="w-full border rounded px-3 py-2"
              >
                <option value="ALTO">Alto (≈95%)</option>
                <option value="MODERADO">Moderado (≈85–90%)</option>
                <option value="BAJO">Bajo (≈70%)</option>
              </select>
            </div>

            <div>
              <label className="block font-medium">Método de selección:</label>
              <select
                value={selectionMethod}
                onChange={(e) =>
                  setSelectionMethod(
                    e.target.value as "ALEATORIO" | "SISTEMATICO" | "MUS"
                  )
                }
                className="w-full border rounded px-3 py-2"
              >
                <option value="ALEATORIO">Aleatorio simple</option>
                <option value="SISTEMATICO">Sistemático</option>
                <option value="MUS">MUS (Monetary Unit Sampling)</option>
              </select>
            </div>

            <button
              type="submit"
              className="bg-[#0f3c73] text-white px-4 py-2 rounded hover:bg-blue-900"
            >
              Calcular muestra
            </button>
          </form>

          {/* Resultados */}
          {result && (
            <div className="mt-6 p-4 bg-green-100 border rounded">
              <h3 className="font-semibold mb-2">Resultado:</h3>
              <p>
                <strong>Tamaño de muestra:</strong> {result.sampleSize}
              </p>
              {result.factorConfianza && (
                <p>
                  <strong>Factor de confianza:</strong> {result.factorConfianza}
                </p>
              )}
              {result.picks && (
                <p>
                  <strong>Índices seleccionados:</strong>{" "}
                  {result.picks.join(", ")}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {tab === "controles" && (
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-bold mb-2">Muestreo de Controles</h2>
          <p className="text-gray-600">
            Aquí mostraremos el flujo para controles (ocurrencias, frecuencia, etc.).
          </p>
        </div>
      )}
    </div>
  );


}
