// components/HelpButtonSummary.tsx
import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface HelpButtonProps {
  context: 
    | 'general' 
    | 'sampling-parameters'
    | 'population-values'
    | 'results-table'
    | 'cell-classical-results'
    | 'stringer-bound-results'
    | 'overstatements-table'
    | 'understatements-table'
    | 'conclusion'
    | 'pdf-export';
  className?: string;
}

export const HelpButton: React.FC<HelpButtonProps> = ({ context, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const helpContent = {
    'general': {
      title: 'Ayuda - Resumen de Evaluación MUM',
      content: [
        '• Presenta resultados completos del proceso de muestreo y evaluación',
        '• Muestra comparación entre métodos Cell & Classical PPS vs Stringer Bound',
        '• Incluye análisis detallado de sobrestimaciones y subestimaciones',
        '• Proporciona conclusiones basadas en parámetros estadísticos',
        '• Permite exportar reportes profesionales en formato PDF'
      ]
    },
    'sampling-parameters': {
      title: 'Ayuda - Parámetros de Muestreo',
      content: [
        '• Nivel de Confianza: Probabilidad estadística del resultado',
        '• Intervalo Muestral: Espaciado entre elementos seleccionados',
        '• Valor Alto: Umbral para elementos de alto valor',
        '• Precisión Básica: Nivel base de precisión estadística',
        '• Estos parámetros determinan la confiabilidad de los resultados'
      ]
    },
    'population-values': {
      title: 'Ayuda - Valores de Población',
      content: [
        '• Población Excluyendo Valores Altos: Base para muestreo estadístico',
        '• Valor Total Elementos Altos: Suma de elementos de alto valor examinados',
        '• Población Incluyendo Valores Altos: Cobertura completa de la auditoría',
        '• Método de Evaluación: Técnica estadística utilizada',
        '• Estos valores muestran el alcance total del examen'
      ]
    },
    'results-table': {
      title: 'Ayuda - Tabla de Resultados',
      content: [
        '• Resultados Excluyendo Valores Altos: Análisis de la muestra principal',
        '• Sobrestimaciones: Errores por valores mayores a los reales',
        '• Subestimaciones: Errores por valores menores a los reales',
        '• Tamaño de Muestra: Número de elementos examinados',
        '• Número de Errores: Cantidad de discrepancias encontradas'
      ]
    },
    'cell-classical-results': {
      title: 'Ayuda - Resultados Cell & Classical PPS',
      content: [
        '• Evaluación separada de sobrestimaciones y subestimaciones',
        '• Error Más Probable Bruto: Estimación sin ajustes',
        '• Error Más Probable Neto: Estimación con ajustes por contrapartidas',
        '• Precisión Total: Margen de error estadístico',
        '• Límite Error Superior: Máximo error posible con nivel de confianza',
        '• Incluye análisis detallado por etapas de error'
      ]
    },
    'stringer-bound-results': {
      title: 'Ayuda - Resultados Stringer Bound',
      content: [
        '• Método conservador para estimación de límites superiores',
        '• Tamaño Muestra Combinado: Incluye elementos regulares y valores altos',
        '• Enfoque en límites superiores de error',
        '• Resultados más cautelosos que Cell & Classical PPS',
        '• Ideal para auditorías con baja expectativa de errores'
      ]
    },
    'overstatements-table': {
      title: 'Ayuda - Tabla de Overstatements',
      content: [
        '• Error Stage: Etapa del proceso de evaluación',
        '• UEL Factor: Factor de límite superior de error',
        '• Tainting: Porcentaje de error en el elemento',
        '• Average Tainting: Tainting promedio por etapa',
        '• UEL Previous Stage: Límite de etapa anterior',
        '• Load & Spread: Propagación con carga acumulada',
        '• Simple Spread: Propagación simple',
        '• Stage UEL Max: Máximo límite por etapa'
      ]
    },
    'understatements-table': {
      title: 'Ayuda - Tabla de Understatements',
      content: [
        '• Análisis similar a Overstatements pero para subestimaciones',
        '• Total Taintings: Suma total de taintings',
        '• Most Likely Error: Error más probable calculado',
        '• Basic Precision: Precisión básica del muestreo',
        '• Precision Gap Widening: Ampliación de brecha de precisión',
        '• Upper Error Limit: Límite superior de error final'
      ]
    },
    'conclusion': {
      title: 'Ayuda - Conclusión del Resumen',
      content: [
        '• Resumen ejecutivo de los hallazgos principales',
        '• Interpretación de resultados en contexto de materialidad',
        '• Recomendaciones basadas en evidencia estadística',
        '• Consideración de elementos de alto valor',
        '• Base para decisiones de auditoría y reportes'
      ]
    },
    'pdf-export': {
      title: 'Ayuda - Exportación a PDF',
      content: [
        '• Genera reporte profesional en formato PDF',
        '• Incluye todas las tablas y conclusiones',
        '• Formato listo para presentación y archivo',
        '• Mantiene formato y diseño del resumen en pantalla',
        '• Nombre automático con timestamp para organización'
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
                  Módulo de Resumen - Sistema Muestreo por Unidad Monetaria.
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