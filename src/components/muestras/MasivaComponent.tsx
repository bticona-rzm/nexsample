"use client";
import { useState } from "react";

export default function MasivaComponent() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);

  const handleUpload = async () => {
    if (!file) return alert("Seleccione un archivo");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/masiva", { method: "POST", body: formData });
    if (!res.ok) return alert("Error al subir archivo");
    const data = await res.json();
    setPreview(data.preview || []);
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-bold">Carga de Data Masiva</h2>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="border p-2"
      />
      <button
        onClick={handleUpload}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Subir
      </button>

      {preview.length > 0 && (
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr>
                {Object.keys(preview[0]).map((h) => (
                  <th key={h} className="px-4 py-2 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.map((row, i) => (
                <tr key={i}>
                  {Object.values(row).map((val, j) => (
                    <td key={j} className="px-4 py-2">{String(val)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
