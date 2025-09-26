import { NextResponse } from 'next/server';

// Esta función implementa el generador pseudoaleatorio (Linear Congruential Generator - LCG)
// Se puede optimizar, pero mantenemos tu base para el control de la semilla.
const pseudoRandomGenerator = (initialSeed: number) => {
    let seed = initialSeed;
    const a = 1664525;
    const c = 1013904223;
    const m = 4294967296; // 2^32

    return () => {
        seed = (a * seed + c) % m;
        // Normalizamos el número entre 0 y 1
        return seed / m;
    };
};

export async function POST(request: Request) {
    try {
        const { excelData, calculatedSampleSize, startRandomNumber, startRecordToSelect, endRecordToSelect, allowDuplicates } = await request.json() as {
            excelData: any[];
            calculatedSampleSize: number;
            startRandomNumber: number;
            startRecordToSelect: number;
            endRecordToSelect: number;
            allowDuplicates: boolean;
        };

        // 1. Validación y Filtrado Inicial
        if (!excelData || calculatedSampleSize <= 0) {
            return NextResponse.json({ error: "Parámetros de muestreo inválidos." }, { status: 400 });
        }
        
        // Ajustamos los índices para que sean base 0
        const startIdx = startRecordToSelect > 0 ? startRecordToSelect - 1 : 0;
        const endIdx = endRecordToSelect > 0 ? endRecordToSelect : excelData.length;

        const filteredData = excelData.slice(startIdx, endIdx);
        const population = filteredData.length;

        if (population === 0) {
            return NextResponse.json({ error: "El rango de registros no contiene datos." }, { status: 400 });
        }
        
        // El tamaño de la muestra no puede ser mayor que la población sin duplicados
        if (!allowDuplicates && calculatedSampleSize > population) {
             return NextResponse.json({ error: `El tamaño de la muestra (${calculatedSampleSize}) no puede ser mayor que la población disponible (${population}) si no se permiten duplicados.` }, { status: 400 });
        }


        // 2. Generación de Muestra Aleatoria
        const randomSample = [];
        const nextRandom = pseudoRandomGenerator(startRandomNumber);

        if (allowDuplicates) {
            // Caso 1: Muestreo con Reemplazo (Simple y correcto)
            for (let i = 0; i < calculatedSampleSize; i++) {
                const randomVal = nextRandom();
                const randomIndex = Math.floor(randomVal * population);
                randomSample.push(filteredData[randomIndex]);
            }
        } else {
            // Caso 2: Muestreo sin Reemplazo (Usando Fisher-Yates moderno)
            
            // Creamos un array de índices posibles (0, 1, 2, ..., population-1)
            const availableIndices = Array.from({ length: population }, (_, i) => i);

            for (let i = 0; i < calculatedSampleSize; i++) {
                // Generar un índice aleatorio en el rango de los índices restantes
                const randomVal = nextRandom();
                // El índice debe ser en el rango [0, availableIndices.length - 1]
                const indexToPickFrom = Math.floor(randomVal * (availableIndices.length - i));
                
                // 1. Obtener el índice real del registro a partir de la lista de disponibles
                const actualIndex = availableIndices[indexToPickFrom];
                randomSample.push(filteredData[actualIndex]);

                // 2. Mover el índice seleccionado al final del array e ignorarlo en la siguiente iteración
                //    (Esta es la optimización clave del Shuffle de Fisher-Yates)
                [availableIndices[indexToPickFrom], availableIndices[availableIndices.length - 1 - i]] = 
                [availableIndices[availableIndices.length - 1 - i], availableIndices[indexToPickFrom]];
            }
        }

        // 3. Devolver el resultado
        return NextResponse.json({ randomSample });

    } catch (error) {
        console.error("Error en la generación de la muestra aleatoria:", error);
        return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
    }
}