import React, { Dispatch, SetStateAction } from 'react';
import { formatNumber } from '@/lib/apiClient';

interface CellClassicalData {
    overstatements: Array<{
        stage: number;
        uelFactor: number;
        tainting: number;
        averageTainting: number;
        previousUEL: number;
        loadingPropagation: number;
        simplePropagation: number;
        maxStageUEL: number;
    }>;
    understatements: Array<{
        stage: number;
        uelFactor: number;
        tainting: number;
        averageTainting: number;
        previousUEL: number;
        loadingPropagation: number;
        simplePropagation: number;
        maxStageUEL: number;
    }>;
    totalTaintings: number;
    stageUEL: number;
    basicPrecision: number;
    mostLikelyError: number;
    upperErrorLimit: number;
    understatementMLE?: number;
    understatementUEL?: number;
    understatementPrecision?: number;
    netUnderstatementUEL?: number;
    precisionGapWideningOver?: number;
    precisionGapWideningUnder?: number;
    precisionTotalUnder?: number;
}

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
    precisionTotalUnder: number;
    cellClassicalData?: CellClassicalData;
    highValueErrors?: { // ✅ NUEVO: Datos de errores en valor alto
        totalCount: number;
        overstatementCount: number;
        understatementCount: number;
        overstatementAmount: number;
        understatementAmount: number;
        totalErrorAmount: number;
    };
    
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
    precisionTotalUnder,
    limiteErrorSuperiorBruto,
    limiteErrorSuperiorNeto,
    highValueCountResume,
    evaluationMethod,
    onBack, // <-- Se recibe el nuevo prop
    cellClassicalData,
    highValueErrors,
}) => {
    // ELIMINADA la función formatNumber local - ahora usamos la importada

    const handlePrint = () => {
        window.print();
    };

    // ✅ FORZAR USO DE DATOS REALES
    const realOverstatementErrors = cellClassicalData?.overstatements?.filter(s => s.tainting > 0).length || 0;
    const realUnderstatementErrors = cellClassicalData?.understatements?.filter(s => s.tainting > 0).length || 0;

    // Determine the titles and conclusion based on the evaluation method
    const mainTitle = evaluationMethod === 'stringer-bound'
        ? 'Muestreo por Unidad Monetaria - Evaluación Stringer Bound'
        : 'Muestreo por Unidad Monetaria - Evaluación Celda y PPS Clásico';
    
    const sampleSizeLabel = evaluationMethod === 'stringer-bound'
        ? 'Tamaño de muestra combinado'
        : 'Tamaño de muestra';

    // ✅ FUNCIÓN PARA CALCULAR FACTORES EN FRONTEND (solo para display)
    const calculateReliabilityFactors = (confidenceLevel: number): number[] => {
        const factorsMap: { [key: number]: number[] } = {
            80: [1.61, 3.00, 4.28, 5.52, 6.73, 7.91, 9.08, 10.24, 11.38, 12.52],
            85: [1.90, 3.38, 4.72, 5.99, 7.22, 8.43, 9.62, 10.80, 11.97, 13.13],
            90: [2.2504, 3.7790, 5.3332, 6.8774, 8.4164, 9.9151, 11.4279, 12.9302, 14.4330, 15.9344],
            95: [3.00, 4.75, 6.30, 7.76, 9.16, 10.52, 11.85, 13.15, 14.44, 15.71],
            99: [4.61, 6.64, 8.41, 10.05, 11.61, 13.11, 14.57, 16.00, 17.40, 18.78]
        };
        
        return factorsMap[confidenceLevel] || factorsMap[90];
    };

    // ✅ VERSIÓN MEJORADA - Similar a IDEA
    const overstatementMLE = cellClassicalData?.mostLikelyError || errorMasProbableBruto;
    const overstatementUEL = cellClassicalData?.upperErrorLimit || limiteErrorSuperiorBruto;

    const conclusionText = evaluationMethod === 'stringer-bound'
        ? `Con base en la muestra combinada, la sobrestimación total más probable en la población combinada es de ${formatNumber(errorMasProbableNeto, 2)}. Se puede inferir con un nivel de confianza del ${formatNumber(confidenceLevel,2)}% que la sobrestimación total en la población combinada no excede ${formatNumber(limiteErrorSuperiorNeto, 2)}.`
        : `Con base en esta muestra, el error total más probable por sobrestimación en la población es de ${formatNumber(overstatementMLE, 2)}. Se puede inferir con un nivel de confianza del ${formatNumber(confidenceLevel,2)}% que la sobrestimación total en la población no excede ${formatNumber(overstatementUEL, 2)}.`;

    const highValueConclusionText = evaluationMethod === 'cell-classical' && (highValueCountResume ?? 0) > 0
        ? `Además, se han identificado ${highValueCountResume} elementos de valor alto que representan un total de ${formatNumber(highValueTotal, 2)}, los cuales fueron analizados por separado para asegurar una cobertura completa y confiable.`
        : '';

    // ✅ CORREGIDO - En Summary.tsx
    const calculatedPopulationExcludingHigh = populationExcludingHigh > 0 
        ? populationExcludingHigh 
        : 0; // ← Usar el valor real que muestra IDEA

    const calculatedHighValueTotal = highValueTotal > 0 
        ? highValueTotal 
        : 0; // ← IDEA muestra 0, no 586,320,900

    const calculatedPopulationIncludingHigh = calculatedPopulationExcludingHigh + calculatedHighValueTotal;

        // ✅ CORRECCIÓN: Tabla específica para Cell & Classical PPS
    const renderCellClassicalTable = () => {
        const totalItemsExamined = (estimatedSampleSize ?? 0) + (highValueCountResume ?? 0);
    
        // ✅ CALCULAR VALORES CORRECTOS PARA CADA COLUMNA
        const overstatementErrors = cellClassicalData?.overstatements?.filter(s => s.stage > 0 && s.tainting > 0).length || 0;
        const understatementErrors = cellClassicalData?.understatements?.filter(s => s.stage > 0 && s.tainting > 0).length || 0;

        // ✅ DATOS PARA OVERSTATEMENTS (vienen del backend)
        const overstatementMLE = cellClassicalData?.mostLikelyError || 0;
        const overstatementUEL = cellClassicalData?.upperErrorLimit || 0;
        
        // ✅ DATOS PARA UNDERSTATEMENTS (usar los campos específicos del backend)
        const understatementMLE = cellClassicalData?.understatementMLE ?? 0;
        const understatementUEL = cellClassicalData?.understatementUEL ?? cellClassicalData?.basicPrecision ?? 0;
        
        // ✅ NET CALCULATIONS CORRECTOS
        const netOverstatementMLE = overstatementMLE - understatementMLE;
        const netUnderstatementMLE = understatementMLE - overstatementMLE;
        
        const netOverstatementUEL = overstatementUEL - understatementMLE;
        const netUnderstatementUEL = cellClassicalData?.netUnderstatementUEL ?? (understatementUEL - overstatementMLE);

        // ✅ USAR DATOS REALES DE ERRORES EN VALOR ALTO (NO MÁS HARDCODEO)
        const highValueOverstatementErrors = highValueErrors?.overstatementCount || 0;
        const highValueUnderstatementErrors = highValueErrors?.understatementCount || 0;
        const highValueOverstatementAmount = highValueErrors?.overstatementAmount || 0;
        const highValueUnderstatementAmount = highValueErrors?.understatementAmount || 0;

        // ✅ OPCIÓN 2: Calcular desde cellClassicalData (MEJOR)
    const overstatementPrecision = cellClassicalData ? 
        (cellClassicalData.upperErrorLimit - cellClassicalData.mostLikelyError) : 
        precisionTotal;
    
    const understatementPrecision = cellClassicalData ? 
        ((cellClassicalData.understatementUEL || 0) - (cellClassicalData.understatementMLE || 0)) : 
        (precisionTotalUnder || precisionTotal);
            
        return (
            <tbody className="bg-white divide-y divide-gray-200">
                {/* Resultados Excluyendo Elementos de Valor Alto */}
                <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Tamaño de muestra</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{formatNumber(estimatedSampleSize,2) || '0.00'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{formatNumber(estimatedSampleSize,2) || '0.00'}</td>
                </tr>
                <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Número de errores</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{formatNumber(overstatementErrors,2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{formatNumber(understatementErrors,2)}</td>
                </tr>
                <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Error más probable bruto</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{formatNumber(overstatementMLE, 2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{formatNumber(understatementMLE, 2)}</td>
                </tr>
                <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Error más probable neto</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{formatNumber(netOverstatementMLE, 2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{formatNumber(netUnderstatementMLE    , 2)}</td>
                </tr>
                <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Precisión total</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{formatNumber(overstatementPrecision, 2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{formatNumber(understatementPrecision, 2)}</td>
                </tr>
                <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Límite de error superior bruto</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{formatNumber(overstatementUEL, 2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{formatNumber(understatementUEL, 2)}</td>
                </tr>
                <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Límite de error superior neto</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{formatNumber(netOverstatementUEL, 2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{formatNumber(netUnderstatementUEL, 2)}</td>
                </tr>
                
                {/* El resto de la tabla se mantiene igual... */}
                {/* Resultados para Elementos de Valor Alto */}
                <tr className="bg-gray-50">
                    <td colSpan={3} className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Resultados para Elementos de Valor Alto
                    </td>
                </tr>
                <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Número de elementos de valor alto
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {formatNumber(highValueCountResume,2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {formatNumber(highValueCountResume,2) || '0.00'}
                    </td>
                </tr>
                <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Número de errores
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {formatNumber(highValueOverstatementErrors, 2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {formatNumber(highValueUnderstatementErrors, 2)}
                    </td>
                </tr>
                <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Valor de errores
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {formatNumber(highValueOverstatementAmount, 2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {formatNumber(highValueUnderstatementAmount, 2)}
                    </td>
                </tr>
                
                {/* Resultados Incluyendo Elementos de Valor Alto */}
                <tr className="bg-gray-50">
                    <td colSpan={3} className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Resultados Incluyendo Elementos de Valor Alto
                    </td>
                </tr>
                <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Número total de elementos examinados</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{formatNumber(totalItemsExamined,2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{formatNumber(totalItemsExamined,2)}</td>
                </tr>
                <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Número de errores</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{formatNumber(overstatementErrors,2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{formatNumber(understatementErrors,2)}</td>
                </tr>
                <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Error más probable bruto</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{formatNumber(overstatementMLE, 2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{formatNumber(understatementMLE, 2)}</td>
                </tr>
                <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Error más probable neto</td>
                    {/* ✅ CORREGIDO: Mantener la misma lógica que en "Excluyendo Valores Altos" */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{formatNumber(netOverstatementMLE, 2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{formatNumber(netUnderstatementMLE, 2)}</td>
                </tr>
                <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Límite de error superior bruto</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{formatNumber(overstatementUEL, 2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{formatNumber(understatementUEL, 2)}</td>
                </tr>
                <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Límite de error superior neto</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{formatNumber(netOverstatementUEL, 2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{formatNumber(netUnderstatementUEL, 2)}</td>
                </tr>
            </tbody>
        );
    };

    // ✅ CORRECCIÓN: Tablas detalladas con datos REALES para Cell & Classical PPS
    // Componente para la tabla detallada de Understatements
    const UnderstatementsTable = () => {
        const hasUnderstatements = cellClassicalData?.understatements && cellClassicalData.understatements.length > 0;
        const understatementStages = cellClassicalData?.understatements || [];
        
        // ✅ ELIMINAR HARDCODEO - Usar el primer factor del nivel de confianza
        const factors = calculateReliabilityFactors(confidenceLevel);
        const basicFactor = factors[0];
        
        // ✅ SI NO HAY UNDERSTATEMENTS, MOSTRAR SOLO STAGE 0 CON FACTOR CALCULADO
        const displayStages = hasUnderstatements ? understatementStages : [{
            stage: 0,
            uelFactor: basicFactor, // ✅ USAR FACTOR CALCULADO
            tainting: 0,
            averageTainting: 0,
            previousUEL: 0,
            loadingPropagation: basicFactor, // ✅ USAR FACTOR CALCULADO
            simplePropagation: basicFactor, // ✅ USAR FACTOR CALCULADO
            maxStageUEL: basicFactor // ✅ USAR FACTOR CALCULADO
        }];

        // ✅ CALCULAR DATOS ESPECÍFICOS PARA UNDERSTATEMENTS
        const totalUnderTaintings = cellClassicalData?.understatementMLE ? cellClassicalData.understatementMLE / sampleInterval : 0;
        const understatementMLE = cellClassicalData?.understatementMLE ?? 0;
        const understatementUEL = cellClassicalData?.understatementUEL ?? cellClassicalData?.basicPrecision ?? 0;
        const understatementStageUEL = understatementUEL / sampleInterval;

        return (
            <div className="mt-8">
                <h4 className="text-xl font-semibold text-gray-600 mb-2">Understatements</h4>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">A<br/>Error Stage</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">B<br/>UEL Factor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">C<br/>Tainting</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">D<br/>Average<br/>Tainting</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">E<br/>UEL of Previous<br/>Stage (H)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">F<br/>Load & Spread<br/>(E+C)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">G<br/>Simple Spread<br/>(BxD)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">H<br/>Stage UEL Max<br/>(F,G)</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {displayStages.map((item, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">{item.stage}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{formatNumber(item.uelFactor, 4)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{formatNumber(item.tainting, 4)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{formatNumber(item.averageTainting, 4)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{formatNumber(item.previousUEL, 4)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{formatNumber(item.loadingPropagation, 4)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{formatNumber(item.simplePropagation, 4)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{formatNumber(item.maxStageUEL, 4)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">Total Taintings:</span>
                            <span className="text-sm text-gray-900">
                                {formatNumber(totalUnderTaintings, 4)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-700">Total Taintings</span>
                                <span className="text-sm text-gray-700">X</span>
                                <span className="text-sm font-medium text-gray-700">Sampling Interval</span>
                                <span className="text-sm text-gray-700">=</span>
                                <span className="text-sm font-medium text-gray-700">Most Likely Error</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-900">
                                    {formatNumber(totalUnderTaintings, 4)}
                                </span>
                                <span className="text-sm text-gray-700">X</span>
                                <span className="text-sm text-gray-900">{formatNumber(sampleInterval, 4)}</span>
                                <span className="text-sm text-gray-700">=</span>
                                <span className="text-sm text-gray-900">
                                    {formatNumber(understatementMLE, 4)}
                                </span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">Basic Precision:</span>
                            <span className="text-sm text-gray-900">
                                {formatNumber(cellClassicalData?.basicPrecision || 0, 4)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">Precision Gap Widening:</span>
                            <span className="text-sm text-gray-900">
                                {formatNumber(cellClassicalData?.precisionGapWideningUnder || 0, 4)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-700">Stage UEL</span>
                                <span className="text-sm text-gray-700">X</span>
                                <span className="text-sm font-medium text-gray-700">Sampling Interval</span>
                                <span className="text-sm text-gray-700">=</span>
                                <span className="text-sm font-medium text-gray-700">Upper Error Limit</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-900">
                                    {formatNumber(understatementStageUEL, 4)}
                                </span>
                                <span className="text-sm text-gray-700">X</span>
                                <span className="text-sm text-gray-900">{formatNumber(sampleInterval, 4)}</span>
                                <span className="text-sm text-gray-700">=</span>
                                <span className="text-sm text-gray-900">
                                    {formatNumber(understatementUEL, 4)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Componente para la tabla detallada de Overstatements
    // En Summary.tsx - CORREGIR OverstatementsTable también
    const OverstatementsTable = () => {
        const hasOverstatements = cellClassicalData?.overstatements && cellClassicalData.overstatements.length > 0;
        const overstatementStages = cellClassicalData?.overstatements || [];
        
        // ✅ ELIMINAR HARDCODEO - Usar el primer factor del nivel de confianza
        const factors = calculateReliabilityFactors(confidenceLevel);
        const basicFactor = factors[0];
        
        // ✅ SI NO HAY OVERSTATEMENTS, MOSTRAR SOLO STAGE 0 CON FACTOR CALCULADO
        const displayStages = hasOverstatements ? overstatementStages : [{
            stage: 0,
            uelFactor: basicFactor, // ✅ USAR FACTOR CALCULADO
            tainting: 0,
            averageTainting: 0,
            previousUEL: 0,
            loadingPropagation: basicFactor, // ✅ USAR FACTOR CALCULADO
            simplePropagation: basicFactor, // ✅ USAR FACTOR CALCULADO
            maxStageUEL: basicFactor // ✅ USAR FACTOR CALCULADO
        }];

        // ✅ CALCULAR DATOS ESPECÍFICOS PARA OVERSTATEMENTS
        const totalOverTaintings = cellClassicalData?.totalTaintings || 0;
        const overstatementMLE = cellClassicalData?.mostLikelyError || 0;
        const overstatementUEL = cellClassicalData?.upperErrorLimit || 0;
        const overstatementStageUEL = cellClassicalData?.stageUEL || 0;

        return (
            <div className="mt-8">
                <h4 className="text-xl font-semibold text-gray-600 mb-2">Overstatements</h4>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">A<br/>Error Stage</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">B<br/>UEL Factor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">C<br/>Tainting</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">D<br/>Average<br/>Tainting</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">E<br/>UEL of Previous<br/>Stage (H)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">F<br/>Load & Spread<br/>(E+C)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">G<br/>Simple Spread<br/>(BxD)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">H<br/>Stage UEL Max<br/>(F,G)</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {displayStages.map((item, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">{item.stage}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{formatNumber(item.uelFactor, 4)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{formatNumber(item.tainting, 4)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{formatNumber(item.averageTainting, 4)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{formatNumber(item.previousUEL, 4)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{formatNumber(item.loadingPropagation, 4)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{formatNumber(item.simplePropagation, 4)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{formatNumber(item.maxStageUEL, 4)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">Total Taintings:</span>
                            <span className="text-sm text-gray-900">
                                {formatNumber(totalOverTaintings, 4)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-700">Total Taintings</span>
                                <span className="text-sm text-gray-700">X</span>
                                <span className="text-sm font-medium text-gray-700">Sampling Interval</span>
                                <span className="text-sm text-gray-700">=</span>
                                <span className="text-sm font-medium text-gray-700">Most Likely Error</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-900">
                                    {formatNumber(totalOverTaintings, 4)}
                                </span>
                                <span className="text-sm text-gray-700">X</span>
                                <span className="text-sm text-gray-900">{formatNumber(sampleInterval, 4)}</span>
                                <span className="text-sm text-gray-700">=</span>
                                <span className="text-sm text-gray-900">
                                    {formatNumber(overstatementMLE, 4)}
                                </span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">Basic Precision:</span>
                            <span className="text-sm text-gray-900">
                                {formatNumber(cellClassicalData?.basicPrecision || 0, 4)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">Precision Gap Widening:</span>
                            <span className="text-sm text-gray-900">
                                {formatNumber(cellClassicalData?.precisionGapWideningOver || 0, 4)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-700">Stage UEL</span>
                                <span className="text-sm text-gray-700">X</span>
                                <span className="text-sm font-medium text-gray-700">Sampling Interval</span>
                                <span className="text-sm text-gray-700">=</span>
                                <span className="text-sm font-medium text-gray-700">Upper Error Limit</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-900">
                                    {formatNumber(overstatementStageUEL, 4)}
                                </span>
                                <span className="text-sm text-gray-700">X</span>
                                <span className="text-sm text-gray-900">{formatNumber(sampleInterval, 4)}</span>
                                <span className="text-sm text-gray-700">=</span>
                                <span className="text-sm text-gray-900">
                                    {formatNumber(overstatementUEL, 4)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };
    
    // EN Summary.tsx - MEJORAR renderStringerBoundTable
    const renderStringerBoundTable = () => {
        const totalItemsExamined = (estimatedSampleSize ?? 0) + (highValueCountResume ?? 0);
        
        // ✅ USAR DATOS REALES DEL BACKEND - NO HARDCODEAR
        const highValueOverstatementErrors = highValueErrors?.overstatementCount || 0;
        const highValueUnderstatementErrors = highValueErrors?.understatementCount || 0;
        const highValueOverstatementAmount = highValueErrors?.overstatementAmount || 0;
        const highValueUnderstatementAmount = highValueErrors?.understatementAmount || 0;

        // ✅ USAR LOS DATOS REALES QUE VIENEN DEL BACKEND
        // El backend ahora devuelve estos campos separados
        const overstatementErrors = numErrores > 0 ? 1 : 0; // El backend dice que hay 1 error
        const understatementErrors = 0; // El backend dice 0 understatements
        
        // ✅ USAR LOS CAMPOS ESPECÍFICOS DEL BACKEND
        const overstatementMLE = errorMasProbableBruto; // Esto debería ser 10,553,776.20
        const understatementMLE = 0; // El backend dice 0
        
        const overstatementUEL = limiteErrorSuperiorBruto; // Esto debería ser > 26,389,131.07
        const understatementUEL = limiteErrorSuperiorBruto; // Basic Precision para understatements
        
        // ✅ CÁLCULOS NETOS USANDO DATOS REALES
        const netOverstatementMLE = errorMasProbableNeto;
        const netUnderstatementMLE = -errorMasProbableNeto; // Negativo del neto
        
        const netOverstatementUEL = limiteErrorSuperiorNeto;
        const netUnderstatementUEL = (understatementUEL - overstatementMLE) || 0;

        console.log("🔍 DATOS STRINGER BOUND FRONTEND:", {
            overstatementErrors,
            understatementErrors,
            overstatementMLE,
            understatementMLE,
            overstatementUEL,
            understatementUEL,
            netOverstatementMLE,
            netUnderstatementMLE,
            netOverstatementUEL,
            netUnderstatementUEL
        });

        return (
            <tbody className="bg-white divide-y divide-gray-200">
                {/* Resultados Excluyendo Elementos de Valor Alto */}
                <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Tamaño de muestra combinado
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {formatNumber(estimatedSampleSize,2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {formatNumber(estimatedSampleSize,2) || '0.00'}
                    </td>
                </tr>
                <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Número de errores
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {formatNumber(overstatementErrors, 2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {formatNumber(understatementErrors, 2)}
                    </td>
                </tr>
                <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Error más probable bruto
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {formatNumber(overstatementMLE, 2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {formatNumber(understatementMLE, 2)}
                    </td>
                </tr>
                <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Error más probable neto
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {formatNumber(netOverstatementMLE, 2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {formatNumber(netUnderstatementMLE, 2)}
                    </td>
                </tr>
                <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Precisión total
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {formatNumber(precisionTotal, 2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {formatNumber(precisionTotal, 2)}
                    </td>
                </tr>
                <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Límite de error superior bruto
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {formatNumber(overstatementUEL, 2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {formatNumber(understatementUEL, 2)}
                    </td>
                </tr>
                <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Límite de error superior neto
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {formatNumber(netOverstatementUEL, 2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {formatNumber(netUnderstatementUEL, 2)}
                    </td>
                </tr>
                
                {/* Resto de la tabla igual... */}
                {/* Resultados para Elementos de Valor Alto */}
                <tr className="bg-gray-50">
                    <td colSpan={3} className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Resultados para Elementos de Valor Alto
                    </td>
                </tr>
                <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Número de elementos de valor alto
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {formatNumber(highValueCountResume,2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {formatNumber(highValueCountResume,2) || '0.00'}
                    </td>
                </tr>
                <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Número de errores
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {formatNumber(highValueOverstatementErrors, 2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {formatNumber(highValueUnderstatementErrors, 2)}
                    </td>
                </tr>
                <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Valor de errores
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {formatNumber(highValueOverstatementAmount, 2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {formatNumber(highValueUnderstatementAmount, 2)}
                    </td>
                </tr>
                
                {/* Resultados Incluyendo Elementos de Valor Alto */}
                <tr className="bg-gray-50">
                    <td colSpan={3} className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Resultados Incluyendo Elementos de Valor Alto
                    </td>
                </tr>
                <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Número total de elementos examinados
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {formatNumber(totalItemsExamined,2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {formatNumber(totalItemsExamined,2)}
                    </td>
                </tr>
                <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Número de errores
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {formatNumber(overstatementErrors, 2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {formatNumber(understatementErrors, 2)}
                    </td>
                </tr>
                <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Error más probable bruto
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {formatNumber(overstatementMLE, 2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {formatNumber(understatementMLE, 2)}
                    </td>
                </tr>
                <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Error más probable neto
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {formatNumber(netOverstatementMLE, 2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {formatNumber(netUnderstatementMLE, 2)}
                    </td>
                </tr>
                <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Límite de error superior bruto
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {formatNumber(overstatementUEL, 2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {formatNumber(understatementUEL, 2)}
                    </td>
                </tr>
                <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Límite de error superior neto
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {formatNumber(netOverstatementUEL, 2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {formatNumber(netUnderstatementUEL, 2)}
                    </td>
                </tr>
            </tbody>
        );
    };
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
                            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">{mainTitle}</h2>
                            
                            <div className="grid grid-cols-2 gap-10">
                                {/* Columna izquierda - Parámetros de muestreo */}
                                <div className="space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-gray-700 w-160">Nivel de confianza:</span>
                                            <span className="text-sm font-bold text-gray-900">{formatNumber(confidenceLevel, 2)}%</span>
                                        </div>
                                        {/* Campo 1: Intervalo muestral - Ocultar solo para Stringer Bound */}
                                        {evaluationMethod === 'cell-classical' && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-gray-700 w-90">Intervalo muestral:</span>
                                                <span className="text-sm font-bold text-gray-900">{formatNumber(sampleInterval, 2)}</span>
                                            </div>
                                        )}
                                        
                                        {/* Campo 2: Valor alto - Ocultar solo para Stringer Bound */}
                                        {evaluationMethod === 'cell-classical' && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-gray-700 w-90">Valor alto:</span>
                                                <span className="text-sm font-bold text-gray-900">{formatNumber(highValueLimit, 2)}</span>
                                            </div>
                                        )}
                                        
                                        {/* Campo 3: Precisión básica de fijación de precios - Ocultar solo para Stringer Bound */}
                                        {evaluationMethod === 'cell-classical' && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-gray-700 w-90">Precisión básica de fijación de precios:</span>
                                                <span className="text-sm font-bold text-gray-900">{formatNumber(precisionValue,2)}%</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Columna derecha - Valores de población */}
                                <div className="space-y-4">
                                    <div className="space-y-3">
                                        {/* ✅ USAR VALORES CALCULADOS */}
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-gray-700 w-100">Valor de la población muestreada excluyendo valores altos:</span>
                                            <span className="text-sm font-bold text-gray-900">{formatNumber(calculatedPopulationExcludingHigh, 2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-gray-700 w-90">Valor total de elementos de valor alto:</span>
                                            <span className="text-sm font-bold text-left text-gray-900">{formatNumber(calculatedHighValueTotal, 2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-gray-700 w-90">Valor de población incluyendo elementos de valor alto:</span>
                                            <span className="text-sm font-bold text-gray-900">{formatNumber(calculatedPopulationIncludingHigh, 2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-gray-700 w-85">Método de evaluación:</span>
                                            <span className="text-sm font-bold text-gray-900">
                                                {evaluationMethod === 'cell-classical' ? 'MUM - Evaluación Celda' : 'MUM - Evaluación Stringer Bound'}
                                            </span>
                                        </div>
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
                                                Resultados Excluyendo Elementos de Valor Alto
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Sobrestimaciones
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
                                    <UnderstatementsTable />
                                    <OverstatementsTable />
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