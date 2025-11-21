// contexts/LogContextAtributos.tsx
"use client"

import React, { createContext, useContext, useState, useCallback } from 'react';

export interface LogEntryAtributos {
  timestamp: Date;
  action: string;
  details: string;
  user: string;
  module: 'planificación' | 'extracción' | 'evaluación' | 'visualización' | 'general' | 'aleatorio';
  type: 'user' | 'system' | 'error';
}

interface LogContextAtributosType {
  logs: LogEntryAtributos[];
  addLog: (action: string, details: string, module: LogEntryAtributos['module'], type?: 'user' | 'system' | 'error') => void;
  clearLogs: () => void;
  getFormattedLogs: () => string;
  getUserLogs: () => LogEntryAtributos[];
  getSystemLogs: () => LogEntryAtributos[];
}

const LogContextAtributos = createContext<LogContextAtributosType | undefined>(undefined);

export const LogProviderAtributos: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<LogEntryAtributos[]>([]);

  const addLog = useCallback((action: string, details: string, module: LogEntryAtributos['module'], type: 'user' | 'system' | 'error' = 'user') => {
    const newLog: LogEntryAtributos = {
      timestamp: new Date(),
      action,
      details,
      user: 'Usuario',
      module,
      type,
    };
    
    console.log(`📝 LOG ATRIBUTOS [${module} - ${type}]: ${action}`, details);
    setLogs(prev => [...prev, newLog]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const getFormattedLogs = useCallback(() => {
    let formatted = `HISTORIAL DE AUDITORÍA - MUESTREO POR ATRIBUTOS\n`;
    formatted += `Generado: ${new Date().toLocaleString()}\n`;
    formatted += `Usuario: Usuario\n\n`;
    
    logs.forEach((log, index) => {
      const typeLabel = log.type === 'user' ? '[USUARIO]' : log.type === 'system' ? '[SISTEMA]' : '[ERROR]';
      formatted += `${index + 1}. ${log.timestamp.toLocaleString()} - ${typeLabel}\n`;
      formatted += `   Acción: ${log.action}\n`;
      formatted += `   Módulo: ${log.module}\n`;
      formatted += `   Detalles: ${log.details}\n\n`;
    });
    
    return formatted;
  }, [logs]);

  const getUserLogs = useCallback(() => {
    return logs.filter(log => log.type === 'user');
  }, [logs]);

  const getSystemLogs = useCallback(() => {
    return logs.filter(log => log.type === 'system');
  }, [logs]);

  const contextValue: LogContextAtributosType = {
    logs,
    addLog,
    clearLogs,
    getFormattedLogs,
    getUserLogs,
    getSystemLogs,
  };

  return (
    <LogContextAtributos.Provider value={contextValue}>
      {children}
    </LogContextAtributos.Provider>
  );
};

export const useLogAtributos = () => {
  const context = useContext(LogContextAtributos);
  if (context === undefined) {
    throw new Error('useLogAtributos must be used within a LogProviderAtributos');
  }
  return context;
};