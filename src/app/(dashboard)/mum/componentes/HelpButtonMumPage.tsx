// components/HelpButtonMumPage.tsx
import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface HelpButtonProps {
  context: 
    | 'general' 
    | 'file-upload'
    | 'navigation'
    | 'visualizer'
    | 'planification-tab'
    | 'extraction-tab'
    | 'evaluation-tab';
  className?: string;
}

export const HelpButton: React.FC<HelpButtonProps> = ({ context, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const helpContent = {
    'general': {
      title: 'Ayuda - Módulo Muestreo por Unidad Monetaria (MUS)',
      content: [
        '• Sistema completo para planificación, extracción y evaluación de muestras MUS',
        '• Flujo de trabajo: Cargar archivo → Planificar → Extraer → Evaluar',
        '• Cada pestaña representa una etapa del proceso de muestreo',
        '• Los datos se mantienen consistentes entre todas las etapas',
        '• Exporta reportes profesionales con los resultados obtenidos'
      ]
    },
    'file-upload': {
      title: 'Ayuda - Carga de Archivo Excel',
      content: [
        '• Carga archivos Excel (.xlsx, .xls), CSV, XML, DBF o Access',
        '• El archivo debe contener datos numéricos para el campo de valor',
        '• Los headers se detectan automáticamente desde la primera fila',
        '• Una vez cargado, se habilitan las demás funcionalidades',
        '• Puedes cambiar el archivo en cualquier momento'
      ]
    },
    'navigation': {
      title: 'Ayuda - Navegación por Pestañas',
      content: [
        '• Visualizar: Previsualiza los datos del archivo cargado',
        '• Planificación: Define parámetros estadísticos y calcula muestra',
        '• Extracción: Genera la muestra basada en la planificación',
        '• Evaluación: Analiza resultados y genera conclusiones',
        '• Las pestañas se habilitan secuencialmente al completar cada etapa'
      ]
    },
    'visualizer': {
      title: 'Ayuda - Visualización de Datos',
      content: [
        '• Muestra una tabla con todos los datos del archivo cargado',
        '• Paginación automática para archivos grandes',
        '• Búsqueda y filtrado disponible en la tabla',
        '• Verifica que los datos se cargaron correctamente',
        '• Identifica campos numéricos para usar en el muestreo'
      ]
    },
    'planification-tab': {
      title: 'Ayuda - Pestaña Planificación',
      content: [
        '• Define el valor total de la población a muestrear',
        '• Configura nivel de confianza (75-99%)',
        '• Establece error tolerable y error esperado',
        '• Calcula tamaño de muestra e intervalo muestral',
        '• Genera conclusiones sobre la suficiencia muestral'
      ]
    },
    'extraction-tab': {
      title: 'Ayuda - Pestaña Extracción',
      content: [
        '• Selecciona el campo numérico para la extracción',
        '• Configura gestión de valores altos (separados o incluidos)',
        '• Define nombres para archivos de salida',
        '• Genera muestra sistemática basada en intervalo',
        '• Descarga archivos Excel con la muestra extraída'
      ]
    },
    'evaluation-tab': {
      title: 'Ayuda - Pestaña Evaluación',
      content: [
        '• Evalúa resultados usando diferentes métodos estadísticos',
        '• Celda y PPS Clásico: Evaluación separada por tipo de error',
        '• Stringer Bound: Método conservador para límites superiores',
        '• Genera reportes detallados con conclusiones',
        '• Exporta resultados en formato PDF profesional'
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
                  Sistema de Muestreo por Unidad Monetaria - Asistencia profesional.
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