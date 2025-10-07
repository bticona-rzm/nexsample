import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import JSONStream from "JSONStream";
import xmlFlow from "xml-flow";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import type { Session } from "next-auth";


// Tipo genérico para las filas
// ---------- Tipos ----------
type RowData = Record<string, any>;

interface SampleOptions {
  datasetId: string;
  n: number;
  seed: number;
  start: number;
  end: number;
  allowDuplicates: boolean;
}

// Ruta local fija de datasets (solo en entorno local)
const DATASETS_DIR = "C:/datasets";

if (!(globalThis as any).datasetStoreMasivo) {
  (globalThis as any).datasetStoreMasivo = {};
}
const datasetStoreMasivo: Record<string, { fileName: string; format: string }> =
  (globalThis as any).datasetStoreMasivo;

// ---------- Utilidades ----------
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateHash(data: any): string {
  return crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex").slice(0, 12);
}

// ---------- API ----------
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const { action, ...options } = await req.json();

      // --- A) Registrar dataset masivo
      if (action === "register") {
        const { fileName, format } = options;
        const filePath = path.join(DATASETS_DIR, fileName);

        if (!fs.existsSync(filePath)) {
          return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
        }

        const datasetId = `msv_${Date.now()}`;
        datasetStoreMasivo[datasetId] = { fileName, format };

        const preview: RowData[] = [];
        if (format === "csv") {
          await new Promise<void>((resolve, reject) => {
            fs.createReadStream(filePath)
              .pipe(csv())
              .on("data", (row: RowData) => {
                if (preview.length < 50) preview.push(row);
              })
              .on("end", resolve)
              .on("error", reject);
          });
        } else if (format === "json") {
          await new Promise<void>((resolve, reject) => {
            fs.createReadStream(filePath)
              .pipe(JSONStream.parse("*"))
              .on("data", (row: RowData) => {
                if (preview.length < 50) preview.push(row);
              })
              .on("end", resolve)
              .on("error", reject);
          });
        } else if (format === "xml") {
          await new Promise<void>((resolve, reject) => {
            const xmlStream = xmlFlow(fs.createReadStream(filePath));
            xmlStream.on("tag:row", (row: RowData) => {
              if (preview.length < 50) preview.push(row);
            });
            xmlStream.on("end", resolve);
            xmlStream.on("error", reject);
          });
        }

        return NextResponse.json({
          datasetId,
          fileName,
          format,
          preview,
        });
      }

      // --- B) Muestreo masivo (streaming)
      if (action === "sample") {
        const { datasetId, n, seed, start, end, allowDuplicates, fileName, userId: userIdFromClient } =
          options as SampleOptions & { fileName?: string; userId?: string };

        // 🔑 Obtenemos la sesión del usuario autenticado
        const session = (await getServerSession(authOptions)) as Session | null;
        const effectiveUserId = session?.user?.id ?? userIdFromClient;

        const meta = datasetStoreMasivo[datasetId];
        if (!meta) {
          return NextResponse.json({ error: "Dataset no registrado" }, { status: 404 });
        }

        const filePath = path.join(DATASETS_DIR, meta.fileName);
        if (!fs.existsSync(filePath)) {
          return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
        }

        let rng = mulberry32(seed);
        let sample: RowData[] = [];
        let count = 0;

        // --- CSV ---
        if (meta.format === "csv") {
          await new Promise<void>((resolve, reject) => {
            fs.createReadStream(filePath)
              .pipe(csv())
              .on("data", (row: RowData) => {
                count++;
                if (count >= start && count <= end) {
                  if (sample.length < n) {
                    sample.push(row);
                  } else {
                    const j = Math.floor(rng() * (count - start + 1));
                    if (j < n) sample[j] = row;
                  }
                }
              })
              .on("end", resolve)
              .on("error", reject);
          });
        }

        // --- JSON ---
        else if (meta.format === "json") {
          await new Promise<void>((resolve, reject) => {
            fs.createReadStream(filePath)
              .pipe(JSONStream.parse("*"))
              .on("data", (row: RowData) => {
                count++;
                if (count >= start && count <= end) {
                  if (sample.length < n) {
                    sample.push(row);
                  } else {
                    const j = Math.floor(rng() * (count - start + 1));
                    if (j < n) sample[j] = row;
                  }
                }
              })
              .on("end", resolve)
              .on("error", reject);
          });
        }

        // --- XML ---
        else if (meta.format === "xml") {
          await new Promise<void>((resolve, reject) => {
            const xmlStream = xmlFlow(fs.createReadStream(filePath));
            xmlStream.on("tag:row", (row: RowData) => {
              count++;
              if (count >= start && count <= end) {
                if (sample.length < n) {
                  sample.push(row);
                } else {
                  const j = Math.floor(rng() * (count - start + 1));
                  if (j < n) sample[j] = row;
                }
              }
            });
            xmlStream.on("end", resolve);
            xmlStream.on("error", reject);
          });
        }

        const hash = generateHash({ sample, n, seed, start, end, allowDuplicates });

        // --- Guardar historial ---
        if (effectiveUserId) {
          try {
            await prisma.historialMuestra.create({
              data: {
                name: fileName || `MuestraMasiva-${Date.now()}`,
                records: sample.length,
                range: `${start}-${end}`,
                seed,
                allowDuplicates,
                source: meta.fileName,
                hash,
                tipo: "masivo",
                userId: effectiveUserId,
              },
            });
          } catch (err) {
            console.error("❌ Error guardando historial masivo:", err);
          }
        }

        return NextResponse.json({
          sample,
          hash,
          totalRows: count,
          tipo: "masivo",
        });
      }

      // --- C) Exportación
      if (action === "export") {
        const { rows, format, fileName } = options;
        if (!rows || !Array.isArray(rows) || rows.length === 0) {
          return NextResponse.json({ error: "No hay filas para exportar" }, { status: 400 });
        }

        // --- JSON ---
        if (format === "json") {
          return new Response(JSON.stringify(rows, null, 2), {
            headers: {
              "Content-Type": "application/json",
              "Content-Disposition": `attachment; filename=${fileName || "muestra"}.json`,
            },
          });
        }

        // --- TXT (columnas alineadas) ---
        if (format === "txt") {
          const headers = Object.keys(rows[0]);
          const colWidths = headers.map(
            (h, i) =>
              Math.max(h.length, ...rows.map((row: RowData) => String(Object.values(row)[i]).length))
          );

          let text = "";
          text += headers.map((h, i) => h.padEnd(colWidths[i] + 2)).join("") + "\n";
          text += colWidths.map((w) => "-".repeat(w + 2)).join("") + "\n";
          text += rows
            .map((row: RowData) =>
              Object.values(row)
                .map((val, i) => String(val).padEnd(colWidths[i] + 2))
                .join("")
            )
            .join("\n");

          return new Response(text, {
            headers: {
              "Content-Type": "text/plain",
              "Content-Disposition": `attachment; filename=${fileName || "muestra"}.txt`,
            },
          });
        }

        // --- XML ---
        if (format === "xml") {
          let xml = "<rows>\n";
          rows.forEach((row: RowData) => {
            xml += "  <row>\n";
            Object.entries(row).forEach(([k, v]) => {
              xml += `    <${k}>${v}</${k}>\n`;
            });
            xml += "  </row>\n";
          });
          xml += "</rows>";

          return new Response(xml, {
            headers: {
              "Content-Type": "application/xml",
              "Content-Disposition": `attachment; filename=${fileName || "muestra"}.xml`,
            },
          });
        }

        // --- CSV ---
        if (format === "csv") {
          const headers = Object.keys(rows[0]);
          const csvData = [
            headers.join(","), // encabezados
            ...rows.map((row: RowData) =>
              headers.map((h) => JSON.stringify(row[h] ?? "")).join(",")
            ),
          ].join("\n");

          return new Response(csvData, {
            headers: {
              "Content-Type": "text/csv",
              "Content-Disposition": `attachment; filename=${fileName || "muestra"}.csv`,
            },
          });
        }

        return NextResponse.json({ error: "Formato no soportado en masivo" }, { status: 400 });
      }
      
      // --- D) Consultar historial masivo ---
      if (action === "historial") {
        const { userId } = options;
        if (!userId) {
          return NextResponse.json({ error: "Falta userId" }, { status: 400 });
        }

        try {
          const historial = await prisma.historialMuestra.findMany({
            where: { userId, tipo: "masivo" },
            orderBy: { createdAt: "desc" },
            include: {
              user: { select: { name: true, email: true } },
            },
          });

          const items = historial.map((h) => ({
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

          return NextResponse.json(items);
        } catch (err: any) {
          return NextResponse.json(
            { error: "Error al consultar historial masivo", details: err.message },
            { status: 500 }
          );
        }
      }
      // este return solo si la acción no coincide
      return NextResponse.json({ error: "Acción no válida en masivo" }, { status: 400 });
    }

    return NextResponse.json({ error: "Formato de request no soportado" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Error en masivo", details: err.message ?? String(err) },
      { status: 500 }
    );
  }
}