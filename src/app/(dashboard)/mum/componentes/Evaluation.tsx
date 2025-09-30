// src/app/components/mum/evaluation/Evaluation.tsx (¡El archivo que ya tenías!)

import React, { useState, Dispatch, SetStateAction } from 'react';
import CellClassicalPPSForm from './CellClassicalPPS'; 
import StringerBoundForm from './StringerBound'; 
import Summary from './Summary'; 

// Props del componente principal - MODIFICAMOS handleEvaluation
interface EvaluationProps {
    isExtraccionDone: boolean;
    confidenceLevel: number;
    sampleInterval: number;
    highValueLimit: number;
    precisionValue: number;
    setPrecisionValue: (value: number) => void;
    populationExcludingHigh: number;
    highValueTotal: number;
    populationIncludingHigh: number;
    estimatedSampleSize: number;
    estimatedPopulationValue: number;
    numErrores: number;
    errorMasProbableBruto: number;
    errorMasProbableNeto: number;
    precisionTotal: number;
    limiteErrorSuperiorBruto: number;
    limiteErrorSuperiorNeto: number;
    highValueCountResume: number;
    headers: string[]; 
    setActiveTab: Dispatch<SetStateAction<string>>;
    // handleEvaluation AHORA DEBE ACEPTAR EL MÉTODO
    handleEvaluation: (method: 'cell-classical' | 'stringer-bound') => Promise<void>; 
    tolerableError:number;
}

const Evaluation: React.FC<EvaluationProps> = (props) => {
    const [selectedMethod, setSelectedMethod] = useState<'cell-classical' | 'stringer-bound'>('cell-classical');
    const [showSummary, setShowSummary] = useState(false);

    const [evaluationResults, setEvaluationResults] = useState<any>(null);
    const handleEvaluationProcess = async (method: 'cell-classical' | 'stringer-bound') => {
        try {
            // Aquí llamarías a tu API real y guardarías los resultados
            const results = await props.handleEvaluation(method); // Esto debería devolver resultados reales
            setEvaluationResults(results);
            setShowSummary(true);
        } catch (error) {
            console.error("Error durante la evaluación:", error);
            alert("Ocurrió un error al realizar la evaluación.");
        }
    };

    const handleBack = () => {
        setShowSummary(false); 
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">MUM - Evaluación</h2>
            
            {/* Opciones de evaluación */}
            {!showSummary && (
                <div className="flex justify-center mb-6">
                    {/* ... (Botones de selección del método - Código sin cambios) ... */}
                    <div className="relative inline-flex rounded-full bg-gray-200 p-1">
                        <button
                            onClick={() => setSelectedMethod('cell-classical')}
                            className={`py-2 px-4 rounded-full text-sm font-medium transition-colors duration-300 ${
                                selectedMethod === 'cell-classical' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            Evaluación Celda y PPS Clásico
                        </button>
                        <button
                            onClick={() => setSelectedMethod('stringer-bound')}
                            className={`py-2 px-4 rounded-full text-sm font-medium transition-colors duration-300 ${
                                selectedMethod === 'stringer-bound' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            Evaluación Stringer Bound
                        </button>
                    </div>
                </div>
            )}

            {/* Renderizar el formulario - AHORA PASAMOS handleEvaluationProcess */}
            {!showSummary && (
                <>
                    {selectedMethod === 'cell-classical' && (
                        <CellClassicalPPSForm 
                            // Pasar el handleEvaluationProcess modificado que acepta el método
                            onOk={handleEvaluationProcess} 
                            confidenceLevel={props.confidenceLevel}
                            precisionValue={props.precisionValue}
                            setPrecisionValue={props.setPrecisionValue}
                            estimatedPopulationValue={props.estimatedPopulationValue}
                            estimatedSampleSize={props.estimatedSampleSize}
                            sampleInterval={props.sampleInterval} // Debes tener este valor de la planificación
                            tolerableError={props.tolerableError} // Debes tener este valor de la planificación  
                            highValueLimit={props.highValueLimit} // Generalmente es igual a sampleInterval
                        />
                    )}
                    {selectedMethod === 'stringer-bound' && (
                        <StringerBoundForm 
                            // Pasar el handleEvaluationProcess modificado que acepta el método
                            onOk={handleEvaluationProcess} 
                            confidenceLevel={props.confidenceLevel}
                            estimatedPopulationValue={props.estimatedPopulationValue}
                            estimatedSampleSize={props.estimatedSampleSize}
                        />
                    )}
                </>
            )}

            {/* Mostrar el resumen (código sin cambios) */}
            {showSummary && (
                <Summary 
                    isEvaluationDone={props.isExtraccionDone} 
                    confidenceLevel={props.confidenceLevel}
                    sampleInterval={props.sampleInterval}
                    highValueLimit={props.highValueLimit}
                    precisionValue={props.precisionValue}
                    populationExcludingHigh={props.populationExcludingHigh}
                    highValueTotal={props.highValueTotal}
                    populationIncludingHigh={props.populationIncludingHigh}
                    estimatedSampleSize={props.estimatedSampleSize}
                    numErrores={props.numErrores}
                    errorMasProbableBruto={props.errorMasProbableBruto}
                    errorMasProbableNeto={props.errorMasProbableNeto}
                    precisionTotal={props.precisionTotal}
                    limiteErrorSuperiorBruto={props.limiteErrorSuperiorBruto}
                    limiteErrorSuperiorNeto={props.limiteErrorSuperiorNeto}
                    highValueCountResume={props.highValueCountResume}
                    setActiveTab={props.setActiveTab}
                    // handleSummary/handleEvaluation ahora deberá aceptar el método si lo necesita
                    handleSummary={() => props.handleEvaluation(selectedMethod)} // Adaptamos el handleSummary
                    evaluationMethod={selectedMethod} 
                    onBack={handleBack}
                />
            )}
        </div>
    );
};

export default Evaluation;