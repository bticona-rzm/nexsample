// components/HelpButtonExtraction.tsx
import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface HelpButtonProps {
  context: 
    | 'general' 
    | 'extraction-type'
    | 'high-value-management'
    | 'extraction-parameters'
    | 'sample-field'
    | 'sample-interval'
    | 'random-start'
    | 'high-value-limit'
    | 'value-table'
    | 'filename';
  className?: string;
}

export const HelpButton: React.FC<HelpButtonProps> = ({ context, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const helpContent = {
    'general': {
      title: 'Ayuda - Módulo de Extracción MUM',
      content: [
        '• Genera la muestra estadística basada en la planificación realizada',
        '• Selecciona elementos usando muestreo sistemático por unidad monetaria',
        '• Maneja elementos de alto valor según la configuración definida',
        '• Exporta archivos Excel con la muestra y valores altos',
        '• Utiliza algoritmo de IDEA para consistencia en resultados'
      ]
    },
    'extraction-type': {
      title: 'Ayuda - Tipo de Extracción',
      content: [
        '• Intervalo Fijo: Selección sistemática usando intervalo constante',
        '• Selección de Celda: Método alternativo para casos específicos',
        '• El intervalo se calcula automáticamente desde la planificación',
        '• Recomendado: Intervalo Fijo para la mayoría de aplicaciones',
        '• Mantiene consistencia con estándares de auditoría'
      ]
    },
    'high-value-management': {
      title: 'Ayuda - Gestión de Valores Altos',
      content: [
        '• Agregados a la muestra: Incluye valores altos en el mismo archivo',
        '• Archivo separado: Crea archivo exclusivo para elementos de alto valor',
        '• Valores altos tienen 100% de probabilidad de selección',
        '• Límite automático: Intervalo muestral (recomendado)',
        '• Límite personalizado: Define umbral específico si es necesario'
      ]
    },
    'extraction-parameters': {
      title: 'Ayuda - Parámetros de Extracción',
      content: [
        '• Campo numérico: Selecciona la columna con valores monetarios',
        '• Intervalo muestral: Calculado automáticamente de la planificación',
        '• Punto inicio aleatorio: Generado con algoritmo de IDEA',
        '• Semilla basada en intervalo para reproducibilidad',
        '• Puede modificarse manualmente si se requiere'
      ]
    },
    'sample-field': {
      title: 'Ayuda - Campo de Muestra',
      content: [
        '• Selecciona la columna que contiene los valores a muestrear',
        '• Se hereda automáticamente de la planificación',
        '• Solo muestra campos con datos numéricos válidos',
        '• Asegúrate que los datos estén en formato numérico',
        '• Campo requerido para realizar la extracción'
      ]
    },
    'sample-interval': {
      title: 'Ayuda - Intervalo Muestral',
      content: [
        '• Calculado como: Valor población / Tamaño muestra',
        '• Define el espaciado entre elementos seleccionados',
        '• También sirve como límite para valores altos',
        '• No editable - proviene de cálculos estadísticos',
        '• Base para el algoritmo de selección sistemática'
      ]
    },
    'random-start': {
      title: 'Ayuda - Punto de Inicio Aleatorio',
      content: [
        '• Generado automáticamente usando algoritmo de IDEA',
        '• Semilla basada en el intervalo muestral',
        '• Garantiza reproducibilidad de la selección',
        '• Rango: 1 hasta el valor del intervalo',
        '• Puede modificarse para casos específicos'
      ]
    },
    'high-value-limit': {
      title: 'Ayuda - Límite de Valor Alto',
      content: [
        '• Automático: Usa el intervalo muestral (recomendado)',
        '• Personalizado: Define umbral específico manualmente',
        '• Elementos ≥ límite se seleccionan con 100% probabilidad',
        '• Afecta el tamaño final de la muestra',
        '• Considera impacto en eficiencia de auditoría'
      ]
    },
    'value-table': {
      title: 'Ayuda - Tabla de Valores',
      content: [
        '• Muestra resumen de la población por tipo de valor',
        '• Positivos: Valores mayores a cero',
        '• Negativos: Valores menores a cero (no disponibles)',
        '• Absolutos: Valor absoluto de todos los registros',
        '• Útil para verificar integridad de datos'
      ]
    },
    'filename': {
      title: 'Ayuda - Nombre de Archivo',
      content: [
        '• Define el nombre del archivo Excel de salida',
        '• Se agrega automáticamente extensión .xlsx',
        '• Usa nombres descriptivos para fácil identificación',
        '• Para valores altos separados: nombre específico',
        '• Evita caracteres especiales que puedan causar errores'
      ]
    }
  };

  const currentHelp = helpContent[context];

  // Determinar si es el botón principal (con texto)
  const isMainButton = className.includes('bg-gray-400');

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          transition-colors duration-200
          ${isMainButton 
            ? 'flex items-center justify-center gap-2 bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-full shadow w-full' 
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
          {/* Overlay para cerrar al hacer click fuera */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Tooltip de ayuda */}
          <div className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-11/12 max-w-md bg-white border border-gray-200 rounded-lg shadow-xl">
            {/* Header */}
            <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 rounded-t-lg">
              <h3 className="text-sm font-semibold text-blue-900">
                {currentHelp.title}
              </h3>
            </div>
            
            {/* Content */}
            <div className="p-4 max-h-96 overflow-y-auto">
              <ul className="space-y-2">
                {currentHelp.content.map((item, index) => (
                  <li key={index} className="text-xs text-gray-700 leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
              
              {/* Footer */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 italic">
                  Módulo de Extracción - Sistema Muestreo por Unidad Monetaria.
                </p>
              </div>
            </div>
            
            {/* Botón de cierre */}
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