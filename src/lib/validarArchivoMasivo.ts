// src/lib/validarArchivoMasivo.ts
import fs from "fs";
import * as readline from "readline";

export interface ValidationResult {
  totalLines: number;
  emptyLines: number;
  firstEmptyLines: number[];
  delimiter: string;
}

/**
 * 🔎 Validación robusta de archivos masivos
 * - Detección automática de delimitador dominante.
 * - Ignora cabecera si solo contiene texto o nombres de columnas.
 * - Maneja streaming eficiente (>50 GB sin saturar memoria).
 */
export async function validarArchivoMasivo(filePath: string): Promise<ValidationResult> {
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  let totalLines = 0;
  let emptyLines = 0;
  const firstEmptyLines: number[] = [];
  let detectedDelimiter: string | null = null;
  let delimiterScores: Record<string, number> = { "|": 0, ";": 0, ",": 0, "\t": 0 };
  let headerAnalyzed = false;

  for await (const rawLine of rl) {
    const line = rawLine.trim();
    totalLines++;

    // Saltar líneas vacías directas
    if (!line) {
      emptyLines++;
      if (firstEmptyLines.length < 10) firstEmptyLines.push(totalLines);
      continue;
    }

    // Detectar delimitador dominante (solo las primeras líneas)
    if (totalLines <= 5) {
      for (const d of Object.keys(delimiterScores)) {
        delimiterScores[d] += (line.match(new RegExp(`\\${d}`, "g")) || []).length;
      }
    }

    // Después de la primera línea válida, determinar el delimitador principal
    if (!detectedDelimiter && totalLines === 5) {
      const best = Object.entries(delimiterScores).sort((a, b) => b[1] - a[1])[0];
      detectedDelimiter = best ? best[0] : "|";
      // console.log(`🧩 Delimitador detectado: "${detectedDelimiter}"`);
    }

    // Detectar cabecera y omitir si es puro texto (sin números)
    if (!headerAnalyzed) {
      headerAnalyzed = true;
      const hasNumeric = /\d+/.test(line);
      if (!hasNumeric) {
        // probablemente sea cabecera → no la contamos como vacía ni como dato
        continue;
      }
    }

    // Considerar una línea vacía si solo tiene separadores o espacios
    const regex = detectedDelimiter
      ? new RegExp(`^([${detectedDelimiter}\\s]*)$`)
      : /^([,;|\s]*)$/;

    if (regex.test(line)) {
      emptyLines++;
      if (firstEmptyLines.length < 10) firstEmptyLines.push(totalLines);
    }
  }

  if (!detectedDelimiter) {
    const best = Object.entries(delimiterScores).sort((a, b) => b[1] - a[1])[0];
    detectedDelimiter = best ? best[0] : "|";
  }

  return { totalLines, emptyLines, firstEmptyLines, delimiter: detectedDelimiter };
}
