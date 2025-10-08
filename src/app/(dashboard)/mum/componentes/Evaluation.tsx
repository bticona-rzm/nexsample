// src/app/components/mum/evaluation/Evaluation.tsx

import React, { useState, Dispatch, SetStateAction } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CellClassicalPPSForm from './CellClassicalPPS'; 
import StringerBoundForm from './StringerBound'; 
import Summary from './Summary'; 

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
    handleEvaluation: (method: 'cell-classical' | 'stringer-bound') => Promise<void>; 
    tolerableError:number;
    selectedField: string | null;
}

const Evaluation: React.FC<EvaluationProps> = (props) => {
    const [selectedMethod, setSelectedMethod] = useState<'cell-classical' | 'stringer-bound'>('cell-classical');
    const [showSummary, setShowSummary] = useState(false);
    const [evaluationResults, setEvaluationResults] = useState<any>(null);

    const handleEvaluationProcess = async (method: 'cell-classical' | 'stringer-bound') => {
        try {
            const results = await props.handleEvaluation(method);
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
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
                MUM - Evaluación
            </h2>
            
            {/* Toggle Switch Animado - Solo se muestra cuando NO hay summary */}
            <AnimatePresence>
                {!showSummary && (
                    <motion.div 
                        className="flex justify-center mb-8"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="relative bg-gray-100 rounded-full p-1 shadow-inner">
                            {/* Fondo deslizante */}
                            <motion.div
                                className="absolute top-1 bottom-1 bg-blue-600 rounded-full shadow-md"
                                initial={false}
                                animate={{
                                    left: selectedMethod === 'cell-classical' ? '4px' : '50%',
                                    width: 'calc(50% - 8px)'
                                }}
                                transition={{
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 30
                                }}
                            />
                            
                            {/* Botones */}
                            <button
                                onClick={() => setSelectedMethod('cell-classical')}
                                className={`relative z-10 py-3 px-8 rounded-full text-sm font-medium transition-colors duration-200 ${
                                    selectedMethod === 'cell-classical' 
                                        ? 'text-white' 
                                        : 'text-gray-600 hover:text-gray-800'
                                }`}
                            >
                                Cell & Classical PPS
                            </button>
                            
                            <button
                                onClick={() => setSelectedMethod('stringer-bound')}
                                className={`relative z-10 py-3 px-8 rounded-full text-sm font-medium transition-colors duration-200 ${
                                    selectedMethod === 'stringer-bound' 
                                        ? 'text-white' 
                                        : 'text-gray-600 hover:text-gray-800'
                                }`}
                            >
                                Stringer Bound
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Contenido que se desliza - Solo formularios cuando NO hay summary */}
            <AnimatePresence mode="wait">
                {!showSummary && (
                    <motion.div
                        key={selectedMethod}
                        initial={{ opacity: 0, x: selectedMethod === 'cell-classical' ? -20 : 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: selectedMethod === 'cell-classical' ? -20 : 20 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                        {selectedMethod === 'cell-classical' && (
                            <CellClassicalPPSForm 
                                onOk={handleEvaluationProcess} 
                                confidenceLevel={props.confidenceLevel}
                                precisionValue={props.precisionValue}
                                setPrecisionValue={props.setPrecisionValue}
                                estimatedPopulationValue={props.estimatedPopulationValue}
                                estimatedSampleSize={props.estimatedSampleSize}
                                sampleInterval={props.sampleInterval}
                                tolerableError={props.tolerableError}
                                highValueLimit={props.highValueLimit}
                                selectedField={props.selectedField}
                            />
                        )}
                        {selectedMethod === 'stringer-bound' && (
                            <StringerBoundForm 
                                onOk={handleEvaluationProcess} 
                                confidenceLevel={props.confidenceLevel}
                                estimatedPopulationValue={props.estimatedPopulationValue}
                                estimatedSampleSize={props.estimatedSampleSize}
                                sampleInterval={props.sampleInterval}
                                tolerableError={props.tolerableError}
                                highValueLimit={props.highValueLimit}
                                precisionValue={props.precisionValue}
                                setPrecisionValue={props.setPrecisionValue}
                                selectedField={props.selectedField}
                            />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mostrar el resumen - Solo cuando showSummary es true */}
            <AnimatePresence>
                {showSummary && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Summary 
                            isEvaluationDone={props.isExtraccionDone} 
                            confidenceLevel={props.confidenceLevel}
                            sampleInterval={props.sampleInterval}
                            highValueLimit={props.highValueLimit}
                            precisionValue={props.precisionValue}
                            populationExcludingHigh={props.estimatedPopulationValue}
                            highValueTotal={props.highValueTotal}
                            populationIncludingHigh={props.estimatedPopulationValue}
                            estimatedSampleSize={props.estimatedSampleSize}
                            numErrores={props.numErrores}
                            errorMasProbableBruto={props.errorMasProbableBruto}
                            errorMasProbableNeto={props.errorMasProbableNeto}
                            precisionTotal={props.precisionTotal}
                            limiteErrorSuperiorBruto={props.limiteErrorSuperiorBruto}
                            limiteErrorSuperiorNeto={props.limiteErrorSuperiorNeto}
                            highValueCountResume={props.highValueCountResume}
                            setActiveTab={props.setActiveTab}
                            handleSummary={() => props.handleEvaluation(selectedMethod)}
                            evaluationMethod={selectedMethod} 
                            onBack={handleBack}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Evaluation;