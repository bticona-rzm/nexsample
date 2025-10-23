// components/HelpButtonEvaluarAtributos.tsx - VERSIÓN BALANCEADA
import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface HelpButtonProps {
  context: 
    | 'general' 
    | 'inputs'
    | 'results';
  className?: string;
}

export const HelpButtonEvaluarAtributos: React.FC<HelpButtonProps> = ({ context, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const helpContent = {
    'general': {
      title: '📊 Evaluación del Muestreo por Atributos',
      content: [
        'Evalúa resultados del muestreo aleatorio realizado',
        '🎯 Calcula intervalos de confianza para la población',
        'Determina si el control es efectivo estadísticamente',
        'Basado en distribución binomial y tablas de confianza'
      ]
    },
    'inputs': {
      title: '⚙️ Parámetros de Evaluación',
      content: [
        'Desviaciones Observadas: Número real de errores encontrados en la muestra',
        '🎯 Confianza Deseada: Nivel de certeza para la estimación (90%, 95%, 99%)',
        'Tamaño Población/Muestra: Automáticamente cargados de etapas anteriores',
        'La evaluación considera el riesgo de muestreo y variabilidad estadística'
      ]
    },
    'results': {
      title: '📈 Interpretación de Resultados',
      content: [
        'Tasa Desviación Muestra: % de errores en la muestra examinada',
        '📊 Límite Unilateral Superior: Máxima desviación posible en población con confianza dada',
        'Límites Bilaterales: Intervalo de confianza para la tasa real de desviación',
        '✅ Si límite superior ≤ desviación tolerable → Control efectivo',
        '❌ Si límite superior > desviación tolerable → Control requiere atención'
      ]
    }
  };

  const currentHelp = helpContent[context];
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
                    {item}
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