// components/HelpButtonPlanification.tsx
import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

// Actualiza la interfaz para incluir los contextos de planificación
interface HelpButtonProps {
  context: 
    | 'general' 
    | 'mus' 
    | 'cell-classical' 
    | 'stringer-bound'
    | 'population-value'
    | 'configurations'
    | 'error-type'
    | 'tolerable-error'
    | 'expected-error'
    | 'sample-results';
  className?: string;
}

export const HelpButton: React.FC<HelpButtonProps> = ({ context, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Agrega el contenido específico para planificación
  const helpContent = {
    'general': {
      title: 'Ayuda - Módulo de Planificación',
      content: [
        '• Este módulo permite planificar el muestreo por unidad monetaria (MUS)',
        '• Define los parámetros estadísticos para la extracción de la muestra',
        '• Calcula el tamaño de muestra necesario basado en el nivel de confianza y errores',
        '• Genera el intervalo de muestreo para la selección sistemática',
        '• Proporciona conclusiones sobre la suficiencia del tamaño muestral'
      ]
    },
    'mus': {
      title: 'Ayuda - Muestreo por Unidad Monetaria (MUS)',
      content: [
        '• El MUS es una técnica de muestreo estadístico que asigna mayor probabilidad de selección a las partidas de mayor valor',
        '• Cada unidad monetaria (ej: $1) en la población tiene igual probabilidad de ser seleccionada',
        '• Las partidas son seleccionadas proporcionalmente a su valor',
        '• Ideal para la detección de sobrestimaciones en estados financieros',
        '• El intervalo de muestreo se calcula dividiendo el valor total de la población entre el tamaño de muestra deseado'
      ]
    },
    'cell-classical': {
      title: 'Ayuda - Evaluación Celda y PPS Clásico',
      content: [
        '• Método que evalúa separadamente sobrestimaciones y subestimaciones',
        '• Utiliza tablas de factores de confianza para calcular límites de error',
        '• Proporciona resultados más precisos cuando existen errores en ambas direcciones',
        '• Calcula el Error Más Probable (MLE) y Límite Superior de Error (UEL) por separado',
        '• Incluye ajustes por precisión gap widening para estimaciones más conservadoras',
        '• Recomendado cuando se esperan errores tanto por exceso como por defecto'
      ]
    },
    'stringer-bound': {
      title: 'Ayuda - Evaluación Stringer Bound',
      content: [
        '• Método conservador para evaluar el límite superior de error en el muestreo',
        '• Apropiado cuando se encuentran pocos errores o estos son de baja cuantía',
        '• Proporciona una estimación del peor escenario posible',
        '• Calcula un límite superior que no será excedido con el nivel de confianza especificado',
        '• Método tradicional ampliamente aceptado en auditoría',
        '• Recomendado para poblaciones con baja tasa esperada de errores'
      ]
    },
    // NUEVOS CONTEXTOS ESPECÍFICOS DE PLANIFICACIÓN
    'population-value': {
      title: 'Ayuda - Valor de la Población',
      content: [
        '• Define el valor total de la población que será sometida a muestreo',
        '• Puede calcularse automáticamente desde un campo del archivo Excel',
        '• Solo se consideran valores positivos en esta implementación',
        '• El valor debe ser mayor a 0 para realizar la estimación',
        '• Este valor determina el intervalo de muestreo y el tamaño de muestra'
      ]
    },
    'configurations': {
      title: 'Ayuda - Configuraciones de Muestreo',
      content: [
        '• Nivel de confianza: Probabilidad de que los resultados sean correctos (75-99%)',
        '• Tipo de error: Define si los errores se expresan en importe o porcentaje',
        '• Error tolerable: Máximo error aceptable en la población',
        '• Error esperado: Estimación del error que se espera encontrar',
        '• El error esperado debe ser menor que el error tolerable',
        '• La precisión básica se calcula automáticamente al 100%'
      ]
    },
    'error-type': {
      title: 'Ayuda - Tipo de Error',
      content: [
        '• Importe: Los errores se definen en valores absolutos (ej: $1,000)',
        '• Porcentaje: Los errores se definen como porcentaje del valor de la población',
        '• La selección afecta cómo se interpretan los valores de error tolerable y esperado',
        '• Para poblaciones grandes, el porcentaje suele ser más práctico',
        '• El sistema convierte automáticamente entre ambos formatos'
      ]
    },
    'tolerable-error': {
      title: 'Ayuda - Error Tolerable',
      content: [
        '• Representa el máximo error aceptable en la población auditada',
        '• Define el umbral de materialidad para el examen',
        '• Debe ser mayor a 0 y mayor que el error esperado',
        '• En porcentaje: Se expresa como % del valor total de la población',
        '• En importe: Se expresa en la misma moneda de la población',
        '• Valores más pequeños requieren tamaños de muestra más grandes'
      ]
    },
    'expected-error': {
      title: 'Ayuda - Error Esperado',
      content: [
        '• Estimación del error que se anticipa encontrar en la población',
        '• Basado en experiencias anteriores, controles internos, o evaluaciones preliminares',
        '• Debe ser menor que el error tolerable',
        '• Afecta el tamaño de muestra: mayores errores esperados requieren muestras más grandes',
        '• Si no se esperan errores, se puede usar un valor cercano a 0'
      ]
    },
    'sample-results': {
      title: 'Ayuda - Resultados de la Muestra',
      content: [
        '• Tamaño de muestra: Número de partidas que deben examinarse',
        '• Intervalo muestral: Valor usado para la selección sistemática de partidas',
        '• Suma contaminaciones tolerables: Límite de errores aceptables en la muestra',
        '• La conclusión indica si el tamaño muestral es adecuado para los parámetros definidos',
        '• El tamaño mínimo asegura la confiabilidad estadística del examen'
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
          {/* Overlay para cerrar al hacer click fuera - FIXED para evitar scroll */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Tooltip de ayuda - MEJORADO para evitar scroll horizontal */}
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
                  Esta funcionalidad está diseñada para asistir en procesos de muestreo estadístico profesional.
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