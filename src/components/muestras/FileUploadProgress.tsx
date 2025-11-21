"use client";

import { useState } from "react";

export default function FileUploadProgress({ onUploadComplete }: { onUploadComplete?: (data: any) => void }) {
  const [progress, setProgress] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("datasetName", file.name);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/muestra");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setProgress(percent);
      }
    };

    xhr.onload = () => {
      setLoading(false);
      setProgress(100);

      try {
        const response = JSON.parse(xhr.responseText);
        if (onUploadComplete) onUploadComplete(response); // 👈 devolvemos dataset al padre
      } catch (err) {
        console.error("Error parseando respuesta:", err);
      }
    };

    xhr.onerror = () => {
      setLoading(false);
      alert("❌ Error al cargar el archivo");
    };

    xhr.send(formData);
  };

  return (
    <div className="space-y-2">
      <input
        type="file"
        accept=".xlsx,.csv,.json,.xml,.txt"
        onChange={handleFileUpload}
        className="hidden"
        id="fileUploadInput"
      />

      <button
        type="button"
        onClick={() => document.getElementById("fileUploadInput")?.click()}
        className="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow transition-colors"
      >
        📂 Cargar Datos
      </button>

      {loading && (
        <div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600">{progress}% cargado...</p>
        </div>
      )}
    </div>
  );
}
