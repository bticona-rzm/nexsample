// components/HelpButtonAleatorioAtributos.tsx - VERSIÓN CON LOGS
import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { useLogAtributos } from '@/contexts/LogContextAtributos'; // ✅ Añadir import

interface HelpButtonProps {
  context: 
    | 'general' 
    | 'parameters'
    | 'results';
  className?: string;
}

export const HelpButtonAleatorioAtributos: React.FC<HelpButtonProps> = ({ context, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { addLog } = useLogAtributos(); // ✅ Añadir contexto de logs

  const helpContent = {
    'general': {
      title: '🎲 Generación de Muestra Aleatoria',
      content: [
        'Genera muestra aleatoria simple del dataset',
        '🔄 Usa algoritmo de selección reproducible',
        'Permite controlar rango y duplicados',
        'Exporta resultados a Excel para auditoría'
      ]
    },
    'parameters': {
      title: '⚙️ Parámetros de la Muestra',
      content: [
        'Número de Registros: Cantidad de elementos a seleccionar',
        '🔑 Semilla Aleatoria: Número para reproducir misma muestra',
        'Registro Inicial/Final: Define subconjunto de la población',
        'Permitir Duplicados: Habilita selección con reemplazo',
        '📝 Nombre Archivo: Identificador para el archivo de salida'
      ]
    },
    'results': {
      title: '📊 Resultados y Exportación',
      content: [
        'Muestra visualizada en tabla interactiva',
        'Scroll horizontal/vertical para navegar datos',
        '📤 Exportación a Excel mantiene formato original',
        'Muestra reproducible usando misma semilla',
        '✅ Ideal para procedimientos de auditoría'
      ]
    }
  };

  const currentHelp = helpContent[context];
  const isMainButton = className.includes('bg-emerald-500');

  const handleHelpClick = () => {
    // ✅ AÑADIR LOG CUANDO SE ABRE LA AYUDA
    addLog(
      'Usuario solicitó ayuda en muestreo aleatorio',
      `Contexto: ${context}\nTítulo: ${currentHelp.title}`,
      'aleatorio',
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