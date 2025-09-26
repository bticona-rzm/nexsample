"use client"

import { useState, FormEvent } from 'react';

export default function FileUploadCard({ onFileUploaded }: { onFileUploaded: (fileName: string) => void }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedFile) {
      onFileUploaded(selectedFile.name);
      (e.target as HTMLFormElement).reset();
      setSelectedFile(null);
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Cargado de Muestra</h1>
      <form onSubmit={handleSubmit}>
        <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center">
          <label htmlFor="archivo_excel" className="block text-sm font-medium text-gray-700 mb-2">
            Selecciona un archivo Excel
          </label>
          <input 
            type="file" 
            name="archivo_excel" 
            id="archivo_excel" 
            className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
            required 
            onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])}
          />
          <p className="text-xs text-gray-500 mt-2">Formatos: .xls, .xlsx</p>
        </div>
        <div className="mt-6 text-center">
          <button type="submit" className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Cargar Archivo
          </button>
        </div>
      </form>
    </div>
  );
}