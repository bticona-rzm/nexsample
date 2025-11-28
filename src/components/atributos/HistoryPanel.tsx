// components/atributos/HistoryPanel.tsx
import React, { useState, useEffect } from 'react';
import { useLogAtributos } from '@/contexts/LogContextAtributos';
import { apiClient } from '@/lib/apiClient';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onReproduce?: (sample: any) => void; // Callback para reproducir
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ isOpen, onClose, onReproduce }) => {
  const { logs, getFormattedLogs, clearLogs } = useLogAtributos();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'session' | 'saved'>('saved'); // Default to saved history
  const [savedHistory, setSavedHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [filter, setFilter] = useState<'all' | 'user' | 'system' | 'error'>('all');

  // Cargar historial guardado al abrir
  useEffect(() => {
    if (isOpen && activeTab === 'saved') {
      fetchHistory();
    }
  }, [isOpen, activeTab]);

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const history = await apiClient.atributos.getHistory();
      setSavedHistory(history);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Filtrar logs de sesión
  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.type === filter;
  });

  const handlePrint = () => {
    // ... (Lógica de impresión existente para logs)
    const formattedLogs = getFormattedLogs();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`<html><body><pre>${formattedLogs}</pre></body></html>`);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleExport = () => {
    const formattedLogs = getFormattedLogs();
    const blob = new Blob([formattedLogs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historial-mum-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearLogs = () => {
    clearLogs();
    setShowClearConfirm(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-11/12 h-5/6 flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Historial y Auditoría</h2>

          {/* Tabs Selector */}
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-3 py-1 rounded ${activeTab === 'saved' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Muestras Guardadas
            </button>
            <button
              onClick={() => setActiveTab('session')}
              className={`px-3 py-1 rounded ${activeTab === 'session' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Logs de Sesión
            </button>
          </div>

          <div className="space-x-2">
            {activeTab === 'session' && (
              <>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value="all">Todos</option>
                  <option value="user">Usuario</option>
                  <option value="system">Sistema</option>
                </select>
                <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">Imprimir</button>
                <button onClick={handleExport} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm">Exportar</button>
                <button onClick={() => setShowClearConfirm(true)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm">Limpiar</button>
              </>
            )}
            <button onClick={onClose} className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm">Cerrar</button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 bg-gray-50">
          {activeTab === 'saved' ? (
            // --- VISTA DE MUESTRAS GUARDADAS ---
            <div>
              {isLoadingHistory ? (
                <p className="text-center py-4">Cargando historial...</p>
              ) : savedHistory.length === 0 ? (
                <p className="text-center py-4 text-gray-500">No hay muestras guardadas.</p>
              ) : (
                <div className="space-y-4">
                  {savedHistory.map((item) => (
                    <div key={item.id} className="bg-white p-4 rounded shadow border-l-4 border-purple-500 flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg">{item.name}</h3>
                        <p className="text-sm text-gray-600">
                          📅 {new Date(item.createdAt).toLocaleString()} |
                          📄 {item.records} registros |
                          🌱 Semilla: {item.seed}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Hash: {item.hash}</p>
                        <p className="text-xs text-gray-500">Fuente: {item.source} ({item.tipo})</p>
                      </div>
                      <div className="flex flex-col space-y-2">
                        {onReproduce && (
                          <button
                            onClick={() => onReproduce(item)}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                          >
                            🔄 Reproducir
                          </button>
                        )}
                        {/* TODO: Botón para descargar Excel original si se guardó */}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // --- VISTA DE LOGS DE SESIÓN ---
            <div>
              {/* ... (Código existente de logs) ... */}
              <div className="mb-4 text-sm text-gray-600 bg-blue-50 p-3 rounded">
                <p><strong>Total:</strong> {logs.length} | <strong>Mostrando:</strong> {filteredLogs.length}</p>
              </div>

              {filteredLogs.length > 0 ? (
                filteredLogs.map((log, index) => (
                  <div key={index} className="mb-4 p-3 border-l-4 border-blue-500 bg-white rounded shadow-sm">
                    <div className="text-sm text-gray-500 flex items-center flex-wrap gap-2">
                      <span className="font-mono bg-gray-200 px-2 py-1 rounded">#{index + 1}</span>
                      {log.timestamp.toLocaleString()} - {log.user}
                      <span className={`inline-block px-2 py-1 rounded text-xs text-white ${log.type === 'user' ? 'bg-green-500' : log.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                        }`}>
                        {log.type.toUpperCase()}
                      </span>
                    </div>
                    <div className="font-semibold text-gray-800 mt-1">{log.action}</div>
                    <div className="text-sm text-gray-600 whitespace-pre-wrap mt-1 bg-gray-50 p-2 rounded border">
                      {log.details}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No hay logs que coincidan con el filtro.</p>
              )}
            </div>
          )}
        </div>

        {/* Modal de confirmación para limpiar logs */}
        {showClearConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm">
              <h3 className="text-lg font-bold mb-4">¿Limpiar historial?</h3>
              <p className="text-gray-600 mb-4">Esta acción eliminará los logs de esta sesión.</p>
              <div className="flex justify-end space-x-2">
                <button onClick={() => setShowClearConfirm(false)} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">Cancelar</button>
                <button onClick={handleClearLogs} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">Limpiar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
