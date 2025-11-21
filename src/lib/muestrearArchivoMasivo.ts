// src/lib/muestrearArchivoMasivo.ts
import fs from "fs";
import crypto from "crypto";

/** RNG reproducible */
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type SampleOpts = {
  n: number;
  seed: number;
  start: number; 
  end: number;
  useHeaders?: boolean;
  delimiter?: string;
  allowDuplicates?: boolean;
};

/**
 * Lee un uint64 LE desde el archivo .index en la posición del registro (0-based).
 */
function readIndexEntry(fd: number, entryIndex: number): number {
  const buf = Buffer.alloc(8);
  const pos = entryIndex * 8;
  const bytes = fs.readSync(fd, buf, 0, 8, pos);
  if (bytes !== 8) throw new Error("Índice fuera de rango / corrupto");
  return Number(buf.readBigUInt64LE(0));
}

/**
 * Lee una línea desde `filePath` empezando en `startOffset` hasta el próximo salto de línea.
 */
function readLineAtOffset(filePath: string, startOffset: number): string {
  const CHUNK = 64 * 1024; // 64KB
  const fd = fs.openSync(filePath, "r");
  try {
    let pos = startOffset;
    let out = "";
    const buf = Buffer.alloc(CHUNK);
    while (true) {
      const bytes = fs.readSync(fd, buf, 0, CHUNK, pos);
      if (bytes <= 0) break;

      const slice = buf.subarray(0, bytes);
      const nl = slice.indexOf(0x0a); // \n
      if (nl >= 0) {
        // encontramos fin de línea
        out += slice.subarray(0, nl).toString("utf8");
        break;
      } else {
        out += slice.toString("utf8");
        pos += bytes;
      }
    }
    return out.replace(/\r$/, ""); // quitar \r final si existiera
  } finally {
    fs.closeSync(fd);
  }
}

/** Auto-detecta delimitador básico de una línea */
function detectDelimiter(line: string) {
  const candidates = ["|", ";", ",", "\t"];
  let best = "|";
  let max = -1;
  for (const d of candidates) {
    const c = (line.match(new RegExp(`\\${d}`, "g")) || []).length;
    if (c > max) {
      max = c;
      best = d;
    }
  }
  return best;
}

/**
 * Muestrea N líneas usando el índice .index (sin recorrer todo el archivo).
 * Retorna objetos con columnas COL_#, más _POS_ORIGINAL.
 */
export async function muestrearArchivoMasivo(
  filePath: string,
  opts: SampleOpts
): Promise<{ sample: any[]; hash: string; indexPath: string; totalRowsIndex: number }> {
  const { n, seed, start, end, useHeaders = false, delimiter, allowDuplicates = false } = opts;

  if (!fs.existsSync(filePath)) throw new Error(`Archivo no encontrado: ${filePath}`);

  const indexPath = `${filePath}.index`;
  if (!fs.existsSync(indexPath)) throw new Error(`Índice no encontrado: ${indexPath}`);

  const fdIndex = fs.openSync(indexPath, "r");
  try {
    const size = fs.statSync(indexPath).size;
    const totalRowsIndex = Math.floor(size / 8); // número de offsets guardados

    if (totalRowsIndex <= 0) {
      throw new Error("Índice vacío o inválido");
    }

    // ⚠️ Detectar si el ÚLTIMO offset apunta a una línea vacía (sentinela EOF).
    const lastOffset = readIndexEntry(fdIndex, totalRowsIndex - 1);
    const lastLine = readLineAtOffset(filePath, lastOffset);
    const effectiveTotal = lastLine && lastLine.trim() ? totalRowsIndex : Math.max(0, totalRowsIndex - 1);

    // ✅ Ajustes de rango con cabeceras
    const minStart = 1;
    const maxEnd = effectiveTotal; // nunca permitir ir más allá del total efectivo
    if (start < minStart) throw new Error("Rango inválido (inicio < 1)");
    if (end < start) throw new Error("Rango inválido (fin < inicio)");
    if (end > maxEnd) throw new Error(`El fin (${end}) excede el total indexado (${maxEnd})`);

    // Si hay cabecera y el cliente pidió empezar en 1, saltamos a la línea 2
    const realStart = useHeaders && start === 1 ? 2 : start;

    // Delimitador: lee la primera línea de datos real
    const firstDataLineIndex = useHeaders ? 2 : 1;
    if (firstDataLineIndex > effectiveTotal) {
      return { sample: [], hash: "", indexPath, totalRowsIndex: effectiveTotal };
    }
    const firstDataOffset = readIndexEntry(fdIndex, firstDataLineIndex - 1);
    const firstDataLine = readLineAtOffset(filePath, firstDataOffset) || "";
    const delim = delimiter || detectDelimiter(firstDataLine);

    // RNG + targets
    const rng = mulberry32(seed);
    let targets: number[] = [];
    const rangeSize = end - realStart + 1;

    // 🔧 Si el usuario pide más de lo posible, ajustar o lanzar error según duplicados
    let effectiveN = n;
    if (!allowDuplicates && n > Math.max(0, rangeSize)) {
      throw new Error(
        `n (${n}) mayor que el rango disponible (${rangeSize}) sin duplicados`
      );
    }
    if (!allowDuplicates && n > rangeSize) {
      effectiveN = rangeSize; // seguridad adicional
    }

    // Generar líneas aleatorias
    if (allowDuplicates) {
      for (let i = 0; i < effectiveN; i++) {
        const lineNum = Math.floor(rng() * rangeSize) + realStart;
        targets.push(lineNum);
      }
    } else {
      const set = new Set<number>();
      while (set.size < effectiveN) {
        const lineNum = Math.floor(rng() * rangeSize) + realStart;
        set.add(lineNum);
      }
      targets = Array.from(set.values());
    }
    
    // Extraer líneas
    const sample: any[] = [];
    for (const lineNum of targets) {
      const offset = readIndexEntry(fdIndex, lineNum - 1);
      const line = readLineAtOffset(filePath, offset);
      if (!line || !line.trim()) continue; // ignora vacías

      const parts = line.split(delim).map((v) => v.trim());
      const row: Record<string, string | number> = {};
      for (let i = 0; i < parts.length; i++) row[`COL_${i + 1}`] = parts[i];
      row["_POS_ORIGINAL"] = lineNum;
      sample.push(row);
    }
    
    // Hash robusto (incluye firma del archivo)
    const fdData = fs.openSync(filePath, "r");
    const sigBuf = Buffer.alloc(1024);
    fs.readSync(fdData, sigBuf, 0, 1024, 0);
    fs.closeSync(fdData);
    const fileSig = crypto.createHash("md5").update(sigBuf).digest("hex").slice(0, 8);

    const hash = crypto
      .createHash("sha256")
      .update(JSON.stringify({ n, seed, start, end, allowDuplicates, fileSig }))
      .digest("hex")
      .slice(0, 12);

    return { sample, hash, indexPath, totalRowsIndex: effectiveTotal };
  } finally {
    fs.closeSync(fdIndex);
  }
}
