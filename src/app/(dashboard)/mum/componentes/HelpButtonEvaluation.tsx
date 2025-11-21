// components/HelpButtonEvaluation.tsx - VERSIÓN BALANCEADA
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
    | 'stringer-files-config'
    | 'stringer-basic-precision'
    | 'stringer-result-config';
  className?: string;
}

export const HelpButton: React.FC<HelpButtonProps> = ({ context, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const helpContent = {
    'general': {
      title: '📊 Módulo de Evaluación MUS',
      content: [
        'Evalúa resultados del muestreo estadístico',
        'Compara valores contables vs auditados',
        '🎯 Calcula límites de error y precisión',
        'Genera reportes profesionales',
        'Soporte elementos alto valor'
      ]
    },
    'method-selection': {
      title: '🎯 Selección de Método',
      content: [
        '<strong>Cell & Classical PPS</strong>: Evaluación separada',
        '<strong>Stringer Bound</strong>: Método conservador',
        'Cell: Errores ambas direcciones',
        'Classical PPS: Método tradicional',
        'Stringer: Pocos errores esperados'
      ]
    },
    'cell-classical-method': {
      title: '📈 Método Cell & Classical PPS',
      content: [
        'Evalúa sobre/subestimaciones separado',
        'Usa factores confianza estándar',
        'Calcula Error Más Probable (MLE)',
        'Calcula Límite Superior (UEL)',
        '✅ Recomendado errores ambas direcciones'
      ]
    },
    'stringer-bound-method': {
      title: '🛡️ Método Stringer Bound',
      content: [
        'Método conservador límites superiores',
        'Apropiado pocos errores muestra',
        'Estimaciones peor escenario',
        'Ampliamente aceptado auditoría',
        'Ideal baja tasa errores esperada'
      ]
    },
    'file-upload': {
      title: '📁 Carga de Archivos',
      content: [
        '<strong>Archivo Principal</strong>: Muestra extraída',
        '<strong>Archivo Valores Altos</strong>: Elementos alto valor',
        'Formatos: Excel, CSV, XML',
        'Campos numéricos book/audited value',
        'Verificar formato datos correcto'
      ]
    },
    'field-selection': {
      title: '🔍 Selección de Campos',
      content: [
        '<strong>Book Value</strong>: Valores contables libro mayor',
        '<strong>Audited Value</strong>: Valores verificados auditoría',
        'Reference: Campo opcional identificación',
        'Campos deben ser numéricos',
        'Coincidir entre archivos principales/altos'
      ]
    },
    'sample-configuration': {
      title: '⚙️ Configuración de Muestra',
      content: [
        'Nivel Confianza: Probabilidad estadística',
        '💰 Valor Población: Total población muestreada',
        'Tamaño Muestra: Elementos en muestra',
        'Precisión Básica: Nivel base precisión',
        'Parámetros heredados automáticamente'
      ]
    },
    'high-value-management': {
      title: '💰 Gestión de Valores Altos',
      content: [
        '<strong>Archivo Separado</strong>: Elementos independiente',
        '<strong>Evaluación Integrada</strong>: Incluidos análisis',
        'Campos específicos book/audited value',
        'Reference: Identificación elementos',
        'Impacto significativo resultados finales'
      ]
    },
    'precision-limits': {
      title: '📐 Límites de Precisión',
      content: [
        '<strong>Superior</strong>: Solo límite superior error',
        '<strong>Superior/Inferior</strong>: Ambos límites',
        'Disponible Classical PPS',
        'Límites inferiores detectan subestimaciones',
        'Seleccionar según objetivos auditoría'
      ]
    },
    'stringer-files-config': {
      title: '📋 Configuración Archivos - Stringer',
      content: [
        'Archivos Evaluar: Selecciona muestras análisis',
        'Múltiples Archivos: Evaluación simultánea',
        'Nombre Archivo: Selecciona archivo principal',
        'Nombre Resultado: Define reporte resultados',
        'Archivos deben contener datos válidos'
      ]
    },
    'stringer-basic-precision': {
      title: '📊 Precisión Básica - Stringer',
      content: [
        'Valor Población: Total población examen',
        'Tamaño Muestra: Elementos seleccionados',
        'Precisión Básica: Calculada automáticamente',
        'Factores Confianza: Estándares auditoría',
        'Valores heredados planificación'
      ]
    },
    'stringer-result-config': {
      title: '🎯 Configuración Resultados - Stringer',
      content: [
        'Nivel Confianza: Certeza estadística',
        'Parámetros Heredados: Valores automáticos',
        'Configuración Simplificada: Menos parámetros',
        'Enfoque Conservador: Resultados cautelosos',
        'Ideal baja tasa error esperada'
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