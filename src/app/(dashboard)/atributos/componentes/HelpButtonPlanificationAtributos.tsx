// components/HelpButtonPlanificationAtributos.tsx - VERSIÓN CON LOGS
import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { useLogAtributos } from '@/contexts/LogContextAtributos'; // ✅ Añadir import

interface HelpButtonProps {
  context: 
    | 'general' 
    | 'control-type'
    | 'key-parameters'
    | 'results';
  className?: string;
}

export const HelpButtonPlanificationAtributos: React.FC<HelpButtonProps> = ({ context, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { addLog } = useLogAtributos(); // ✅ Añadir contexto de logs

  const helpContent = {
    'general': {
      title: '📋 Planificación de Muestreo por Atributos',
      content: [
        '🎯 Calcula tamaño de muestra para controles de cumplimiento',
        'Basado en tablas de muestreo estadístico estándar',
        'Define parámetros de riesgo y confianza',
        'Genera conclusión sobre suficiencia muestral'
      ]
    },
    'control-type': {
      title: '⚖️ Tipo de Control de Riesgo',
      content: [
        '📊 Riesgo Beta (Muestreo): Solo considera riesgo de muestreo',
        'Riesgo Beta y Alfa (Control Interno): Considera ambos riesgos',
        '⚠️ Beta: Riesgo de concluir que el control funciona cuando no es así',
        '⚠️ Alfa: Riesgo de rechazar incorrectamente un control que funciona'
      ]
    },
    'key-parameters': {
      title: '🎯 Parámetros Clave del Muestreo',
      content: [
        '👥 Tamaño Población: Número total de elementos',
        '📈 Desviación Esperada: % de errores anticipados (0-5% típico)',
        '🎯 Desviación Tolerable: Máximo % aceptable (5-10% típico)',
        '✅ Confianza Beta: Probabilidad de detección (90%, 95%, 99%)',
        'Confianza Alfa: Solo para controles internos'
      ]
    },
    'results': {
      title: '📊 Interpretación de Resultados',
      content: [
        '👥 Tamaño Muestra: Elementos a examinar',
        'Desviaciones Críticas: Límite para considerar control efectivo',
        '📋 Tabla Confianza: Relación desviaciones vs. nivel confianza',
        '✅ Conclusión: Si no se excede el límite crítico, el control es efectivo'
      ]
    }
  };

  const currentHelp = helpContent[context];
  const isMainButton = className.includes('bg-emerald-500');

  const handleHelpClick = () => {
    // ✅ AÑADIR LOG CUANDO SE ABRE LA AYUDA
    addLog(
      'Usuario solicitó ayuda en planificación',
      `Contexto: ${context}\nTítulo: ${currentHelp.title}`,
      'planificación',
      'user'
    );
    setIsOpen(!isOpen);
  };

  const handleCloseHelp = () => {
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onClick={handleHelpClick}
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
          <div className="fixed inset-0 z-40" onClick={handleCloseHelp} />
          
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
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="px-4 py-3 bg-gray-50 rounded-b-lg border-t border-gray-200">
              <button
                onClick={handleCloseHelp}
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