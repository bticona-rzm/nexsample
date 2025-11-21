// src/app/api/muestra-masiva/route.ts
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import os from "os";
import { validarArchivoMasivo } from "@/lib/validarArchivoMasivo";
import { eliminarFilasVacias } from "@/lib/eliminarFilasVacias";
import { muestrearArchivoMasivo } from "@/lib/muestrearArchivoMasivo";
import { generarIndiceArchivoMasivo } from "@/lib/generarIndiceArchivoMasivo";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import type { Session } from "next-auth";
import { generarMetaMasivo } from "@/lib/generarMetaMasivo";
  
  console.log("⚠️ [muestra-masiva] Backend MUESTRA-MASIVA cargado (NUEVO)");
  // === CONFIGURACIÓN ===
  const DATASETS_DIR = process.env.DATASETS_DIR || "F:/datasets";
  const LOG_FILE = path.join(DATASETS_DIR, "muestra-masiva.log");

  // === FUNCIÓN DE LOG A ARCHIVO + CONSOLA ===
  function logToFile(message: string) {
    
    try {
      const timestamp = new Date().toISOString().replace("T", " ").split(".")[0];
      const formatted = `[${timestamp}] ${message}${os.EOL}`;
      fs.appendFileSync(LOG_FILE, formatted);
    } catch (err) {
      console.error("Error escribiendo en log:", err);
    }
    console.log(message);
  }

  // =======================================================
  // 🔹 CONTROLADOR PRINCIPAL POST
  // =======================================================
  export async function POST(req: Request) {
    try {
      const body = await req.json();
      const { action, fileName, n, seed, start, end, useHeaders = true, allowDuplicates = false } = body;
      if (action === "historial") {
        logToFile("🟠 Acción historial: no requiere archivo físico");
        
        const session = (await getServerSession(authOptions)) as Session | null;
        const userId = session?.user?.id ?? body?.userId ?? null;
        if (!userId) {
          return NextResponse.json({ error: "Falta userId" }, { status: 400 });
        }

        try {
          const historial = await prisma.historialMuestra.findMany({
            where: { userId, tipo: { in: ["masivo", "masivo_indexed", "masivo_indexed_clean"] } },
            orderBy: { createdAt: "desc" },
            include: { user: { select: { name: true, email: true } } },
          });

          const result = historial.map((h) => ({
            id: h.id,
            name: h.name,
            createdAt: h.createdAt,
            userDisplay: h.user?.name ?? h.user?.email ?? h.userId,
            records: h.records,
            range: h.range,
            seed: h.seed,
            allowDuplicates:
            typeof h.allowDuplicates === "boolean"
            ? h.allowDuplicates
            : String(h.allowDuplicates).toLowerCase() === "true",
            source: h.source,
            hash: h.hash,
            tipo: h.tipo,
          }));
          return NextResponse.json(result);
        } catch (err: any) {
          logToFile("💥 Error consultando historial masivo: " + err.message);
          return NextResponse.json({ error: "Error consultando historial", details: err.message }, { status: 500 });
        }
      }

      if (!fileName && !["historial", "exportHistorial"].includes(action)) {
        logToFile("⚠️ Falta fileName en el body");
        return NextResponse.json({ error: "Falta fileName" }, { status: 400 });
      }
      // Buscar el archivo físico aunque tenga prefijo (ej. msv_12345_...)
      // --- Resolver ruta física fiable ---
      let datasetPath: string | null = null;

      // 1) Si vino ruta absoluta válida
      if (path.isAbsolute(fileName) && fs.existsSync(fileName)) {
        datasetPath = fileName;
      } else {

        // 2) Si vino solo nombre, buscar en DATASETS_DIR
        const files = fs.readdirSync(DATASETS_DIR);
        const baseLower = fileName.toLowerCase();

        let hit =
          files.find(f => f.toLowerCase() === baseLower) ||
          files.find(f =>
            f.toLowerCase().includes(baseLower.replace(".csv", "")) &&
            !f.endsWith(".meta.json") &&
            !f.endsWith(".index")
          );

        //  Si no hay coincidencia, buscar por archivo fuente (.source) del historial
        if (!hit && fileName.includes("muestra")) {
          const alt = files.find(f => f.toLowerCase().includes("ctas_especificas.csv"));
          if (alt) hit = alt;
        }

        if (!hit) {
          logToFile("❌ Archivo no encontrado físicamente: " + fileName);
          return NextResponse.json({ error: "Archivo no encontrado físicamente" }, { status: 404 });
        }

        // d) Último recurso: includes
        if (!hit) {
          hit = files.find(f =>
            f.toLowerCase().includes(baseLower) &&
            !f.endsWith(".meta.json") &&
            !f.endsWith(".index")
          );
        }
        if (hit) datasetPath = path.join(DATASETS_DIR, hit);
      }

      if (!datasetPath || !fs.existsSync(datasetPath)) {
        logToFile("❌ Archivo no encontrado físicamente: " + fileName);
        return NextResponse.json({ error: "Archivo no encontrado físicamente" }, { status: 404 });
      }
      const filePath = datasetPath; // ← ya es absoluto
      logToFile("📂 Archivo encontrado físicamente:" + path.basename(filePath));

      // === 1️⃣ VALIDAR ===
      if (action === "validate") {
        logToFile(`🔍 Validando archivo: ${fileName}`);
        const res = await validarArchivoMasivo(filePath);
        logToFile(`✅ Validación completa: ${res.totalLines} líneas, ${res.emptyLines} vacías`);
        return NextResponse.json(res);
      }

      // === 2️⃣ LIMPIAR ===
      if (action === "clean") {
        logToFile(`🧼 Limpiando archivo: ${fileName}`);
        const cleanPath = filePath.replace(/(\.[\w]+)$/, "_clean$1");
        const lines = await eliminarFilasVacias(filePath, cleanPath);
        logToFile(`✅ Archivo limpio guardado como ${cleanPath} (${lines} líneas válidas)`);
        return NextResponse.json({ ok: true, cleanFile: path.basename(cleanPath), lines });
      }

      //  MUESTREAR 
      // === 3️⃣ CREAR ÍNDICE ===
      if (action === "buildIndex") {
        // 🔒 Evitar procesos concurrentes de indexado por archivo (no global)
        const g = globalThis as any;
        // si aún no existe la tabla de locks, la creamos
        if (!g.isIndexingMap) {
          g.isIndexingMap = new Map<string, boolean>();
        }

        const key = filePath; // identifica el archivo actual

        // si ya hay un indexado en curso para este archivo, devolvemos 429
        if (g.isIndexingMap.get(key)) {
          const msg = `⏳ Ya hay un proceso de indexado en curso para ${path.basename(filePath)}`;
          logToFile(msg);
          return NextResponse.json({ error: msg }, { status: 429 });
        }

        // 🔒 Marcar inicio del proceso de este archivo
        g.isIndexingMap.set(key, true);

        try {
          const indexPath = `${filePath}.index`;
          const statusPath = `${filePath}.meta.status`;

          // ✅ Reutilizar índice existente si ya está OK
          if (fs.existsSync(indexPath) && fs.existsSync(statusPath)) {
            const status = fs.readFileSync(statusPath, "utf8").trim();
            if (status === "OK") {
              const rows = Math.floor(fs.statSync(indexPath).size / 8);
              logToFile(`✅ [INDEX] Reutilizando índice existente (${rows} filas)`);

              // liberar lock antes de salir
              g.isIndexingMap.set(key, false);

              return NextResponse.json({
                ok: true,
                reused: true,
                totalRows: rows,
                message: "Índice ya existente reutilizado",
              });
            }
          }

          // 🧱 Construir índice nuevo
          logToFile(`📘 [INDEX] Construyendo índice para ${fileName}`);
          const t0 = Date.now();
          const result = await generarIndiceArchivoMasivo(filePath, { useHeaders });
          const secs = ((Date.now() - t0) / 1000).toFixed(2);

          // Guardar estado OK
          fs.writeFileSync(statusPath, "OK");
          logToFile(`✅ [INDEX] Índice creado (${result.totalRows} filas, ${secs}s)`);

          return NextResponse.json({
            ok: true,
            ...result,
            message: "Índice generado correctamente",
          });
        } catch (err: any) {
          logToFile("💥 Error construyendo índice: " + err.message);
          return NextResponse.json({ error: err.message }, { status: 500 });
        } finally {
          // 🔓 Liberar el lock solo para este archivo (si existe el mapa)
          const g2 = globalThis as any;
          if (g2.isIndexingMap) {
            g2.isIndexingMap.set(key, false);
          }
        }
      }

      // === 4️⃣ MUESTREAR ARCHIVO YA INDEXADO ===
      if (action === "sample") {
        try {
          logToFile(`🎯 Generando muestra del archivo ${fileName}`);

          const { sample, hash } = await muestrearArchivoMasivo(filePath, {
            n,
            seed,
            start,
            end,
            useHeaders,
            allowDuplicates,
          });

          logToFile(`✅ Muestra generada (${sample.length} registros)`);

          // === GUARDAR MUESTRA FÍSICAMENTE ===
          let archivoResultado: string | null = null;
          try {
            archivoResultado = `sample_${Date.now()}_${path.basename(filePath)}`;
            const sampleFilePath = path.join(DATASETS_DIR, archivoResultado);

            // 1️⃣ Convertir la muestra a CSV (como ya lo hacías)
            const csvData = Array.isArray(sample)
              ? sample
                  .map((row) =>
                    typeof row === "object"
                      ? Object.values(row)
                          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
                          .join(",")
                      : String(row)
                  )
                  .join("\n")
              : String(sample);

            fs.writeFileSync(sampleFilePath, csvData, "utf8");
            logToFile(`💾 Muestra guardada físicamente como ${archivoResultado}`);

            // 2️⃣ REGENERAR META/ÍNDICE PARA ESTE ARCHIVO DE MUESTRA
            try {
              logToFile(`⚙️ Generando meta para archivo de muestra: ${sampleFilePath}`);
              await generarMetaMasivo(sampleFilePath, 30);
              logToFile(`✅ meta.json de la muestra generado correctamente`);
            } catch (metaErr: any) {
              logToFile("❌ Error generando meta de la muestra: " + metaErr.message);
            }

          } catch (err: any) {
            logToFile("💥 Error guardando archivo de muestra: " + err.message);
          }

          // === GUARDAR EN HISTORIAL (BASE DE DATOS) ===
          const session = (await getServerSession(authOptions)) as Session | null;
          const userId = session?.user?.id ?? null;

          if (userId) {
            try {
              logToFile(`📦 allowDuplicates recibido: ${JSON.stringify(body?.allowDuplicates)}`);
              await prisma.historialMuestra.create({
                data: {
                  name: body?.datasetName || path.basename(filePath),
                  records: sample.length,
                  range: `${start}-${end}`,
                  seed,
                  allowDuplicates:
                  typeof body?.allowDuplicates === "boolean"
                  ? body.allowDuplicates
                  : String(body?.allowDuplicates).toLowerCase() === "true",
                  source: path.basename(filePath),
                  hash,
                  tipo: "masivo",
                  userId,
                  archivoResultado,   //  sigue guardando el nombre físico
                  createdAt: new Date(),
                },
              });
              logToFile("🧾 Historial de muestra guardado correctamente");
            } catch (err) {
              logToFile("❌ Error guardando historial: " + err);
            }
          }

          return NextResponse.json({
            ok: true,
            sample,
            hash,
            archivoResultado,
            message: "Muestra generada correctamente",
          });
        } catch (err: any) {
          logToFile("💥 Error en muestreo masivo: " + err.message);
          return NextResponse.json(
            { error: "Error en el muestreo masivo", details: err.message },
            { status: 500 }
          );
        }
      }

      // === 5️⃣ LIMPIAR + MUESTREAR ===
      if (action === "cleanAndSample") {
        logToFile(`🧼📘 Limpieza + muestreo de ${fileName}`);
        const targetClean = filePath.replace(/(\.[\w]+)$/, "_clean$1");
        const written = await eliminarFilasVacias(filePath, targetClean);
        logToFile(`✅ Archivo limpio (${written} líneas válidas)`);

        const idx = await generarIndiceArchivoMasivo(targetClean, { useHeaders });
        logToFile(`📗 Índice limpio generado (${idx.totalRows} filas)`);

        const { sample, hash } = await muestrearArchivoMasivo(targetClean, { n, seed, start, end, useHeaders});
        logToFile(`🏁 Muestra limpia generada (${sample.length} registros)`);

        const session = (await getServerSession(authOptions)) as Session | null;
        const userId = session?.user?.id ?? null;
        if (userId) {
          try {
            await prisma.historialMuestra.create({
              data: {
                name: path.basename(targetClean),
                records: sample.length,
                range: `${start}-${end}`,
                seed,
                allowDuplicates: false,
                source: path.basename(targetClean),
                hash,
                tipo: "masivo_indexed_clean",
                userId,
              },
            });
            logToFile("🧾 Historial limpio guardado");
          } catch (err) {
            logToFile("❌ Error guardando historial limpio:" + err);
          }
        }

        return NextResponse.json({
          ok: true,
          cleaned: true,
          sample,
          hash,
          message: "Archivo limpio e índice generados correctamente",
        });
      }
      // === 6 EXPORTAR  
      if (action === "export") {
        try {
          const { fileName, format = "csv" } = body;
          if (!fileName) {
            return NextResponse.json({ error: "Falta fileName" }, { status: 400 });
          }

          logToFile(`📦 [EXPORT] Solicitud de exportación: ${fileName}`);

          // === Buscar archivo físico ===
          const files = fs.readdirSync(DATASETS_DIR);
          const baseLower = fileName.toLowerCase();
          let hit =
            files.find((f) => f.toLowerCase() === baseLower) ||
            files.find(
              (f) =>
                f.toLowerCase().includes(baseLower.replace(".csv", "")) &&
                !f.endsWith(".meta.json") &&
                !f.endsWith(".index")
            );

          // 🔍 Si no se encontró, intentar buscar por patrón de origen
          if (!hit && fileName.includes("muestra")) {
            hit = files.find((f) => f.toLowerCase().includes("ctas_especificas.csv"));
          }

          // 🔍 Último recurso: buscar archivos CSV similares
          if (!hit) {
            const candidates = files.filter(
              (f) =>
                f.toLowerCase().endsWith(".csv") &&
                !f.endsWith(".meta.json") &&
                !f.endsWith(".index")
            );
            logToFile(
              `⚠️ [EXPORT] No se encontró coincidencia exacta. Candidatos: ${candidates.join(", ")}`
            );
          }

          if (!hit) {
            logToFile("❌ [EXPORT] Archivo no encontrado físicamente: " + fileName);
            return NextResponse.json(
              { error: "Archivo no encontrado físicamente" },
              { status: 404 }
            );
          }

          // === Archivo encontrado ===
          const filePath = path.join(DATASETS_DIR, hit);
          logToFile(`📂 [EXPORT] Archivo encontrado físicamente: ${path.basename(filePath)}`);

          // === Enviar archivo como descarga ===
          const stat = fs.statSync(filePath);
          const stream = fs.createReadStream(filePath, { highWaterMark: 64 * 1024 });

          const mimeTypes: Record<string, string> = {
            csv: "text/csv",
            json: "application/json",
            xml: "application/xml",
            txt: "text/plain",
          };
          const mime = mimeTypes[format] || "text/plain";

          const headers = new Headers({
            "Content-Type": mime,
            "Content-Disposition": `attachment; filename="${path.basename(
              filePath
            )}"`,
            "Content-Length": stat.size.toString(),
          });

          logToFile(`✅ [EXPORT] Enviando archivo (${format.toUpperCase()})`);
          return new Response(stream as any, { headers });
        } catch (err: any) {
          logToFile("💥 [EXPORT] Error en exportación: " + err.message);
          return NextResponse.json({ error: err.message }, { status: 500 });
        }
      }

      // === 7️⃣ EXPORTAR POR STREAMING (para grandes muestreos) ===
      if (action === "export-stream") {
        try {
          const { format, fileName } = body;
          if (!fileName) {
            return NextResponse.json(
              { error: "Nombre de archivo no especificado." },
              { status: 400 }
            );
          }

          const baseName = path.basename(fileName).trim();
          const filePath = path.join(DATASETS_DIR, baseName);

          if (!fs.existsSync(filePath)) {
            console.error("❌ [EXPORT-STREAM] Archivo no encontrado físicamente:", filePath);
            return NextResponse.json(
              { error: "Archivo no encontrado físicamente" },
              { status: 404 }
            );
          }

          console.log(`🌊 [EXPORT-STREAM] Enviando ${filePath} como ${format}`);

          // === Leer y limpiar CSV ===
          const rawData = fs.readFileSync(filePath, "utf8");

          // 🔹 Limpieza de comillas extra (""" -> ")
          const cleanCSV = rawData
            .replace(/"{3,}/g, '"')
            .replace(/^"+|"+$/gm, "")
            .replace(/\r?\n/g, "\n")
            .trim();

          // === Separar cabecera y datos ===
          const lines = cleanCSV.split("\n").filter(l => l.trim().length > 0);

          // Si el archivo no tiene cabecera, generamos una genérica
          const headers = lines.length > 0
            ? lines[0].split(",").map((h, i) =>
                h
                  .replace(/"/g, "")
                  .replace(/\s+/g, "_")
                  .replace(/[^a-zA-Z0-9_]/g, "")
                  .trim() || `Col${i + 1}`
              )
            : [];

          const dataRows = lines.slice(1).map(row =>
            row.split(",").map(v => v.replace(/"/g, "").trim())
          );

          // === Exportación por formato ===
          let content = "";
          let mimeType = "";

          // 📄 CSV (ya limpio y con cabecera)
          if (format === "csv") {
            content = [headers.join(","), ...dataRows.map(r => r.join(","))].join("\n");
            mimeType = "text/csv";
          }

          // 📜 JSON
          if (format === "json") {
            const jsonData = dataRows.map(row => {
              const obj: Record<string, any> = {};
              headers.forEach((h, i) => (obj[h] = row[i] ?? ""));
              return obj;
            });
            content = JSON.stringify(jsonData, null, 2);
            mimeType = "application/json";
          }

          // 🧾 TXT
          if (format === "txt") {
            const table = [headers.join(" | "), ...dataRows.map(r => r.join(" | "))];
            content = table.join("\n");
            mimeType = "text/plain";
          }

          // ⚙️ XML
          if (format === "xml") {
            let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n';
            for (const row of dataRows) {
              xml += "  <record>\n";
              headers.forEach((h, i) => {
                const safeTag = h || `Col${i + 1}`;
                const safeValue = (row[i] ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                xml += `    <${safeTag}>${safeValue}</${safeTag}>\n`;
              });
              xml += "  </record>\n";
            }
            xml += "</root>";
            content = xml;
            mimeType = "application/xml";
          }

          // === Enviar contenido resultante ===
          return new NextResponse(content, {
            headers: {
              "Content-Type": mimeType,
              "Content-Disposition": `attachment; filename="${path.basename(
                filePath,
                ".csv"
              )}.${format}"`,
            },
          });
        } catch (err: any) {
          console.error("💥 Error en export-stream:", err);
          return NextResponse.json(
            { error: "Fallo al exportar archivo físico." },
            { status: 500 }
          );
        }
      }
      logToFile(`⚠️ Acción inválida recibida: ${action}`);
      return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
    } catch (err: any) {
      logToFile("💥 Error en muestra-masiva: " + err.message);
      return NextResponse.json({ error: "Error interno", details: err.message }, { status: 500 });
    }
  }
