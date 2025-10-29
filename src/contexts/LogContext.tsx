// contexts/LogContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';

export interface LogEntry {
  timestamp: Date;
  action: string;
  details: string;
  user: string;
  module: 'planificación' | 'extracción' | 'evaluación' | 'cabecera' | 'visualización' | 'general';
  type: 'user' | 'system';
}

interface LogContextType {
  logs: LogEntry[];
  addLog: (action: string, details: string, module: LogEntry['module'], type: 'user' | 'system') => void;
  clearLogs: () => void;
  getFormattedLogs: () => string;
  getUserLogs: () => LogEntry[]; // ✅ NUEVO: filtrar solo logs de usuario
  getSystemLogs: () => LogEntry[]; // ✅ NUEVO: filtrar solo logs del sistema
}

const LogContext = createContext<LogContextType | undefined>(undefined);

export const LogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = useCallback((action: string, details: string, module: LogEntry['module'], type: 'user' | 'system' = 'user') => {
    const newLog: LogEntry = {
      timestamp: new Date(),
      action,
      details,
      user: 'Usuario',
      module,
      type,
    };
    
    setLogs(prev => [...prev, newLog]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const getFormattedLogs = useCallback(() => {
    let formatted = `HISTORIAL DE AUDITORÍA MUM\n`;
    formatted += `Generado: ${new Date().toLocaleString()}\n`;
    formatted += `Usuario: Usuario\n\n`;
    
    logs.forEach((log, index) => {
      const typeLabel = log.type === 'user' ? '[USUARIO]' : '[SISTEMA]'; // ✅ AGREGAR TIPO
      formatted += `${index + 1}. ${log.timestamp.toLocaleString()} - ${typeLabel}\n`;
      formatted += `   Acción: ${log.action}\n`;
      formatted += `   Módulo: ${log.module}\n`;
      formatted += `   Detalles: ${log.details}\n\n`;
    });
    
    return formatted;
  }, [logs]);

  // ✅ NUEVO: Filtrar logs de usuario
  const getUserLogs = useCallback(() => {
    return logs.filter(log => log.type === 'user');
  }, [logs]);

  // ✅ NUEVO: Filtrar logs del sistema
  const getSystemLogs = useCallback(() => {
    return logs.filter(log => log.type === 'system');
  }, [logs]);

  const contextValue: LogContextType = {
    logs,
    addLog,
    clearLogs,
    getFormattedLogs,
    getUserLogs,
    getSystemLogs,
  };

  return (
    <LogContext.Provider value={contextValue}>
      {children}
    </LogContext.Provider>
  );
};

export const useLog = () => {
  const context = useContext(LogContext);
  if (context === undefined) {
    throw new Error('useLog must be used within a LogProvider');
  }
  return context;
};