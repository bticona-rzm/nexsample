// src/app/api/muestra/route.ts
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import xmlFlow from "xml-flow";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import type { Session } from "next-auth"; 
import * as XLSX from "xlsx";
import { datasetStoreEstandar, datasetStoreMasivo, RowData } from "@/lib/datasetStore";


// ---------- Tipos ----------
interface SampleOptions {
  datasetId: string;
  n: number;
  seed: number;
  start: number;
  end: number;
  allowDuplicates: boolean;
  fileName?: string;
}

// ---------- Configuración ----------
const DATASETS_DIR = "F:/datasets";

// // Un solo store global
// if (!(globalThis as any).datasetStore) {
//   (globalThis as any).datasetStore = {};
// }
// const datasetStore: Record<string, { rows: RowData[] }> = (globalThis as any).datasetStore;


// ---------- Utilidades ----------
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomSample(
  array: RowData[],
  n: number,
  seed: number,
  start: number,
  end: number,
  allowDuplicates: boolean
): RowData[] {
  if (array.length === 0) throw new Error("Dataset vacío");
  if (start < 1 || end > array.length || start > end)
    throw new Error("Rango inválido");
  if (!allowDuplicates && n > end - start + 1)
    throw new Error("Más registros que rango disponible sin duplicados");

  const rng = mulberry32(seed);
  const slice = array.slice(start - 1, end);
  const result: RowData[] = [];

  while (result.length < n && slice.length > 0) {
    const idx = Math.floor(rng() * slice.length);
    const item = slice[idx];

    // ✅ NUEVO: agregar número de posición original en el dataset
    const originalPos = start - 1 + idx + 1; // compensamos el rango de inicio
    const rowWithPos = { ...item, _POS_ORIGINAL: originalPos };

    if (!allowDuplicates) slice.splice(idx, 1);
    result.push(rowWithPos);
  }
  return result;
}

function generateHash(data: any): string {
  return createHash("sha256").update(JSON.stringify(data)).digest("hex").slice(0, 12);
}

function toXML(rows: RowData[]): string {
  let xml = "<rows>\n";
  rows.forEach((row) => {
    xml += "  <row>\n";
    Object.entries(row).forEach(([k, v]) => {
      xml += `    <${k}>${v}</${k}>\n`;
    });
    xml += "  </row>\n";
  });
  xml += "</rows>";
  return xml;
}

// === DETECTOR UNIVERSAL DE DELIMITADOR ===
function detectarDelimitador(linea: string): string {
  const candidatos = [";", "|", "\t", ","];

  let mejor = ",";
  let maxCount = 0;

  for (const d of candidatos) {
    const count = linea.split(d).length - 1;
    if (count > maxCount) {
      maxCount = count;
      mejor = d;
    }
  }
  return mejor;
}

// ---------- API ----------
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    //  1) SUBIDA DESDE EL MODAL
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const datasetName = formData.get("datasetName")?.toString() || file?.name || "dataset";
      const useHeader = formData.get("useHeader") === "true";

      if (!file) {
        return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });
      }

      //  Detección de formato
      const lower = file.name.toLowerCase();
      const isXlsx = lower.endsWith(".xlsx") || lower.endsWith(".xls");
      const isCsv = lower.endsWith(".csv") || lower.endsWith(".txt");
      const isJson = lower.endsWith(".json");
      const isXml = lower.endsWith(".xml");
      const format = lower.split(".").pop() || "desconocido";
      console.log(`📁 Subida de archivo: ${file.name} (formato: ${format})`);
      
      //  Crear carpeta datasets si no existe
      fs.mkdirSync(DATASETS_DIR, { recursive: true });

      //  Limpiar nombre del archivo (sin espacios ni caracteres raros)
      const safeName = file.name.replace(/\s+/g, "_").replace(/[^\w.-]/g, "");
      const savePath = path.join(DATASETS_DIR, safeName);
      
      //  Buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      //  Guardar archivo en disco
      fs.writeFileSync(savePath, buffer);
      console.log(" Archivo guardado en:", savePath);

      // Parseo del contenido
      const rows: RowData[] = [];

      if (isXlsx) {
        // Leemos directamente desde el buffer para evitar bloqueo del archivo
        const wb = XLSX.read(buffer, { type: "buffer" });
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(ws, { header: useHeader ? undefined : 1 });
        rows.push(...(Array.isArray(json) ? (json as RowData[]) : [json as RowData]));
      }
      else if (isCsv) {
        const primeraLinea = buffer.toString("utf8").split(/\r?\n/)[0];
        const delimitador = detectarDelimitador(primeraLinea);

        console.log("📌 Delimitador detectado:", delimitador);

        await new Promise<void>((resolve, reject) => {
          fs.createReadStream(savePath)
            .pipe(csv({ separator: delimitador }))
            .on("data", (row: any) => rows.push(row as RowData))
            .on("end", resolve)
            .on("error", reject);
        });
      }
      else if (isJson) {
        const json = JSON.parse(buffer.toString("utf8"));
        rows.push(...(Array.isArray(json) ? json : [json]) as RowData[]);
      } 
      else if (isXml) {
        await new Promise<void>((resolve, reject) => {
          const xmlStream = xmlFlow(fs.createReadStream(savePath));
          xmlStream.on("tag:row", (row: any) => rows.push(row as RowData));
          xmlStream.on("end", resolve);
          xmlStream.on("error", reject);
        });
      } 
      else {
        return NextResponse.json({ error: "Formato de archivo no soportado" }, { status: 400 });
      }

      // Guardar en memoria global
      const datasetId = `std_${Date.now()}`;
      datasetStoreEstandar[datasetId] = {
        rows,
        fileName: safeName,
        displayName: datasetName,
        format: lower.split(".").pop(),
      };

      console.log(` Dataset '${datasetName}' cargado con ${rows.length} filas`);

      // Respuesta final
      return NextResponse.json({
        datasetId,
        rows,
        total: rows.length,
        dataset: datasetName,
        fileName: safeName,
      });
    }

    //  2) JSON NORMAL
    const { action, ...options } = await req.json();

    // === UPLOAD (lectura desde datasets) ===
    if (action === "upload") {
      const { fileName, format } = options as { fileName: string; format: string };
      const filePath = path.join(DATASETS_DIR, fileName);
      if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: "Archivo no encontrado en datasets" }, { status: 404 });
      }

      const rows: RowData[] = [];
      const datasetId = `std_${Date.now()}`;

      if (fileName.toLowerCase().endsWith(".xlsx") || fileName.toLowerCase().endsWith(".xls")) {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        rows.push(...(json as RowData[]));
      } else if (format === "csv" || fileName.toLowerCase().endsWith(".csv") || fileName.toLowerCase().endsWith(".txt")) {
        await new Promise<void>((resolve, reject) => {
          fs.createReadStream(filePath)
            .pipe(csv())
            .on("data", (row: any) => rows.push(row as RowData))
            .on("end", resolve)
            .on("error", reject);
        });
      } else if (format === "json" || fileName.toLowerCase().endsWith(".json")) {
        const json = JSON.parse(fs.readFileSync(filePath, "utf8"));
        rows.push(...(Array.isArray(json) ? json : [json]) as RowData[]);
      } else if (format === "xml" || fileName.toLowerCase().endsWith(".xml")) {
        await new Promise<void>((resolve, reject) => {
          const xmlStream = xmlFlow(fs.createReadStream(filePath));
          xmlStream.on("tag:row", (row: any) => rows.push(row as RowData));
          xmlStream.on("end", resolve);
          xmlStream.on("error", reject);
        });
      } else {
        return NextResponse.json({ error: "Formato de archivo no soportado" }, { status: 400 });
      }

      datasetStoreEstandar[datasetId] = { rows };

      return NextResponse.json({
        datasetId,
        total: rows.length,
        rows,
        fileName,
      });
    }

    // === SAMPLE ===
    if (action === "sample") {
      const { datasetId, n, seed, start, end, allowDuplicates, fileName: customName } = options as SampleOptions;

      // Buscar dataset en memoria (estándar o masivo)
      const meta = datasetStoreEstandar[datasetId] || datasetStoreMasivo?.[datasetId];
      if (!meta.rows || meta.rows.length === 0) {
        return NextResponse.json({ error: "Dataset vacío o no inicializado" }, { status: 400 });
      }

      // Generar la muestra aleatoria
      const sample = randomSample(meta.rows, n, seed, start, end, allowDuplicates);
      const hash = generateHash({ n, seed, start, end, allowDuplicates });

      // Determinar el nombre visible del dataset (para historial)
      const displayName = customName || meta.displayName || meta.fileName || `Dataset_${datasetId}`;
      meta.displayName = displayName;

      // Determinar la fuente exacta (el nombre del archivo subido)
      const fuente = meta.fileName || "archivo no especificado";

      // Obtener sesión de usuario
      const session = (await getServerSession(authOptions)) as Session | null;
      const userId = session?.user?.id;

      // Guardar en historial si hay usuario logueado
      if (userId) {
        try {
          await prisma.historialMuestra.create({
            data: {
              name: displayName,           // 🔹 Nombre visible del dataset o muestra
              records: sample.length,      // 🔹 Cantidad de registros
              range: `${start}-${end}`,    // 🔹 Rango seleccionado
              seed,                        // 🔹 Semilla
              allowDuplicates,             // 🔹 Permitir duplicados
              source: fuente,              // 🔹 Nombre real del archivo subido (ej: cita.xlsx)
              hash,                        // 🔹 Identificador hash único
              tipo: "estandar",            // 🔹 Tipo de muestreo
              userId,                      // 🔹 Usuario actual
            },
          });
        } catch (err) {
          console.error("❌ Error guardando historial estándar:", err);
        }
      }

      // Devolver respuesta al frontend
      return NextResponse.json({
        sample,
        hash,
        totalRows: meta.rows.length,
        datasetName: displayName,
      });
    }

    // === EXPORT ===
    if (action === "export") {
      const { datasetId, format, rows: providedRows } = options as {
        datasetId?: string;
        format: string;
        rows?: RowData[];
      };

      // Preferir rows proporcionadas en el body (cliente puede enviar la muestra directamente)
      let rows: RowData[] | undefined = providedRows as RowData[] | undefined;

      // Si no hay rows en el body, buscar el dataset en memoria por datasetId
      let meta: any;
      if (!rows) {
        if (!datasetId) {
          console.error("⚠️ No se proporcionó datasetId ni rows para exportar");
          return NextResponse.json({ error: "Falta datasetId o rows" }, { status: 400 });
        }

        //  Buscar primero en memoria (estándar o masivo)
        meta =
        datasetStoreEstandar[datasetId] ||
        datasetStoreMasivo[datasetId] ||
        (globalThis as any).datasetStore?.[datasetId] ||
        (globalThis as any).datasetStoreMasivo?.[datasetId];

        if (!meta) {
          console.error("⚠️ Dataset no encontrado en memoria:", datasetId);
          return NextResponse.json({ error: "Dataset no registrado" }, { status: 404 });
        }

        rows = meta.rows;
      }
      if (!rows || rows.length === 0) {
        return NextResponse.json({ error: "Dataset vacío" }, { status: 400 });
      }
      // 🔹 Nombre seguro del archivo
      const safeName = meta?.fileName || datasetId || "dataset";
      
      //  Exportar como JSON
      if (format === "json") {
        return new Response(JSON.stringify(rows, null, 2), {
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename=${meta?.fileName || datasetId || "dataset"}.json`,
          },
        });
      }

      //  Exportar como XML
      if (format === "xml") {
        const escapeXml = (unsafe: any) =>
          String(unsafe)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&apos;");

        let xml = "<rows>\n";
        rows.forEach((row: RowData) => {
          xml += "  <row>\n";
          Object.entries(row).forEach(([key, value]) => {
            xml += `    <${key}>${escapeXml(value)}</${key}>\n`;
          });
          xml += "  </row>\n";
        });
        xml += "</rows>";

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Content-Disposition": `attachment; filename=${safeName}.xml`,
          },
        });
      }

      // Exportar como TXT limpio (sin separadores ni líneas vacías)
      if (format === "txt") {
        const headers = Object.keys(rows[0]);

        // Construcción simple tipo CSV
        const lines = [
          headers.join(","), // Encabezado
          ...rows.map((row: RowData) =>
            headers
              .map((h) => {
                let val = row[h];
                if (val === null || val === undefined) val = "";
                return String(val).replace(/[\n\r,]+/g, " ").trim();
              })
              .join(",")
          ),
        ];

        const content = lines.join("\n");

        return new Response(content, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Content-Disposition": `attachment; filename=${meta?.fileName || datasetId || "dataset"}.${format}`
          },
        });
      }


      //  Exportar como CSV
      if (format === "csv") {
        const headers = Object.keys(rows[0]);
        const csvData =
          headers.join(",") +
          "\n" +
          rows
            .map((row: RowData) =>
              headers.map((h) => JSON.stringify(row[h] ?? "")).join(",")
            )
            .join("\n");

        return new Response(csvData, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename=${datasetId}.csv`,
          },
        });
      }

      //  Exportar como XLSX
      if (format === "xlsx") {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, "Datos");
        const buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

        return new Response(buffer, {
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename=${datasetId}.xlsx`,
          },
        });
      }

      // ❌ Si el formato no coincide
      return NextResponse.json({ error: "Formato no soportado" }, { status: 400 });
    }

    // === HISTORIAL ===
    if (action === "historial") {
      const { userId } = options;
      console.log("🟢 Consultando historial estándar:",userId);
      if (!userId) return NextResponse.json({ error: "Falta userId" }, { status: 400 });
      try {
        const historial = await prisma.historialMuestra.findMany({
          where: { userId},
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
          allowDuplicates: h.allowDuplicates,
          source: h.source,
          hash: h.hash,
          tipo: h.tipo,
        }));

        return NextResponse.json(result);
      } catch (err: any) {
        return NextResponse.json({ error: "Error al consultar historial", details: err.message }, { status: 500 });
      }
    }

    // === LIMPIAR HISTORIAL ===
    if (action === "clearHistorial") {
      const { userId } = options;
      if (!userId) return NextResponse.json({ error: "Falta userId" }, { status: 400 });

      try {
        await prisma.historialMuestra.deleteMany({ where: { userId, tipo: "estandar" } });
        return NextResponse.json({ ok: true });
      } catch (err: any) {
        return NextResponse.json({ error: "Error al limpiar historial", details: err.message }, { status: 500 });
      }
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (err: any) {
    console.error("❌ Error interno en /api/muestra:", err);
    return NextResponse.json({ error: "Error interno en muestra", details: err.message ?? String(err) }, { status: 500 });
  }
}
