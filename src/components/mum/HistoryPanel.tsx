// components/mum/HistoryPanel.tsx
import React, { useState } from 'react';
import { useLog } from '@/contexts/LogContext';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ isOpen, onClose }) => {
  const { logs, getFormattedLogs, clearLogs } = useLog();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'user' | 'system'>('all'); // ✅ NUEVO: Filtro

  // ✅ NUEVO: Filtrar logs según el tipo seleccionado
  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.type === filter;
  });

  const handlePrint = () => {
    const formattedLogs = getFormattedLogs();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Historial de Auditoría MUM</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 20px; 
                line-height: 1.4;
              }
              .header { 
                border-bottom: 2px solid #333; 
                padding-bottom: 10px; 
                margin-bottom: 20px;
              }
              .log-entry { 
                margin-bottom: 20px; 
                padding: 10px; 
                border-left: 4px solid #007acc; 
                background: #f9f9f9;
              }
              .timestamp { 
                color: #666; 
                font-size: 12px; 
                font-weight: bold;
              }
              .action { 
                font-weight: bold; 
                color: #333; 
                margin: 5px 0;
              }
              .details { 
                margin-top: 5px; 
                color: #555; 
                white-space: pre-wrap;
                font-size: 12px;
              }
              .module { 
                display: inline-block; 
                padding: 2px 8px; 
                background: #e0e0e0; 
                border-radius: 4px; 
                font-size: 11px; 
                margin-left: 10px;
              }
              .type-user {
                display: inline-block;
                padding: 2px 8px;
                background: #4CAF50;
                color: white;
                border-radius: 4px;
                font-size: 11px;
                margin-left: 10px;
              }
              .type-system {
                display: inline-block;
                padding: 2px 8px;
                background: #2196F3;
                color: white;
                border-radius: 4px;
                font-size: 11px;
                margin-left: 10px;
              }
              .page-break {
                page-break-after: always;
              }
              .filter-info {
                background: #e3f2fd;
                padding: 8px;
                border-radius: 4px;
                margin-bottom: 15px;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Historial de Auditoría MUM</h1>
              <p><strong>Generado:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Usuario:</strong> Usuario</p>
              <p><strong>Total de acciones:</strong> ${logs.length}</p>
              ${filter !== 'all' ? `<div class="filter-info"><strong>Filtro aplicado:</strong> ${filter === 'user' ? 'Solo acciones del usuario' : 'Solo acciones del sistema'}</div>` : ''}
            </div>
            ${logs.map((log, index) => `
              <div class="log-entry">
                <div class="timestamp">
                  ${index + 1}. ${log.timestamp.toLocaleString()} - ${log.user}
                  <span class="module">${log.module}</span>
                  <span class="${log.type === 'user' ? 'type-user' : 'type-system'}">
                    ${log.type === 'user' ? 'USUARIO' : 'SISTEMA'}
                  </span>
                </div>
                <div class="action">${log.action}</div>
                <div class="details">${log.details}</div>
              </div>
              ${(index + 1) % 10 === 0 ? '<div class="page-break"></div>' : ''}
            `).join('')}
          </body>
        </html>
      `);
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
          <h2 className="text-xl font-bold">Historial de Auditoría MUM</h2>
          <div className="space-x-2">
            {/* ✅ NUEVO: Filtros */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'user' | 'system')}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="all">Todos los logs</option>
              <option value="user">Solo usuario</option>
              <option value="system">Solo sistema</option>
            </select>
            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
            >
              Imprimir
            </button>
            <button
              onClick={handleExport}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm"
            >
              Exportar
            </button>
            <button
              onClick={() => setShowClearConfirm(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm"
            >
              Limpiar
            </button>
            <button
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm"
            >
              Cerrar
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          <div className="mb-4 text-sm text-gray-600 bg-blue-50 p-3 rounded">
            <p><strong>Generado:</strong> {new Date().toLocaleString()}</p>
            <p><strong>Usuario:</strong> Usuario</p>
            <p><strong>Total de acciones registradas:</strong> {logs.length}</p>
            {filter !== 'all' && (
              <p><strong>Filtro aplicado:</strong> {filter === 'user' ? 'Solo acciones del usuario' : 'Solo acciones del sistema'}</p>
            )}
            <p><strong>Mostrando:</strong> {filteredLogs.length} de {logs.length} registros</p>
          </div>
          
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log, index) => (
              <div key={index} className="mb-4 p-3 border-l-4 border-blue-500 bg-gray-50 rounded">
                <div className="text-sm text-gray-500 flex items-center flex-wrap gap-2">
                  <span className="font-mono bg-gray-200 px-2 py-1 rounded">
                    #{index + 1}
                  </span>
                  {log.timestamp.toLocaleString()} - {log.user}
                  <span className="inline-block bg-gray-200 px-2 py-1 rounded text-xs capitalize">
                    {log.module}
                  </span>
                  {/* ✅ NUEVO: Mostrar tipo de log */}
                  <span className={`inline-block px-2 py-1 rounded text-xs text-white ${
                    log.type === 'user' ? 'bg-green-500' : 'bg-blue-500'
                  }`}>
                    {log.type === 'user' ? 'USUARIO' : 'SISTEMA'}
                  </span>
                </div>
                <div className="font-semibold text-gray-800 mt-1">{log.action}</div>
                <div className="text-sm text-gray-600 whitespace-pre-wrap mt-1 bg-white p-2 rounded border">
                  {log.details}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-2">📝</div>
              <p>No hay acciones registradas en el historial</p>
              {filter !== 'all' && (
                <p className="text-sm mt-2">
                  No hay logs {filter === 'user' ? 'del usuario' : 'del sistema'} con el filtro aplicado
                </p>
              )}
              <p className="text-sm mt-2">Las acciones se registrarán automáticamente mientras usas el sistema</p>
            </div>
          )}
        </div>

        {/* Modal de confirmación para limpiar logs */}
        {showClearConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm">
              <h3 className="text-lg font-bold mb-4">¿Limpiar historial?</h3>
              <p className="text-gray-600 mb-4">
                Esta acción eliminará permanentemente todo el historial de auditoría. 
                Esta operación no se puede deshacer.
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleClearLogs}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                >
                  Limpiar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};