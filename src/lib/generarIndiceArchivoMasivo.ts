// src/lib/generarIndiceArchivoMasivo.ts
import * as fs from "fs";
import path from "path";


type BuildIndexOptions = {
  useHeaders?: boolean;
  highWaterMark?: number; // tamaño del chunk (por defecto 4 MB)
};

/**
 * Genera un archivo `.index` binario con offsets (uint64 LE) del inicio de cada línea.
 * Diseñado para archivos masivos (50 GB+), sin saturar memoria.
 */
export async function generarIndiceArchivoMasivo(
  filePath: string,
  options: BuildIndexOptions = {}
): Promise<{ indexPath: string; totalRows: number; headerOffset: number }> {
  const { useHeaders = false, highWaterMark = 8 * 1024 * 1024 } = options;

  if (!fs.existsSync(filePath)) {
    throw new Error(`Archivo no encontrado: ${filePath}`);
  }

  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  const indexPath = path.join(dir, `${base}.index`);
  // 🚫 Si ya existe un índice válido, omitir el proceso
  if (fs.existsSync(indexPath)) {
    const stats = fs.statSync(indexPath);
    if (stats.size > 0) {
      const totalRows = Math.floor(stats.size / 8); // 8 bytes por fila (uint64LE)
      console.log(`✅ Índice existente detectado: ${indexPath} (${totalRows.toLocaleString()} filas).`);
      return { indexPath, totalRows, headerOffset: 0 };
    }
  }
  const fileSize = fs.statSync(filePath).size;
  const progressFile = path.join(dir, "progress.json");

  const rs = fs.createReadStream(filePath, { highWaterMark });
  const ws = fs.createWriteStream(indexPath, { flags: "w" });

  let totalRows = 0;
  let absolutePos = 0;
  let bufferDrain: Promise<void> | null = null;

  // Escribe un offset (uint64LE) de manera segura (controlando backpressure)
  const writeOffset = async (offset: number | bigint) => {
    const buf = Buffer.allocUnsafe(8);
    buf.writeBigUInt64LE(BigInt(offset));
    if (!ws.write(buf)) {
      bufferDrain = new Promise((res) => ws.once("drain", res));
      await bufferDrain;
      bufferDrain = null;
    }
    totalRows++;
  };

  // La primera línea empieza en 0
  await writeOffset(0);

  let processedLines = 0;

  const BATCH_SIZE = 100_000; // 100k líneas por lote (~0.8 MB)
  let batch: Buffer[] = [];
  let lastReport = 0;
  const reportInterval = 10 * 1024 * 1024; // cada 10 MB leídos

  for await (const chunk of rs) {
    for (let i = 0; i < chunk.length; i++) {
      if (chunk[i] === 0x0a) {
        const lineStart = absolutePos + i + 1;
        if (lineStart < fileSize) {
          const buf = Buffer.allocUnsafe(8);
          buf.writeBigUInt64LE(BigInt(lineStart));
          batch.push(buf);
          processedLines++;
          totalRows++;
          if (batch.length >= BATCH_SIZE) {
            ws.write(Buffer.concat(batch));
            batch = [];
          }
        }
      }
    }

    absolutePos += chunk.length;

    // progreso
    if (absolutePos - lastReport >= reportInterval) {
      lastReport = absolutePos;
      const percent = Math.min(parseFloat(((absolutePos / fileSize) * 100).toFixed(2)), 100);
      const progressData = {
        percent,
        processedLines,
        totalRows,
        file: base,
        updatedAt: new Date().toISOString(),
      };
      fs.writeFileSync(progressFile, JSON.stringify(progressData));

      // log en consola cada 5%
      if (Math.abs(percent - ((globalThis as any).lastPercentLogged || 0)) >= 5) {
        console.log(`📦 Indexando ${base} → ${percent}% (${totalRows} líneas)`);
        (globalThis as any).lastPercentLogged = percent;
      }
    }
  }

  // escribir último lote
  if (batch.length > 0) ws.write(Buffer.concat(batch));


  // Cierre seguro
  await new Promise<void>((resolve, reject) => {
    ws.end(() => resolve());
    ws.on("error", reject);
  });

  // 🧩 Calcular offset del encabezado si aplica
  let headerOffset = 0;
  if (useHeaders && totalRows > 1) {
    const fd = fs.openSync(indexPath, "r");
    const buf = Buffer.alloc(8);
    const bytes = fs.readSync(fd, buf, 0, 8, 8);
    fs.closeSync(fd);
    if (bytes === 8) headerOffset = Number(buf.readBigUInt64LE(0));
  }

  // 🧹 Limpieza final: marcar progreso al 100% y cerrar
  try {
    fs.writeFileSync(
      progressFile,
      JSON.stringify({
        percent: 100,
        processedLines,
        totalRows,
        file: base,
        completed: true,
        updatedAt: new Date().toISOString(),
      })
    );
  } catch {}

  // 🧹 Limpieza automática del progress.json después de 10 segundos
  setTimeout(() => {
    if (fs.existsSync(progressFile)) {
      try {
        fs.unlinkSync(progressFile);
        console.log(`🧽 Eliminado progress.json de ${base}`);
      } catch {
        console.warn(`⚠️ No se pudo eliminar progress.json de ${base}`);
      }
    }
  }, 10_000);

  return { indexPath, totalRows, headerOffset };
}
