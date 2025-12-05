// src/app/api/masiva-chunk/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import JSONStream from "JSONStream";
import xmlFlow from "xml-flow";
import * as XLSX from "xlsx";
import * as readline from "readline";
import { datasetStoreMasivo, RowData } from "@/lib/datasetStore";
import { validarArchivoMasivo } from "@/lib/validarArchivoMasivo";
import sanitize from "sanitize-filename";
import { createHash } from "crypto";
import { pipeline } from "stream";
import { promisify } from "util";
import { spawn } from "child_process";
import { prisma } from "@/lib/prisma";
import { getDatasetDir } from "@/lib/getDatasetDir";


const pipe = promisify(pipeline);

export const runtime = "nodejs";
export const maxDuration = 7200; // hasta 2 horas
const STREAM_CHUNK = 1024 * 1024; // 1 MB


const DATASETS_DIR = getDatasetDir();
const UPLOADS_DIR = path.join(DATASETS_DIR, "uploads");
fs.mkdirSync(UPLOADS_DIR, { recursive: true });


// 🔹 Helper para detectar delimitador en archivos de texto
function detectDelimiter(line: string) {
  if (!line) return "|";
  const candidates = ["|", ";", ",", "\t"];
  const scores = candidates.map((d) => ({
    d,
    count: (line.match(new RegExp(`\\${d}`, "g")) || []).length,
  }));
  scores.sort((a, b) => b.count - a.count);
  return scores[0].d || "|";
}
// 🔹 Helper para generar quick preview y contar filas reales
async function generarQuickPreview(readPath: string, format: string, options?:{useHeaders?: boolean; countAll?: boolean}) {
  const QUICK_PREVIEW_START = 30;
  const QUICK_PREVIEW_END = 30;
  const quickPreviewStart: any[] = [];
  let quickPreviewEnd: any[] = [];
  let totalRows = 0;

  try {
    if (format === "csv") {
    // 🔍 Detecta automáticamente el delimitador (",", ";", "|", tab) en la primera línea del archivo
    const detectFirstNonEmptyLine = async (): Promise<string> => {
      const rs = fs.createReadStream(readPath, { encoding: "utf8", highWaterMark: 64 * 1024 });
      const rl = readline.createInterface({ input: rs, crlfDelay: Infinity });
      for await (const raw of rl) {
        const line = (raw ?? "").trim();
        if (line !== "") {
          rl.close();
          rs.close();
          return line;
        }
      }
      rl.close();
      rs.close();
      return "";
    };

    const firstLine = await detectFirstNonEmptyLine();
    const delim = detectDelimiter(firstLine); // usa tu helper existente

    await new Promise<void>((resolve, reject) => {
      const tailBuffer: any[] = [];
      let parsed = 0;

      const rs = fs.createReadStream(readPath);
      rs.pipe(csv({ separator: delim }))
        .on("data", (row: any) => {
          totalRows++;
          if (parsed < QUICK_PREVIEW_START) quickPreviewStart.push(row);
          else {
            if (tailBuffer.length >= QUICK_PREVIEW_END) tailBuffer.shift();
            tailBuffer.push(row);
          }
          parsed++;
        })
        .on("end", () => {
          quickPreviewEnd = tailBuffer;
          resolve();
        })
        .on("error", reject);
      });
    } else if (format === "xlsx" || format === "xls") {
        const workbook = XLSX.readFile(readPath, { cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: null });
        totalRows = json.length;
        quickPreviewStart.push(...json.slice(0, QUICK_PREVIEW_START));
        quickPreviewEnd.push(...json.slice(Math.max(totalRows - QUICK_PREVIEW_END, 0)));
    } else if (format === "json") {
        const tailBuffer: any[] = [];
        let parsed = 0;
        await new Promise<void>((resolve, reject) => {
          const rs = fs.createReadStream(readPath);
          rs.pipe(JSONStream.parse("*"))
            .on("data", (row: any) => {
              totalRows++;
              if (parsed < QUICK_PREVIEW_START) quickPreviewStart.push(row);
              else {
                if (tailBuffer.length >= QUICK_PREVIEW_END) tailBuffer.shift();
                tailBuffer.push(row);
              }
              parsed++;
            })
            .on("end", () => {
              quickPreviewEnd = tailBuffer;
              resolve();
            })
            .on("error", reject);
        });
    } else if (format === "xml") {
        const tailBuffer: any[] = [];
        let parsed = 0;
        await new Promise<void>((resolve, reject) => {
          const rs = fs.createReadStream(readPath);
          const xf = xmlFlow(rs);
          xf.on("tag:row", (row: any) => {
            totalRows++;
            if (parsed < QUICK_PREVIEW_START) quickPreviewStart.push(row);
            else {
              if (tailBuffer.length >= QUICK_PREVIEW_END) tailBuffer.shift();
              tailBuffer.push(row);
            }
            parsed++;
          });
          xf.on("end", () => {
            quickPreviewEnd = tailBuffer;
            resolve();
          });
          xf.on("error", reject);
        });
    } else if (format === "txt") {
      // === Streaming TXT sin cargar todo en memoria ===
      const rs = fs.createReadStream(readPath, {
        encoding: "utf8",
        highWaterMark: STREAM_CHUNK, // 1MB (ajustable)
      });
      const rl = readline.createInterface({ input: rs, crlfDelay: Infinity });
      const useHeaders = options?.useHeaders === true;
      let headerLine: string | null = null;
      let delimiter: string = "|";
      let headers: string[] = [];
      let isFirstDataLine = true;
      const tailBuffer: any[] = [];

      for await (const raw of rl) {
        const line = raw.trim();
        if (line === "") continue;

        // Detectar cabecera y delimitador (1 sola vez)
        if (headerLine === null) {
          headerLine = line;
          delimiter = detectDelimiter(headerLine);
          headers = useHeaders
            ? headerLine.split(delimiter).map(h => h.trim())
            : [];
          if (useHeaders) {
            // No cuentes la cabecera como fila real
            continue;
          }
        }

        // Parsear fila → objeto
        const values = line.split(delimiter).map(v => v.trim());
        const obj: any = {};
        values.forEach((v, i) => {
          const key =
            headers[i] && headers[i].trim() !== ""
              ? headers[i].trim()
              : `COL_${i + 1}`;
          obj[key] = v;
        });

        // Contar fila real
        totalRows++;

        // Llenar primeras 50
        if (quickPreviewStart.length < QUICK_PREVIEW_START) {
          quickPreviewStart.push(obj);
        } else {
          // Mantener solo las últimas QUICK_PREVIEW_END en buffer circular
          if (tailBuffer.length >= QUICK_PREVIEW_END) tailBuffer.shift();
          tailBuffer.push(obj);
        }
      }
      quickPreviewEnd = tailBuffer;
    }
  } catch (err) {
    console.warn("⚠️ Error generando preview:", err);
  }
  // 🧩 Limitar tamaño de previews para evitar saturación en archivos enormes
  if (quickPreviewStart.length > 100) quickPreviewStart.length = 100;
  if (quickPreviewEnd.length > 100) quickPreviewEnd.length = 100;
  return { quickPreviewStart, quickPreviewEnd, totalRows }; //  ahora sí devuelve totalRows
}

// 🔹 Handler principal
export async function POST(req: Request) {
  try {
    // Caso especial: limpieza de archivo (petición JSON directa)
    if (req.headers.get("content-type")?.includes("application/json")) {
      const body = await req.json().catch(() => ({}));
      // === LIMPIEZA DE FILAS VACÍAS (STREAMING) ===
      if (body.action === "cleanFile") {
        const fileName = body.fileName;
        const opts = body.useHeaders || {};
        const useHeaders = typeof opts === "boolean" ? opts : !!opts.useHeaders;

        if (!fileName) {
          return NextResponse.json({ ok: false, error: "Falta el nombre del archivo" });
        }

        const fullPath = path.join(DATASETS_DIR, fileName);
        if (!fs.existsSync(fullPath)) {
          return NextResponse.json({ ok: false, error: "Archivo no encontrado" });
        }

        const ext = path.extname(fileName).toLowerCase();
        if (ext !== ".txt" && ext !== ".csv") {
          return NextResponse.json({
            ok: false,
            error: "Formato de archivo no compatible para limpieza (usa CSV o TXT)",
          });
        }

        // Archivo destino limpio
        const cleanPath = fullPath.replace(/(\.[\w]+)$/, "_clean$1");
        const ws = fs.createWriteStream(cleanPath, { encoding: "utf8" });
        
        // Lectura de origen
        const rs = fs.createReadStream(fullPath, {
          encoding: "utf8",
          highWaterMark: STREAM_CHUNK, // 1MB
        });
        const rl = readline.createInterface({ input: rs, crlfDelay: Infinity });

        let headerLine: string | null = null;
        let delimiter = "|";
        let headers: string[] = [];
        let wroteHeader = false;

        // Buffers para preview 50/50
        const previewStart: any[] = [];
        const tailBuffer: any[] = [];

        let totalRows = 0; // filas válidas (no vacías) ESCRITAS al limpio

        for await (const raw of rl) {
          const line = raw.trim();
          if (line === "") continue; // salta vacías

          // Delimitador + cabecera
          if (headerLine === null) {
            headerLine = line;
            delimiter = detectDelimiter(headerLine);
            headers = useHeaders
              ? headerLine.split(delimiter).map(h => h.trim())
              : [];

            if (useHeaders) {
              // Reescribir cabecera limpia a salida
              if (!wroteHeader) {
                ws.write(headerLine + "\n");
                wroteHeader = true;
              }
              continue; // no la contamos como fila
            }
            // Si no hay cabecera declarada, no escribimos nada aquí; seguimos a datos
          }

          // Línea de datos: parsear a objeto (para preview)
          const values = line.split(delimiter).map(v => v.trim());
          const obj: any = {};
          values.forEach((v, i) => {
            const key =
              headers[i] && headers[i].trim() !== ""
                ? headers[i].trim()
                : `COL_${i + 1}`;
            obj[key] = v;
          });

          // Escribir al limpio (la línea ya está trim limpia)
          ws.write(line + "\n");
          totalRows++;

          // Previews
          if (previewStart.length < 50) {
            previewStart.push(obj);
          } else {
            if (tailBuffer.length >= 50) tailBuffer.shift();
            tailBuffer.push(obj);
          }
        }

        await new Promise((res, rej) => {
          ws.end(() => res(null));
          ws.on("error", rej);
        });

        const previewEnd = tailBuffer;

        return NextResponse.json({
          ok: true,
          message: "Archivo limpiado correctamente",
          cleanedFile: path.basename(cleanPath),
          totalRows,
          previewStart,
          previewEnd,
          fileName: path.basename(cleanPath),
        });
      }
    }

    // Si no es limpieza, tratamos como subida de chunks
    const formData = await req.formData();
    const chunk = formData.get("chunk") as File;
    
    const index = Number(formData.get("index"));
    const total = Number(formData.get("total"));
    const fileId = formData.get("fileId") as string;
    const fileName = formData.get("fileName") as string;
    const datasetName = formData.get("datasetName") as string;
    const isLast = formData.get("isLast") === "true";
    //  Nuevo: obtener el userId desde el header para no llamar NextAuth por cada chunk
    const userId = req.headers.get("x-user-id") || null;
    //  Nuevo: detectar si el archivo tiene cabecera
    const useHeaders = formData.get("useHeaders") === "true";

    if (!chunk || !fileId || !fileName)
      return NextResponse.json({ error: "Datos incompletos en chunk" }, { status: 400 });

    const safeOriginalName = sanitize(fileName);
    const tmpPath = path.join(UPLOADS_DIR, `${fileId}.upload`);
    
    if (index > 0 && !fs.existsSync(tmpPath)) {
      // reanudar tras reinicio del servidor
      fs.writeFileSync(tmpPath, "");
      console.warn(`⚠️ Archivo temporal recreado tras reinicio para reanudar carga ${fileId}`);
    }
    if (index === 0 && fs.existsSync(tmpPath)) {
      console.warn(`⚠️ Ya existe una subida parcial en curso para ${fileName}`);
      try {
        await fs.promises.unlink(tmpPath);
      } catch {}
    } else if (index > 0 && fs.existsSync(tmpPath)) {
      const stats = await fs.promises.stat(tmpPath);
      console.log(`🔁 Reanudando carga: ${stats.size} bytes ya escritos`);
    }

    // === Escritura robusta del chunk (idempotente por offset) ===
    const CHUNK_SIZE = 16 * 1024 * 1024; // mismo valor que en frontend
    const expectedOffset = index * CHUNK_SIZE;

    // Si es el primer chunk y hay archivo previo → reiniciar
    if (index === 0 && fs.existsSync(tmpPath)) {
      await fs.promises.unlink(tmpPath).catch(() => {});
    }

    // Comprobar tamaño actual
    const currentSize = fs.existsSync(tmpPath)
      ? (await fs.promises.stat(tmpPath)).size
      : 0;

    // 1️⃣ Si este chunk ya está escrito (por reintento), saltar
    if (currentSize >= expectedOffset + (chunk.size ?? 0)) {
      console.log(`🔁 Chunk duplicado ${index}, ya estaba escrito`);
      return NextResponse.json({ ok: true, chunk: index });
    }

    // 2️⃣ Si llega fuera de orden (falta anterior), esperar
    if (currentSize < expectedOffset) {
      console.warn(`⏳ Chunk fuera de orden: size=${currentSize} < expected=${expectedOffset}`);
      return NextResponse.json({ ok: false, wait: true, chunk: index });
    }

    // 3️⃣ Escribir el chunk
    const nodeReadable =
      typeof (chunk as any).stream === "function" ? (chunk as any).stream() : null;

    if (nodeReadable) {
      // @ts-ignore
      const readable = require("stream").Readable.fromWeb(nodeReadable);
      const ws = fs.createWriteStream(tmpPath, { flags: "a" });
      await new Promise<void>((resolve, reject) => {
        readable.pipe(ws);
        ws.on("finish", resolve);
        ws.on("error", reject);
      });
    } else {
      const buffer = Buffer.from(await chunk.arrayBuffer());
      await fs.promises.appendFile(tmpPath, buffer);
    }

    console.log(`📦 Chunk ${index + 1}/${total} agregado`);
    const stats = await fs.promises.stat(tmpPath);
    console.log(`📏 Tamaño acumulado actual: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`🧠 RAM usada: ${used.toFixed(2)} MB`);

    if (!isLast) return NextResponse.json({ ok: true, chunk: index });

    // === Último chunk: finalizar ===
    // === Último chunk: finalizar ===
    const baseName = path.basename(safeOriginalName || "uploaded_file");

    // Normalizamos el nombre original para evitar espacios raros o caracteres peligrosos,
    // pero conservamos el nombre "humano" del archivo (sin prefijo msv_).
    const safeBase = baseName
      .normalize("NFKC")
      .replace(/\s+/g, "_")
      .replace(/[^\w.\-]/g, "");
    // El formato se sigue detectando igual
    const format = safeBase.split(".").pop()?.toLowerCase() || "txt";
    // 👉 DatasetId se sigue usando SOLO como identificador lógico (BD, meta.json, etc.),
    // ya NO se mete en el nombre físico del archivo.
    const datasetId = `msv_${Date.now()}`;
    // 👉 Nombre físico final del archivo en /datasets:
    //     Ctas_especificas.txt   (sin msv_ delante)
    const safeName = safeBase;
    // Ruta del archivo final en /datasets
    const finalSafePath = path.join(DATASETS_DIR, safeName);

    if (fs.existsSync(finalSafePath)) {
      console.log(`⚠️ Archivo temporal ya existe. Se omite reanudación falsa.`);
      return NextResponse.json({ ok: true, wait: false, fileName: path.basename(finalSafePath), datasetId });
    } else {
      // 🔍 Verificar si el archivo temporal está vacío antes de renombrar
      const tmpStats = await fs.promises.stat(tmpPath).catch(() => null);
      if (tmpStats && tmpStats.size === 0) {
        console.warn("⚠️ Archivo temporal vacío, posible reintento tras reinicio.");
      }
      await fs.promises.rename(tmpPath, finalSafePath);
      console.log(`✅ Archivo final ensamblado: ${safeName}`);
    }
    // ======================================================
    // === HISTORIALIMPORT MASIVO — REGISTRO INICIAL ========
    // ======================================================
    try {
      const session = (await getServerSession(authOptions)) as any;
      const userId = session?.user?.id;

      if (!userId) {
        console.log("⚠️ No hay usuario autenticado, no se registrará historialImport.");
      } else {
        const statsFinal = await fs.promises.stat(finalSafePath);

        await prisma.historialImport.create({
          data: {
            nombreArchivo: safeName,
            rutaArchivo: finalSafePath,
            tamanoBytes: statsFinal.size,
            tipoMime: chunk.type || undefined,
            origenDatos: format,
            nombreHoja: null,
            tieneEncabezados: useHeaders,
            delimitadorDetectado: null,
            previewInicio: 0,
            previewFin: 0,
            registrosTotales: 0,
            datasetId,
            metadata: {
              estado: "UPLOAD_COMPLETED",
              receivedAt: new Date().toISOString(),
            },
            usuarioId: userId, // <-- ahora garantizado string, no null
          },
        });

        console.log("🟢 HistorialImport MASIVO creado (PRELIMINAR)");
      }
    } catch (error) {
      console.error("❌ Error registrando HistorialImport preliminar:", error);
    }
    
    // 🧹 Limpieza de temporales residuales
    try {
      if (fs.existsSync(tmpPath)) await fs.promises.unlink(tmpPath);
    } catch (e) {
      console.warn("No se pudo limpiar temporal:", e);
    }

    // === Lanzar proceso hijo optimizado (RAM controlada y logs visibles) ===
    // === Lanzar proceso hijo optimizado (RAM controlada y logs visibles) ===
    try {
      const statusPath = `${finalSafePath}.meta.status`;
      await fs.promises.mkdir(path.dirname(statusPath), { recursive: true });

      // 🟡 Estado inicial → "running"
      const status = {
        state: "running",
        pid: null as number | null,
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await fs.promises.writeFile(statusPath, JSON.stringify(status, null, 2));

      // 🚀 Lanzar proceso hijo independiente
      const metaWorker = path.join(process.cwd(), "scripts", "workerMeta.js");
      const child = spawn("node", [
        "--max-old-space-size=8192",
        "--expose-gc",
        metaWorker,
        finalSafePath,
        "--datasetId", datasetId,
        "--useHeaders", useHeaders ? "true" : "false",
      ], {
        detached: true,                 // 🔥 independencia total
        stdio: ["ignore", "pipe", "pipe"], // logs opcionales
        cwd: process.cwd(),
        env: process.env,
      });

      // 🔓 Permite que el proceso siga aunque Next.js termine
      child.unref();

      // 🔹 Actualizar estado con el PID
      status.pid = child.pid ?? null;
      status.updatedAt = new Date().toISOString();
      await fs.promises.writeFile(statusPath, JSON.stringify(status, null, 2));

      console.log(`👶 Worker meta iniciado (PID ${child.pid}) en background`);

      // Mostrar progreso del hijo (opcional)
      child.stdout?.on("data", (data) => {
        const line = data.toString().trim();
        if (line) console.log(`[meta-child]: ${line}`);
      });

      child.stderr?.on("data", (data) => {
        const line = data.toString().trim();
        if (line) console.error(`[meta-child:ERROR]: ${line}`);
      });

      // 🔄 Al finalizar, actualizar meta.status
      child.on("close", (code) => {
        const newStatus = {
          state: code === 0 ? "done" : "error",
          pid: child.pid,
          finishedAt: new Date().toISOString(),
          exitCode: code,
        };
        fs.promises
          .writeFile(statusPath, JSON.stringify(newStatus, null, 2))
          .then(() => console.log(`👋 Proceso hijo finalizó con código ${code}`))
          .catch((e) => console.warn("⚠️ No se pudo actualizar el meta.status:", e));
      });
    } catch (err) {
      console.error("❌ Error al lanzar proceso hijo para meta.json:", err);
      const statusPath = `${finalSafePath}.meta.status`;
      await fs.promises.writeFile(
        statusPath,
        JSON.stringify({
          state: "error",
          error: String(err),
          updatedAt: new Date().toISOString(),
        }, null, 2)
      );
    }

    global.gc?.(); // limpia buffers de chunks del proceso principal
    liberarDataset(datasetId); // tu función actual

    // === Cálculo de checksum SHA-256 (streaming) ===
    const hash = createHash("sha256");
    const rs = fs.createReadStream(finalSafePath);
    for await (const chunk of rs) hash.update(chunk);
    const checksum = hash.digest("hex");
    console.log(`🔒 Checksum SHA-256: ${checksum}`);

    // === Validación de filas vacías (sin bloquear) ===
    const validation = await validarArchivoMasivo(finalSafePath);
    if (validation.emptyLines > 0) {
      console.log(`⚠️ Se detectaron ${validation.emptyLines} filas vacías en ${safeName}`);
      return NextResponse.json({
        ok: false,
        requiresCleaning: true,
        fileName: safeName,
        datasetId,
        emptyLines: validation.emptyLines,
        totalLines: validation.totalLines,
        message: `Se detectaron ${validation.emptyLines} filas vacías en el archivo.`,
      });
    }

    // 🕐 Espera corta (5s) para confirmar que el proceso hijo inicie correctamente
    await new Promise((r) => setTimeout(r, 5000));
    if (!fs.existsSync(`${finalSafePath}.meta.json`)) {
      console.warn("⚠️ Meta.json aún no generado, continuará en segundo plano.");
    } else {
      console.log("🗂️ Meta.json detectado:", `${finalSafePath}.meta.json`);
    }

    // ✅ Guardar nombre real del archivo en su meta.json (para futuras rutas)
    try {
      const metaPath = `${finalSafePath}.meta.json`;
      if (fs.existsSync(metaPath)) {
        const meta = JSON.parse(await fs.promises.readFile(metaPath, "utf8"));
        meta.fileName = safeName;
        meta.datasetId = datasetId;
        await fs.promises.writeFile(metaPath, JSON.stringify(meta, null, 2), "utf8");
        console.log(`🧾 Meta.json actualizado con fileName=${safeName}`);
      }
    } catch (err) {
      console.warn("⚠️ No se pudo actualizar el meta.json:", err);
    }

    // === Guardar metadatos finales (ya los tenés en meta.json) ===
    const resultPayload = {
      ok: true,
      datasetId,
      fileName: safeName,
      datasetName,
      format,
      message: "📦 Archivo subido correctamente. Meta.json se generará en segundo plano.",
    };
    liberarDataset(datasetId);
    global.gc?.();
    return NextResponse.json(resultPayload);
    } catch (err: any) {
      console.error("❌ Error en masiva-chunk:", err);
      return NextResponse.json(
        { error: "Error procesando chunk", details: err.message },
        { status: 500 }
      );
    }
  }

  // 🔹 Liberación automática de datasets en memoria
  function liberarDataset(datasetId: string, delayMs = 20 * 60 * 1000) {
    console.log(`🕐 Programada limpieza del dataset ${datasetId} en ${delayMs / 60000} min.`);
    setTimeout(() => {
      if (datasetStoreMasivo[datasetId]) {
        console.log(`🧹 Liberando dataset masivo de memoria: ${datasetId}`);
        delete datasetStoreMasivo[datasetId];
        global.gc?.(); // fuerza GC si se ejecutó con --expose-gc
        console.log("🧠 GC manual ejecutado tras masiva-chunk");
      }
    }, delayMs);
  }
