// app/api/mum/evaluation/stringer-bound/route.ts
import { NextResponse } from 'next/server';

interface SampleItem {
    reference: string;
    bookValue: number;
    auditedValue: number;
}

interface StringerBoundRequest {
    sampleData: SampleItem[];
    sampleInterval: number;
    confidenceLevel: number;
    populationValue: number;
    tolerableError: number;
    highValueLimit: number;
}

// Factores de Confiabilidad para Stringer Bound
const RELIABILITY_FACTORS = {
    90: [2.31, 1.90, 1.61, 1.44, 1.33, 1.25, 1.19, 1.14],
    95: [3.00, 1.75, 1.55, 1.46, 1.40, 1.36, 1.33, 1.30],
    99: [4.61, 2.89, 2.36, 2.11, 1.97, 1.87, 1.80, 1.74]
};

export async function POST(req: Request) {
    try {
        const { sampleData, sampleInterval, confidenceLevel, populationValue, tolerableError }: StringerBoundRequest = await req.json();

        // 1. CALCULAR ERRORES Y TAINTINGS
        const errors = sampleData
            .filter(item => {
                const hasBookValue = !isNaN(item.bookValue) && item.bookValue !== 0;
                const hasAuditedValue = !isNaN(item.auditedValue);
                return hasBookValue && hasAuditedValue && item.bookValue !== item.auditedValue;
            })
            .map(item => {
                const error = item.bookValue - item.auditedValue;
                const absoluteBookValue = Math.abs(item.bookValue);
                const tainting = absoluteBookValue > 0 ? Math.abs(error) / absoluteBookValue : 0;
                
                return {
                    reference: item.reference,
                    bookValue: item.bookValue,
                    auditedValue: item.auditedValue,
                    error,
                    tainting,
                    isOverstatement: error > 0,
                    isUnderstatement: error < 0,
                    projectedError: tainting * sampleInterval
                };
            });

        // 2. ORDENAR POR TAINTING DESCENDENTE
        const sortedErrors = errors
            .filter(e => e.isOverstatement) // Stringer Bound solo para sobrestimaciones
            .sort((a, b) => b.tainting - a.tainting);

        // 3. OBTENER FACTORES
        const factors = RELIABILITY_FACTORS[confidenceLevel as keyof typeof RELIABILITY_FACTORS] || RELIABILITY_FACTORS[95];

        // 4. CALCULAR STRINGER BOUND
        let incrementalAllowance = 0;
        const basicPrecision = factors[0] * sampleInterval;
        
        sortedErrors.forEach((error, index) => {
            if (index < factors.length - 1) {
                const incrementalFactor = factors[index + 1] - factors[index];
                incrementalAllowance += incrementalFactor * error.tainting * sampleInterval;
            }
        });

        const upperErrorLimit = basicPrecision + incrementalAllowance;
        const mostLikelyError = sortedErrors.reduce((sum, error) => sum + error.projectedError, 0);

        // 5. VALIDACIÓN
        const isAccepted = upperErrorLimit <= tolerableError;

        const response = {
            numErrores: errors.length,
            errorMasProbableBruto: mostLikelyError,
            errorMasProbableNeto: mostLikelyError,
            precisionTotal: basicPrecision,
            limiteErrorSuperiorBruto: upperErrorLimit,
            limiteErrorSuperiorNeto: upperErrorLimit,
            isAccepted,
            conclusion: `La población ${isAccepted ? 'PUEDE' : 'NO PUEDE'} aceptarse. ` +
                       `UEL: ${upperErrorLimit.toLocaleString()}, ` +
                       `Tolerable: ${tolerableError.toLocaleString()}`,
            
            // Datos específicos Stringer Bound
            stringerBoundData: {
                basicPrecision,
                incrementalAllowance,
                upperErrorLimit,
                mostLikelyError,
                errorDetails: sortedErrors.map((error, index) => ({
                    reference: error.reference,
                    tainting: error.tainting,
                    rank: index + 1,
                    reliabilityFactor: factors[index] || factors[factors.length - 1],
                    incrementalFactor: index < factors.length - 1 ? factors[index + 1] - factors[index] : 0,
                    contribution: index < factors.length - 1 ? 
                        (factors[index + 1] - factors[index]) * error.tainting * sampleInterval : 0
                }))
            }
        };

        return NextResponse.json(response);

    } catch (error: any) {
        console.error("Error en evaluación Stringer Bound:", error);
        return NextResponse.json({ 
            error: "Error procesando evaluación Stringer Bound: " + error.message 
        }, { status: 500 });
    }
}