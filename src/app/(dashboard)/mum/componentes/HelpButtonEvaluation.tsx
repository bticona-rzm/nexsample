// components/HelpButtonEvaluation.tsx
import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface HelpButtonProps {
  context: 
    | 'general' 
    | 'method-selection'
    | 'cell-classical-method'
    | 'stringer-bound-method'
    | 'file-upload'
    | 'field-selection'
    | 'sample-configuration'
    | 'high-value-management'
    | 'precision-limits'
    | 'summary'
    // ✅ NUEVOS CONTEXTOS ESPECÍFICOS PARA STRINGER BOUND
    | 'stringer-files-config'
    | 'stringer-basic-precision'
    | 'stringer-result-config';
  className?: string;
}

export const HelpButton: React.FC<HelpButtonProps> = ({ context, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const helpContent = {
    'general': {
      title: 'Ayuda - Módulo de Evaluación MUM',
      content: [
        '• Evalúa los resultados del muestreo usando métodos estadísticos avanzados',
        '• Compara valores contables vs valores auditados para detectar errores',
        '• Calcula límites de error y precisión estadística',
        '• Genera reportes detallados con conclusiones profesionales',
        '• Soporte para elementos de alto valor y muestras complejas'
      ]
    },
    'method-selection': {
      title: 'Ayuda - Selección de Método',
      content: [
        '• Cell & Classical PPS: Evaluación separada de sobrestimaciones y subestimaciones',
        '• Stringer Bound: Método conservador para límites superiores de error',
        '• Cell: Ideal cuando se esperan errores en ambas direcciones',
        '• Classical PPS: Método tradicional con evaluación clásica',
        '• Stringer Bound: Conservador, apropiado para pocos errores',
        '• Selecciona según el tipo de población y objetivos de auditoría'
      ]
    },
    'cell-classical-method': {
      title: 'Ayuda - Método Cell & Classical PPS',
      content: [
        '• Evalúa sobrestimaciones y subestimaciones por separado',
        '• Utiliza tablas de factores de confianza para cálculos precisos',
        '• Calcula Error Más Probable (MLE) y Límite Superior de Error (UEL)',
        '• Incluye ajustes por precisión gap widening',
        '• Proporciona análisis detallado por etapas de error',
        '• Recomendado para poblaciones con errores en ambas direcciones'
      ]
    },
    'stringer-bound-method': {
      title: 'Ayuda - Método Stringer Bound',
      content: [
        '• Método conservador para estimar límites superiores de error',
        '• Apropiado cuando se encuentran pocos errores en la muestra',
        '• Proporciona estimaciones del peor escenario posible',
        '• Ampliamente aceptado en prácticas de auditoría tradicionales',
        '• Calcula límites superiores usando factores de confianza',
        '• Ideal para poblaciones con baja tasa esperada de errores',
        '• Método más simple pero conservador en resultados'
      ]
    },
    'file-upload': {
      title: 'Ayuda - Carga de Archivos',
      content: [
        '• Archivo Principal: Contiene la muestra extraída para evaluación',
        '• Archivo Valores Altos: Elementos de alto valor examinados separadamente',
        '• Formatos soportados: Excel (.xlsx, .xls), CSV, XML',
        '• Los archivos deben contener campos numéricos para book value y audited value',
        '• Verifica que los datos estén en formato correcto antes de cargar'
      ]
    },
    'field-selection': {
      title: 'Ayuda - Selección de Campos',
      content: [
        '• Book Value Field: Columna con los valores contables del libro mayor',
        '• Audited Value Field: Columna con los valores verificados en auditoría',
        '• Reference Field: Campo opcional para identificación de elementos',
        '• Los campos deben ser numéricos para cálculos estadísticos',
        '• Asegúrate de que los campos coincidan entre archivos principales y de valores altos'
      ]
    },
    'sample-configuration': {
      title: 'Ayuda - Configuración de Muestra',
      content: [
        '• Nivel de Confianza: Probabilidad estadística (heredado de planificación)',
        '• Valor Población: Total de la población muestreada',
        '• Tamaño Muestra: Número de elementos en la muestra',
        '• Precisión Básica: Nivel base de precisión (normalmente 100%)',
        '• Estos parámetros se heredan automáticamente de etapas anteriores'
      ]
    },
    'high-value-management': {
      title: 'Ayuda - Gestión de Valores Altos',
      content: [
        '• Archivo Separado: Elementos de alto valor en archivo independiente',
        '• Evaluación Integrada: Valores altos se incluyen en el análisis general',
        '• Campos Específicos: Define book value y audited value para valores altos',
        '• Referencia: Campo opcional para identificación de elementos de alto valor',
        '• Los valores altos tienen impacto significativo en los resultados finales'
      ]
    },
    'precision-limits': {
      title: 'Ayuda - Límites de Precisión',
      content: [
        '• Superior: Calcula solo el límite superior de error',
        '• Superior e Inferior: Calcula ambos límites (superior e inferior)',
        '• Disponible solo en evaluación Classical PPS',
        '• Límites inferiores útiles para detectar subestimaciones significativas',
        '• Selecciona según los objetivos específicos de la auditoría'
      ]
    },
    'summary': {
      title: 'Ayuda - Resumen de Evaluación',
      content: [
        '• Muestra resultados estadísticos completos de la evaluación',
        '• Incluye errores más probables y límites de error',
        '• Proporciona conclusiones basadas en parámetros de materialidad',
        '• Exporta reportes en formato PDF profesional',
        '• Permite comparar diferentes métodos de evaluación'
      ]
    },
    // ✅ NUEVOS CONTEXTOS ESPECÍFICOS PARA STRINGER BOUND
    'stringer-files-config': {
      title: 'Ayuda - Configuración de Archivos - Stringer Bound',
      content: [
        '• Archivos a Evaluar: Selecciona los archivos de muestra para análisis',
        '• Múltiples Archivos: Puedes evaluar varios archivos simultáneamente',
        '• Nombre del Archivo: Selecciona el archivo principal para análisis',
        '• Nombre del Resultado: Define cómo se llamará el reporte de resultados',
        '• Los archivos deben contener datos de muestra válidos para evaluación'
      ]
    },
    'stringer-basic-precision': {
      title: 'Ayuda - Precisión Básica - Stringer Bound',
      content: [
        '• Valor Población Muestreada: Total de la población bajo examen',
        '• Tamaño de Muestra: Número de elementos seleccionados para auditoría',
        '• Precisión Básica: Calculada automáticamente basada en nivel de confianza',
        '• Factores de Confianza: Usados según estándares de auditoría (80%, 90%, 95%, 99%)',
        '• Estos valores se heredan de la planificación y extracción previas'
      ]
    },
    'stringer-result-config': {
      title: 'Ayuda - Configuración de Resultados - Stringer Bound',
      content: [
        '• Nivel de Confianza: Define la certeza estadística del resultado',
        '• Parámetros Heredados: Valores de planificación usados automáticamente',
        '• Configuración Simplificada: Stringer Bound requiere menos parámetros que Cell & Classical',
        '• Enfoque Conservador: Resultados tienden a ser más cautelosos',
        '• Ideal para auditorías donde se espera baja tasa de error'
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
                  Módulo de Evaluación - Sistema Muestreo por Unidad Monetaria.
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