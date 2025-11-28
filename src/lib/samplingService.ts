import * as fs from 'fs';
import * as readline from 'readline';
import { Readable } from 'stream';
import * as XLSX from 'xlsx';

// --- RNG Reproducible (Mulberry32) ---
function mulberry32(a: number) {
    return function () {
        let t = (a += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export interface SamplingOptions {
    sampleSize: number;
    seed: number;
    hasHeader?: boolean;
    delimiter?: string; // Para CSV/TXT
}

export interface SamplingResult {
    sample: any[];
    totalRowsProcessed: number;
    executionTimeMs: number;
}

/**
 * Servicio de Muestreo usando Reservoir Sampling (Algoritmo L optimizado o R simple).
 * Permite procesar streams de tamaño desconocido en una sola pasada.
 */
export class ReservoirSampler {
    
    /**
     * Procesa un archivo CSV/TXT desde un Stream.
     * Ideal para archivos masivos o uploads grandes.
     */
    static async sampleFromStream(
        inputStream: Readable, 
        options: SamplingOptions
    ): Promise<SamplingResult> {
        const startTime = Date.now();
        const { sampleSize, seed, hasHeader = true, delimiter = ',' } = options;
        
        const rng = mulberry32(seed);
        const reservoir: { line: string, index: number }[] = [];
        
        let lineCounter = 0;
        let headerLine: string | null = null;

        const rl = readline.createInterface({
            input: inputStream,
            crlfDelay: Infinity
        });

        for await (const line of rl) {
            // Manejo de Header
            if (lineCounter === 0 && hasHeader) {
                headerLine = line;
                lineCounter++;
                continue;
            }

            // Índice lógico de la fila de datos (1-based)
            const currentItemIndex = hasHeader ? lineCounter : lineCounter + 1;

            // --- Lógica Reservoir Sampling ---
            if (reservoir.length < sampleSize) {
                // Llenar el reservorio inicialmente
                reservoir.push({ line, index: currentItemIndex });
            } else {
                // Reemplazar aleatoriamente
                // Generar un índice aleatorio j entre 0 y currentItemIndex (exclusivo)
                // Nota: Para Reservoir Sampling estándar, la probabilidad de entrar es k/n.
                // j = random(0, n)
                // si j < k, reemplazar reservoir[j]
                
                // Usamos el RNG con semilla
                const r = rng(); 
                // r es [0, 1). Multiplicamos por el contador actual de items procesados (excluyendo header)
                // El contador de items procesados es: (lineCounter - (hasHeader ? 1 : 0)) + 1 = currentItemIndex si contamos desde 1
                // Pero el algoritmo usa el contador total N visto hasta ahora.
                
                // Implementación estándar:
                // j = floor(random * itemsSeenSoFar)
                // if j < k: reservoir[j] = newItem
                
                const itemsSeen = hasHeader ? lineCounter : lineCounter + 1;
                const j = Math.floor(r * itemsSeen);
                
                if (j < sampleSize) {
                    reservoir[j] = { line, index: itemsSeen };
                }
            }

            lineCounter++;
        }

        // Procesar el resultado final (Parsear CSV)
        const parsedSample = reservoir.map(item => {
            return this.parseLine(item.line, headerLine, delimiter, item.index);
        });

        // Ordenar por índice original para mantener coherencia visual
        parsedSample.sort((a, b) => a._OriginalIndex - b._OriginalIndex);

        return {
            sample: parsedSample,
            totalRowsProcessed: hasHeader ? lineCounter - 1 : lineCounter,
            executionTimeMs: Date.now() - startTime
        };
    }

    /**
     * Parsea una línea de texto a objeto JSON
     */
    private static parseLine(line: string, header: string | null, delimiter: string, index: number): any {
        const values = line.split(delimiter).map(v => v.trim());
        const obj: any = { _OriginalIndex: index };

        if (header) {
            const headers = header.split(delimiter).map(h => h.trim());
            headers.forEach((h, i) => {
                obj[h] = values[i] || '';
            });
        } else {
            values.forEach((v, i) => {
                obj[`Col_${i + 1}`] = v;
            });
        }
        return obj;
    }
}
