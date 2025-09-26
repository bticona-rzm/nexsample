"use client"

import { useState, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAlert } from '@/hooks/useAlert';
import { useConfirm } from '@/hooks/useConfirm';
import type { GrupoDeDocumentos, Documento } from '@/lib/types';

// --- ÍCONOS SVG ---
const UploadIcon = () => ( <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /> </svg> );
const TrashIcon = () => ( <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /> </svg> );
const SpinnerIcon = () => ( <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg> );
const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
);


const StatusBadge = ({ indexed, total }: { indexed: number; total: number }) => {
  const percentage = total > 0 ? (indexed / total) * 100 : 0;
  let colorClasses = 'bg-gray-100 text-gray-800';
  
  if (total > 0) {
    if (percentage === 100) colorClasses = 'bg-green-100 text-green-800';
    else if (percentage > 0) colorClasses = 'bg-yellow-100 text-yellow-800';
    else colorClasses = 'bg-red-100 text-red-800';
  }

  return (
    <span className={`ml-4 rounded-full px-3 py-1 text-xs font-semibold ${colorClasses}`}>
      Indexados: {indexed}/{total}
    </span>
  );
};


export default function IndexarNormativaClient({ initialGroups }: { initialGroups: GrupoDeDocumentos[] }) {
  const router = useRouter();
  const [archivosSeleccionados, setArchivosSeleccionados] = useState<FileList | null>(null);
  const [nombreCarpeta, setNombreCarpeta] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [indexingId, setIndexingId] = useState<number | null>(null);
  const { showAlert } = useAlert();
  const { ask } = useConfirm();

  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>(() =>
    initialGroups.reduce((acc, grupo) => {
      acc[grupo.carpeta] = true;
      return acc;
    }, {} as Record<string, boolean>)
  );

  const toggleFolder = (carpeta: string) => {
    setOpenFolders(prev => ({ ...prev, [carpeta]: !prev[carpeta] }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setArchivosSeleccionados(files);
      // @ts-ignore
      const relativePath = files[0].webkitRelativePath;
      setNombreCarpeta(relativePath.split('/')[0]);
    } else {
      setArchivosSeleccionados(null);
      setNombreCarpeta('');
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!archivosSeleccionados || archivosSeleccionados.length === 0) {
      showAlert('Por favor, selecciona una carpeta para cargar.', 'error');
      return;
    }
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('folderName', nombreCarpeta);
    for (let i = 0; i < archivosSeleccionados.length; i++) {
      formData.append('files', archivosSeleccionados[i]);
    }
    try {
      const response = await fetch('/api/documentos', { method: 'POST', body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Ocurrió un error al cargar la carpeta.');
      
      let alertMessage = result.message;
      if (result.omittedFiles && result.omittedFiles.length > 0) {
        alertMessage += `\n\nArchivos omitidos:\n- ${result.omittedFiles.join('\n- ')}`;
      }
      showAlert(alertMessage, 'success');
      router.refresh();
    } catch (error: any) {
      showAlert(error.message, 'error');
    } finally {
      setIsSubmitting(false);
      setArchivosSeleccionados(null);
      setNombreCarpeta('');
      (e.target as HTMLFormElement).reset();
    }
  };

  const handleDelete = async (id: number) => { 
    const confirmed = await ask('Confirmar Eliminación', '¿Estás seguro? Esta acción es irreversible.');
    if (!confirmed) return;
    try {
      const deleteResponse = await fetch(`/api/documentos/${id}`, { method: 'DELETE' });
      if (deleteResponse.ok) {
        showAlert('Documento eliminado correctamente.', 'success');
        router.refresh();
      } else {
        const result = await deleteResponse.json();
        throw new Error(result.error || 'Error al eliminar el documento.');
      }
    } catch (error: any) {
      showAlert(error.message, 'error');
    }
  };

  const handleIndexToggle = async (doc: Documento) => { 
    if (doc.isIndexed) {
      showAlert('Este documento ya fue indexado.', 'warning');
      return;
    }
    setIndexingId(doc.id);
    try {
      const response = await fetch('/api/indexar-documento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: doc.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Falló la indexación del documento.');

      const updateResponse = await fetch(`/api/documentos/${doc.id}`, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isIndexed: true }),
      });
      if (!updateResponse.ok) {
        const updateResult = await updateResponse.json();
        throw new Error(updateResult.error || 'El documento fue indexado, pero falló al actualizar su estado.');
      }
      showAlert(result.message, 'success');
      router.refresh();
    } catch (error: any) {
      showAlert(error.message, 'error');
    } finally {
      setIndexingId(null);
    }
  };

  // Esta variable ahora SÍ se usará en el JSX de abajo.
  const selectionText = nombreCarpeta 
    ? `Carpeta: ${nombreCarpeta} (${archivosSeleccionados?.length} archivos)`
    : 'Seleccionar una carpeta...';

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800">Carga de Normativa</h1>
      <p className="mt-2 mb-6 text-gray-600">
        Seleccione una carpeta completa para cargar la normativa que será analizada.
      </p>
      
      <form onSubmit={handleSubmit} className="mb-8 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <label htmlFor="folder-upload" className="flex-grow cursor-pointer rounded-md border border-dashed border-gray-300 p-3 text-center text-gray-500 transition hover:border-blue-500 hover:bg-gray-50">
            <span className="flex items-center justify-center">
              <UploadIcon />
              {/* --- CORRECCIÓN APLICADA AQUÍ --- */}
              {selectionText}
            </span>
            <input 
              id="folder-upload" 
              type="file" 
              onChange={handleFileChange} 
              className="sr-only" 
              webkitdirectory="true"
              multiple 
            />
          </label>
          <button
            type="submit"
            disabled={isSubmitting || !archivosSeleccionados}
            className="w-full rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <SpinnerIcon/> : 'Añadir a la lista'}
          </button>
        </div>
      </form>

      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Documentos Cargados</h2>
      <div className="space-y-4">
        {initialGroups.map((grupo) => {
          const totalDocs = grupo.documentos.length;
          const indexedDocs = grupo.documentos.filter(doc => doc.isIndexed).length;
          const isOpen = !!openFolders[grupo.carpeta];

          return (
            <div key={grupo.carpeta} className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden transition-all duration-300">
              <button
                onClick={() => toggleFolder(grupo.carpeta)}
                className="w-full flex justify-between items-center p-4 text-left bg-gray-50 hover:bg-gray-100 transition focus:outline-none"
                aria-expanded={isOpen}
              >
                <div className="flex items-center">
                  <h3 className="text-xl font-semibold text-gray-800">{grupo.carpeta}</h3>
                  <StatusBadge indexed={indexedDocs} total={totalDocs} />
                </div>
                <ChevronDownIcon className={`transform text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
              </button>

              {isOpen && (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50 border-t border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nombre</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Fecha de Carga</th>
                        <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Estado</th>
                        <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {grupo.documentos.map((doc) => (
                        <tr key={doc.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-blue-600 hover:underline">
                            <a href={doc.filePath} target="_blank" rel="noopener noreferrer">{doc.name}</a>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{doc.date}</td>
                          <td className="px-6 py-4 text-center flex justify-center">
                            <button onClick={() => handleIndexToggle(doc)} disabled={indexingId === doc.id} className={`flex w-28 justify-center items-center rounded-full px-3 py-1 text-xs font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-wait ${ doc.isIndexed ? 'bg-green-500' : 'bg-red-500' }`}>
                              {indexingId === doc.id ? <SpinnerIcon/> : (doc.isIndexed ? 'Indexado' : 'Indexar')}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button onClick={() => handleDelete(doc.id)} className="rounded-md bg-gray-700 p-2 text-white transition hover:bg-gray-600" aria-label="Eliminar documento">
                              <TrashIcon />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}