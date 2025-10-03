// contexts/LogContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';

export interface LogEntry {
  timestamp: Date;
  action: string;
  details: string;
  user: string;
  module: 'planification' | 'extraction' | 'evaluation';
}

interface LogContextType {
  logs: LogEntry[];
  addLog: (action: string, details: string, module: LogEntry['module']) => void;
  clearLogs: () => void;
  getFormattedLogs: () => string;
}

const LogContext = createContext<LogContextType | undefined>(undefined);

export const LogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = useCallback((action: string, details: string, module: LogEntry['module']) => {
    const newLog: LogEntry = {
      timestamp: new Date(),
      action,
      details,
      user: 'Usuario',
      module,
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
      formatted += `${index + 1}. ${log.timestamp.toLocaleString()} - ${log.user}\n`;
      formatted += `   Acción: ${log.action}\n`;
      formatted += `   Módulo: ${log.module}\n`;
      formatted += `   Detalles: ${log.details}\n\n`;
    });
    
    return formatted;
  }, [logs]);

  const contextValue: LogContextType = {
    logs,
    addLog,
    clearLogs,
    getFormattedLogs,
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