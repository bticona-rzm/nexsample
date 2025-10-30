// components/HelpButtonExtraction.tsx - VERSIÓN BALANCEADA
import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface HelpButtonProps {
  context: 
    | 'general' 
    | 'extraction-type'
    | 'high-value-management'
    | 'extraction-parameters'
    | 'sample-field'
    | 'high-value-limit'
    | 'random-start';
  className?: string;
}

export const HelpButton: React.FC<HelpButtonProps> = ({ context, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const helpContent = {
    'general': {
      title: '📊 Módulo de Extracción MUS',
      content: [
        'Genera muestra estadística sistemática',
        '💰 Elementos alto valor: selección automática',
        'Exporta resultados en formato Excel',
        'Algoritmo reproducible estándar'
      ]
    },
    'extraction-type': {
      title: '🔧 Tipo de Extracción',
      content: [
        '<strong>Intervalo Fijo</strong>: Selección sistemática',
        '<strong>Selección Celda</strong>: Método alternativo',
        'Intervalo calculado automáticamente',
        '✅ Recomendado: Intervalo Fijo'
      ]
    },
    'high-value-management': {
      title: '💰 Gestión de Valores Altos',
      content: [
        <><strong>Agregados</strong>: Incluidos en misma muestra</>,
        <><strong>Separado</strong>: Archivo exclusivo alto valor</>,
        'Elementos ≥ intervalo: 100% probabilidad',
        'Límite automático = intervalo muestral'
      ]
    },
    'extraction-parameters': {
      title: '⚙️ Parámetros de Extracción',
      content: [
        'Campo numérico: Valores monetarios',
        '📐 Intervalo muestral: Calculado automático',
        'Punto inicio: Aleatorio reproducible',
        'Valor alto: Define selección automática'
      ]
    },
    'sample-field': {
      title: '📋 Campo de Muestra',
      content: [
        'Columna con valores a muestrear',
        '🔄 Heredado de planificación',
        'Solo campos numéricos válidos',
        'Requerido para extracción'
      ]
    },
    'high-value-limit': {
      title: '💎 Límite de Valor Alto',
      content: [
        <><strong>Automático</strong>: Usa intervalo muestral</>,
        <><strong>Personalizado</strong>: Umbral manual</>,
        'Elementos ≥ límite: 100% selección',
        'Afecta tamaño muestra final'
      ]
    },
    'random-start': {
      title: '🤔 ¿Por qué no coincide con IDEA?',
      content: [
        <><strong>Diferencia esperada</strong></>,
        '• IDEA: Algoritmo propietario',
        '• Nosotros: Estándar abierto verificable', 
        '• Ambos cumplen ISA 530',
        '',
        <><strong>Igualmente válido</strong></>,
        '• Resultados reproducibles',
        '• Metodología estadística sólida',
        '• Auditoría confiable garantizada'
      ]
    }
  };

  const currentHelp = helpContent[context];
  const isMainButton = className.includes('bg-emerald-500');

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          transition-colors duration-200
          ${isMainButton 
            ? 'flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-full shadow w-full' 
            : 'p-1 text-blue-600 hover:text-blue-800'
          }
        `}
        title="Ayuda"
      >
        <HelpCircle size={isMainButton ? 16 : 18} />
        {isMainButton && <span className="text-white">Ayuda</span>}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          
          <div className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-11/12 max-w-md bg-white border border-gray-200 rounded-lg shadow-xl">
            <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 rounded-t-lg">
              <h3 className="text-sm font-semibold text-blue-900">
                {currentHelp.title}
              </h3>
            </div>
            
            <div className="p-4 max-h-96 overflow-y-auto">
              <ul className="space-y-2">
                {currentHelp.content.map((item, index) => (
                  <li key={index} className="text-xs text-gray-700 leading-relaxed">
                    {typeof item === 'string' ? item : item}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="px-4 py-3 bg-gray-50 rounded-b-lg border-t border-gray-200">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm font-medium transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};