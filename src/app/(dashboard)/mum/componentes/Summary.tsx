import React, { Dispatch, SetStateAction } from 'react';

// Define the types for the props, including the new 'evaluationMethod' and 'onBack' handler
interface SummaryProps {
    isEvaluationDone: boolean;
    confidenceLevel: number;
    sampleInterval: number;
    highValueLimit: number;
    precisionValue: number;
    populationExcludingHigh: number;
    highValueTotal: number;
    populationIncludingHigh: number;
    estimatedSampleSize: number;
    numErrores: number;
    errorMasProbableBruto: number;
    errorMasProbableNeto: number;
    precisionTotal: number;
    limiteErrorSuperiorBruto: number;
    limiteErrorSuperiorNeto: number;
    highValueCountResume: number;
    setActiveTab: Dispatch<SetStateAction<string>>;
    handleSummary: () => Promise<void>;
    evaluationMethod: 'cell-classical' | 'stringer-bound'; // <-- Prop de tipo de evaluación
    onBack: () => void; // <-- Nuevo prop para la función de retroceso
}

const Summary: React.FC<SummaryProps> = ({
    isEvaluationDone,
    confidenceLevel,
    sampleInterval,
    highValueLimit,
    precisionValue,
    populationExcludingHigh,
    highValueTotal,
    populationIncludingHigh,
    estimatedSampleSize,
    numErrores,
    errorMasProbableBruto,
    errorMasProbableNeto,
    precisionTotal,
    limiteErrorSuperiorBruto,
    limiteErrorSuperiorNeto,
    highValueCountResume,
    evaluationMethod,
    onBack, // <-- Se recibe el nuevo prop
}) => {
    // Helper function to format numbers with commas and two decimal places
    const formatNumber = (num: number) => {
        if (typeof num !== 'number' || isNaN(num)) {
            return '0.00';
        }
        return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const handlePrint = () => {
        window.print();
    };

    // Determine the titles and conclusion based on the evaluation method
    const mainTitle = evaluationMethod === 'stringer-bound'
        ? 'Muestreo por Unidad Monetaria - Evaluación Stringer Bound'
        : 'Muestreo por Unidad Monetaria - Evaluación Celda y PPS Clásico';
    
    const sampleSizeLabel = evaluationMethod === 'stringer-bound'
        ? 'Tamaño de muestra combinado'
        : 'Tamaño de muestra';

    const conclusionText = evaluationMethod === 'stringer-bound'
        ? `Con base en la muestra combinada, la sobreestimación total más probable en la población combinada es de ${formatNumber(errorMasProbableNeto)}, y la subestimación total más probable es de ${formatNumber(errorMasProbableBruto)}. Se puede inferir con un nivel de confianza del ${confidenceLevel.toFixed(2)}% que la sobreestimación total en la población combinada no excede ${formatNumber(limiteErrorSuperiorBruto)}, y que la subestimación total no excede ${formatNumber(limiteErrorSuperiorNeto)}.`
        : `Con base en esta muestra, la sobreestimación total más probable en la población es de ${formatNumber(errorMasProbableNeto)}, y la subestimación total más probable es de ${formatNumber(errorMasProbableBruto)}. Se puede inferir con un nivel de confianza del ${confidenceLevel.toFixed(2)}% que la sobreestimación total en la población no excede ${formatNumber(limiteErrorSuperiorBruto)}, y que la subestimación total no excede ${formatNumber(limiteErrorSuperiorNeto)}.`;

    const highValueConclusionText = evaluationMethod === 'cell-classical'
        ? `Además, se han identificado ${highValueCountResume ?? 0} elementos de valor alto que representan un total de ${highValueTotal?.toLocaleString() ?? '0'}, los cuales fueron analizados por separado para asegurar una cobertura completa y confiable.`
        : '';

    const renderCellClassicalTable = () => (
        <tbody className="bg-white divide-y divide-gray-200">
            <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Tamaño de muestra</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{estimatedSampleSize}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{estimatedSampleSize}</td>
            </tr>
            <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Número de errores</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{numErrores}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{numErrores}</td>
            </tr>
            <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Error más probable bruto</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(errorMasProbableBruto)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(errorMasProbableBruto)}</td>
            </tr>
            <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Error más probable neto</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(errorMasProbableNeto)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(errorMasProbableNeto)}</td>
            </tr>
            <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Precisión total</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(precisionTotal)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(precisionTotal)}</td>
            </tr>
            <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Límite de error superior bruto</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(limiteErrorSuperiorBruto)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(limiteErrorSuperiorBruto)}</td>
            </tr>
            <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Límite de error superior neto</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(limiteErrorSuperiorNeto)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(limiteErrorSuperiorNeto)}</td>
            </tr>
            
            {/* New section for Results for High Value Items */}
            <tr className="bg-gray-50">
                <td colSpan={3} className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Resultados para elementos de valor alto
                </td>
            </tr>
            <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Número de elementos de valor alto</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{highValueCountResume}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{highValueCountResume}</td>
            </tr>
            <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Número de errores</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{numErrores}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{numErrores}</td>
            </tr>
            <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Valor de errores</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(errorMasProbableBruto)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(errorMasProbableBruto)}</td>
            </tr>
            {/* New section for Results Including High Value Items */}
            <tr className="bg-gray-50">
                <td colSpan={3} className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Resultados incluyendo elementos de valor alto
                </td>
            </tr>
            <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Número total de elementos examinados</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{(estimatedSampleSize ?? 0) + (highValueCountResume ?? 0)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{(estimatedSampleSize ?? 0) + (highValueCountResume ?? 0)}</td>
            </tr>
            <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Número de errores</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{numErrores}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{numErrores}</td>
            </tr>
            <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Error más probable bruto</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(errorMasProbableBruto)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(errorMasProbableBruto)}</td>
            </tr>
            <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Error más probable neto</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(errorMasProbableNeto)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(errorMasProbableNeto)}</td>
            </tr>
            <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Límite de error superior bruto</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(limiteErrorSuperiorBruto)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(limiteErrorSuperiorBruto)}</td>
            </tr>
            <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Límite de error superior neto</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(limiteErrorSuperiorNeto)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(limiteErrorSuperiorNeto)}</td>
            </tr>
        </tbody>
    );
    
    const renderStringerBoundTable = () => (
        <tbody className="bg-white divide-y divide-gray-200">
            <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sampleSizeLabel}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{estimatedSampleSize}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{estimatedSampleSize}</td>
            </tr>
            <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Número de errores</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{numErrores}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{numErrores}</td>
            </tr>
            <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Error más probable bruto</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(errorMasProbableBruto)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(errorMasProbableBruto)}</td>
            </tr>
            <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Error más probable neto</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(errorMasProbableNeto)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(errorMasProbableNeto)}</td>
            </tr>
            <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Precisión total</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(precisionTotal)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(precisionTotal)}</td>
            </tr>
            <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Límite de error superior bruto</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(limiteErrorSuperiorBruto)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(limiteErrorSuperiorBruto)}</td>
            </tr>
            <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Límite de error superior neto</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(limiteErrorSuperiorNeto)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(limiteErrorSuperiorNeto)}</td>
            </tr>
            {/* New section for Results for High Value Items */}
            <tr className="bg-gray-50">
                <td colSpan={3} className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Resultados para elementos de valor alto
                </td>
            </tr>
            <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Número de elementos de valor alto</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{highValueCountResume}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{highValueCountResume}</td>
            </tr>
            <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Número de errores</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{numErrores}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{numErrores}</td>
            </tr>
            <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Valor de errores</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(errorMasProbableBruto)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(errorMasProbableBruto)}</td>
            </tr>
            {/* New section for Results Including High Value Items */}
            <tr className="bg-gray-50">
                <td colSpan={3} className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Resultados incluyendo elementos de valor alto
                </td>
            </tr>
            <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Número total de elementos examinados</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{(estimatedSampleSize ?? 0) + (highValueCountResume ?? 0)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{(estimatedSampleSize ?? 0) + (highValueCountResume ?? 0)}</td>
            </tr>
            <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Número de errores</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{numErrores}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{numErrores}</td>
            </tr>
            <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Error más probable bruto</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(errorMasProbableBruto)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(errorMasProbableBruto)}</td>
            </tr>
            <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Error más probable neto</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(errorMasProbableNeto)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(errorMasProbableNeto)}</td>
            </tr>
            <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Límite de error superior bruto</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(limiteErrorSuperiorBruto)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(limiteErrorSuperiorBruto)}</td>
            </tr>
            <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Límite de error superior neto</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(limiteErrorSuperiorNeto)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(limiteErrorSuperiorNeto)}</td>
            </tr>
        </tbody>
    );

    // Componente para la tabla detallada de Understatements
    const UnderstatementsTable = () => (
        <div className="mt-8">
            <h4 className="text-xl font-semibold text-gray-600 mb-2">Subestimaciones</h4>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Etapa</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Factor UEL</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tainting</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Promedio de Tainting</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UEL de Etapa Previa</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Carga y Propagación</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Propagación Simple</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UEL Máximo de Etapa</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">0</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2.1102</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">0.0000</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">0.0000</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2.1102</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2.1102</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2.1102</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2.1102</td>
                        </tr>
                        <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">1</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">1.7001</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">0.0000</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">0.0000</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">3.8103</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">1.7001</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">1.7001</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">1.7001</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            {/* Contenido fuera de la tabla */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-y-2 gap-x-8">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Total Taintings:</span>
                        <span className="text-sm text-gray-900">0.0000</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">UEL de Etapa:</span>
                        <span className="text-sm text-gray-900">2.1102</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Intervalo Muestral:</span>
                        <span className="text-sm text-gray-900">{formatNumber(sampleInterval)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Precisión Básica:</span>
                        <span className="text-sm text-gray-900">{formatNumber(precisionValue)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Error Más Probable:</span>
                        <span className="text-sm text-gray-900">0.0000</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Límite de Error Superior:</span>
                        <span className="text-sm text-gray-900">711,526.8588</span>
                    </div>
                </div>
            </div>
        </div>
    );

    // Componente para la tabla detallada de Overstatements
    const OverstatementsTable = () => (
        <div className="mt-8">
            <h4 className="text-xl font-semibold text-gray-600 mb-2">Sobreestimaciones</h4>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Etapa</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Factor UEL</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tainting</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Promedio de Tainting</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UEL de Etapa Previa</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Carga y Propagación</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Propagación Simple</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UEL Máximo de Etapa</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">0</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2.1102</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">0.0000</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">0.0000</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2.1102</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2.1102</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2.1102</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2.1102</td>
                        </tr>
                        <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">1</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">1.7001</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">0.0000</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">0.0000</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">3.8103</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">1.7001</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">1.7001</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">1.7001</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            {/* Contenido fuera de la tabla */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-y-2 gap-x-8">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Total Taintings:</span>
                        <span className="text-sm text-gray-900">0.0000</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">UEL de Etapa:</span>
                        <span className="text-sm text-gray-900">2.1102</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Intervalo Muestral:</span>
                        <span className="text-sm text-gray-900">{formatNumber(sampleInterval)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Precisión Básica:</span>
                        <span className="text-sm text-gray-900">{formatNumber(precisionValue)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Error Más Probable:</span>
                        <span className="text-sm text-gray-900">0.0000</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Límite de Error Superior:</span>
                        <span className="text-sm text-gray-900">711,526.8588</span>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div>
            {!isEvaluationDone ? (
                <div className="p-4 text-center text-gray-500">
                    Debes completar el proceso de evaluación para ver el resumen.
                </div>
            ) : (
                <>
                    {/* Contenedor principal del resumen */}
                    <div className="p-6 bg-white rounded-lg shadow-md space-y-6">
                        
                        {/* Título y Resumen General */}
                        <div className="page-break">
                            <h2 className="text-2xl font-bold text-center text-gray-800">{mainTitle}</h2>
                            <h3 className="text-xl font-semibold text-center text-gray-600 mb-4">Resumen</h3>
                            <div className="p-4 bg-gray-50 rounded-lg shadow-inner">
                                <div className="grid grid-cols-2 gap-y-4 gap-x-12 mb-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-700">Nivel de confianza:</span>
                                        <span className="text-sm font-bold text-gray-900">{confidenceLevel.toFixed(2)}%</span>
                                    </div>
                                    {/* Conditionally render Sample Interval and Basic Precision */}
                                    {evaluationMethod === 'cell-classical' && (
                                        <>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-gray-700">Intervalo muestral:</span>
                                                <span className="text-sm font-bold text-gray-900">{formatNumber(sampleInterval)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-gray-700">Precisión básica:</span>
                                                <span className="text-sm font-bold text-gray-900">{formatNumber(precisionValue)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-gray-700">Valor alto:</span>
                                                <span className="text-sm font-bold text-gray-900">{highValueLimit.toLocaleString()}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-700">Valor de población excluyendo valores altos:</span>
                                        <span className="text-sm font-bold text-gray-900">{formatNumber(populationExcludingHigh)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-700">Valor total de elementos de valor alto:</span>
                                        <span className="text-sm font-bold text-gray-900">{formatNumber(highValueTotal)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-700">Valor de población incluyendo elementos de valor alto:</span>
                                        <span className="text-sm font-bold text-gray-900">{formatNumber(populationIncludingHigh)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Segunda página: Tablas de resultados */}
                        <div className="page-break mt-8">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Resultados sin elementos de valor alto
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Sobreestimaciones
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Subestimaciones
                                            </th>
                                        </tr>
                                    </thead>
                                    {evaluationMethod === 'cell-classical' ? renderCellClassicalTable() : renderStringerBoundTable()}
                                </table>
                            </div>
                            
                            {/* Renderizar tablas detalladas solo para Cell and PPS Classic */}
                            {evaluationMethod === 'cell-classical' && (
                                <>
                                    <OverstatementsTable />
                                    <UnderstatementsTable />
                                </>
                            )}
                        </div>

                        {/* Tercera página: Conclusiones */}
                        <div>
                            <div className="mt-8 p-6 bg-blue-50 border-l-4 border-blue-400 text-blue-800 rounded-r-lg">
                                <h4 className="text-lg font-bold mb-2">Conclusión:</h4>
                                <p className="text-sm leading-relaxed">{conclusionText}</p>
                                {highValueConclusionText && (
                                    <p className="mt-2 text-sm leading-relaxed">{highValueConclusionText}</p>
                                )}
                            </div>
                        </div>
                    </div>
                    {isEvaluationDone && (
                        <div className="flex justify-center mt-6 space-x-4 print-hidden">
                            <button
                                onClick={onBack}
                                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105"
                            >
                                Atrás
                            </button>
                            <button
                                onClick={handlePrint}
                                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 print-button"
                            >
                                Guardar en PDF
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Summary;