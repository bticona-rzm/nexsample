// /api/atributos/aleatorio/route.ts - VERSIÓN MEJORADA
import { NextResponse } from 'next/server';

// ✅ GENERADOR MEJORADO - LCG con parámetros estándar
const createRandomGenerator = (initialSeed: number) => {
    let seed = initialSeed;
    // Parámetros estándar de LCG (Numerical Recipes)
    const a = 1664525;
    const c = 1013904223;
    const m = 2**32;

    return () => {
        seed = (a * seed + c) % m;
        return seed / m;
    };
};

export async function POST(request: Request) {
    try {
        const { 
            excelData, 
            calculatedSampleSize, 
            startRandomNumber, 
            startRecordToSelect, 
            endRecordToSelect, 
            allowDuplicates 
        } = await request.json();

        // ✅ VALIDACIONES ROBUSTAS
        if (!excelData || !Array.isArray(excelData)) {
            return NextResponse.json({ error: "Datos de Excel no proporcionados o inválidos." }, { status: 400 });
        }
        
        if (!calculatedSampleSize || calculatedSampleSize <= 0) {
            return NextResponse.json({ error: "El tamaño de la muestra debe ser mayor a 0." }, { status: 400 });
        }

        if (calculatedSampleSize > 10000) {
            return NextResponse.json({ error: "El tamaño de la muestra no puede exceder 10,000 registros." }, { status: 400 });
        }

        // ✅ AJUSTE DE ÍNDICES (base 0)
        const startIdx = Math.max(0, startRecordToSelect - 1);
        const endIdx = Math.min(excelData.length, endRecordToSelect);
        
        if (startIdx >= endIdx) {
            return NextResponse.json({ 
                error: `El registro inicial (${startRecordToSelect}) debe ser menor al registro final (${endRecordToSelect}).` 
            }, { status: 400 });
        }

        const filteredData = excelData.slice(startIdx, endIdx);
        const populationSize = filteredData.length;

        if (populationSize === 0) {
            return NextResponse.json({ error: "El rango de registros seleccionado no contiene datos." }, { status: 400 });
        }
        
        // ✅ VALIDACIÓN DE DUPLICADOS
        if (!allowDuplicates && calculatedSampleSize > populationSize) {
            return NextResponse.json({ 
                error: `No se pueden seleccionar ${calculatedSampleSize} registros sin duplicados de una población de ${populationSize}.` 
            }, { status: 400 });
        }

        // ✅ GENERACIÓN DE MUESTRA
        const randomSample = [];
        const nextRandom = createRandomGenerator(startRandomNumber);

        if (allowDuplicates) {
            // ✅ CASO CON DUPLICADOS - Muestreo simple con reemplazo
            for (let i = 0; i < calculatedSampleSize; i++) {
                const randomIndex = Math.floor(nextRandom() * populationSize);
                randomSample.push({
                    ...filteredData[randomIndex],
                    // ✅ AGREGAR INFORMACIÓN DE MUESTREO
                    _sampleInfo: {
                        sampleNumber: i + 1,
                        originalIndex: randomIndex + startIdx + 1,
                        isDuplicate: false // Se marcaría si se repite, pero es con reemplazo
                    }
                });
            }
        } else {
            // ✅ CASO SIN DUPLICADOS - Algoritmo Fisher-Yates optimizado
            // Creamos array de índices
            const indices = Array.from({ length: populationSize }, (_, i) => i);
            
            for (let i = 0; i < calculatedSampleSize; i++) {
                // Seleccionar índice aleatorio del resto del array
                const randomIndex = Math.floor(nextRandom() * (populationSize - i));
                
                // Intercambiar elementos
                [indices[i], indices[randomIndex]] = [indices[randomIndex], indices[i]];
                
                // Agregar a la muestra con información de seguimiento
                const selectedIndex = indices[i];
                randomSample.push({
                    ...filteredData[selectedIndex],
                    _sampleInfo: {
                        sampleNumber: i + 1,
                        originalIndex: selectedIndex + startIdx + 1,
                        isDuplicate: false
                    }
                });
            }
        }

        // ✅ INFORMACIÓN DE METADATOS
        const sampleInfo = {
            totalRecords: randomSample.length,
            populationSize,
            sampleSize: calculatedSampleSize,
            allowDuplicates,
            seedUsed: startRandomNumber,
            rangeUsed: `${startRecordToSelect}-${endRecordToSelect}`,
            generationDate: new Date().toISOString()
        };

        return NextResponse.json({ 
            randomSample,
            sampleInfo 
        });

    } catch (error) {
        console.error("Error en generación de muestra aleatoria:", error);
        return NextResponse.json({ 
            error: "Error interno del servidor durante la generación de la muestra." 
        }, { status: 500 });
    }
}