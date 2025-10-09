// src/app/api/muestra/route.ts

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import JSONStream from "JSONStream";
import xmlFlow from "xml-flow";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import type { Session } from "next-auth";

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

// ---------- Configuración ----------
const DATASETS_DIR = "C:/datasets";

if (!(globalThis as any).datasetStoreMasivo) {
  (globalThis as any).datasetStoreMasivo = {};
}
const datasetStoreMasivo: Record<string, { rows: RowData[] }> = (globalThis as any).datasetStoreMasivo;

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

  let rng = mulberry32(seed);
  let slice = array.slice(start - 1, end);
  let result: RowData[] = [];

  while (result.length < n && slice.length > 0) {
    let idx = Math.floor(rng() * slice.length);
    let item = slice[idx];
    if (!allowDuplicates) slice.splice(idx, 1);
    result.push(item);
  }
  return result;
}

function generateHash(data: any): string {
  return createHash("sha256")
    .update(JSON.stringify(data))
    .digest("hex")
    .slice(0, 12);
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

// ---------- API ----------
export async function POST(req: Request) {
  try {
    const { action, ...options } = await req.json();

    // === UPLOAD ===
    if (action === "upload") {
      const { fileName, format } = options as { fileName: string; format: string };
      if (!fileName) return NextResponse.json({ error: "Debe especificar fileName" }, { status: 400 });

      const filePath = path.join(DATASETS_DIR, fileName);
      if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: "Archivo no encontrado en datasets" }, { status: 404 });
      }

      const rows: RowData[] = [];
      const datasetId = `msv_${Date.now()}`;

      if (format === "csv") {
        await new Promise<void>((resolve, reject) => {
          fs.createReadStream(filePath)
            .pipe(csv())
            .on("data", (row: RowData) => rows.push(row))
            .on("end", resolve)
            .on("error", reject);
        });
      }

      else if (format === "json") {
        await new Promise<void>((resolve, reject) => {
          fs.createReadStream(filePath)
            .pipe(JSONStream.parse("*"))
            .on("data", (row: RowData) => rows.push(row))
            .on("end", resolve)
            .on("error", reject);
        });
      }

      else if (format === "xml") {
        await new Promise<void>((resolve, reject) => {
          const stream = fs.createReadStream(filePath);
          const xmlStream = xmlFlow(stream);

          xmlStream.on("tag:row", (row: RowData) => rows.push(row));
          xmlStream.on("end", resolve);
          xmlStream.on("error", reject);
        });
      }

      datasetStoreMasivo[datasetId] = { rows };

      return NextResponse.json({
        datasetId,
        total: rows.length,
        preview: rows.slice(0, 50),
        fileName,
      });
    }

    // === SAMPLE ===
    if (action === "sample") {
      const { datasetId, n, seed, start, end, allowDuplicates } = options as SampleOptions;
      const meta = datasetStoreMasivo[datasetId];
      if (!meta) return NextResponse.json({ error: "Dataset no registrado" }, { status: 404 });

      const sample = randomSample(meta.rows, n, seed, start, end, allowDuplicates);
      const hash = generateHash({ n, seed, start, end, allowDuplicates });

      // Guardar historial en Prisma
      const session = (await getServerSession(authOptions)) as Session | null;
      const userId = session?.user?.id;

      if (userId) {
        try {
          await prisma.historialMuestra.create({
            data: {
              name: `Muestra-${datasetId}`,
              records: sample.length,
              range: `${start}-${end}`,
              seed,
              allowDuplicates,
              source: "dataset local",
              hash,
              tipo: "estandar",
              userId,
            },
          });
        } catch (err) {
          console.error("❌ Error guardando historial estándar:", err);
        }
      }

      return NextResponse.json({ sample, hash, totalRows: meta.rows.length });
    }

    // === EXPORT ===
    if (action === "export") {
      const { datasetId, format } = options as { datasetId: string; format: string };
      const meta = datasetStoreMasivo[datasetId];
      if (!meta) return NextResponse.json({ error: "Dataset no registrado" }, { status: 404 });

      const rows = meta.rows;
      if (!rows || rows.length === 0) {
        return NextResponse.json({ error: "Dataset vacío" }, { status: 400 });
      }

      if (format === "json") return NextResponse.json(rows);

      if (format === "xml") {
        const xml = toXML(rows);
        return new Response(xml, { headers: { "Content-Type": "application/xml" } });
      }

      if (format === "txt") {
        const headers = Object.keys(rows[0]);
        const colWidths = headers.map(
          (h, i) => Math.max(h.length, ...rows.map((row) => String(Object.values(row)[i]).length))
        );
        let text = "";
        text += headers.map((h, i) => h.padEnd(colWidths[i] + 2)).join("") + "\n";
        text += colWidths.map((w) => "-".repeat(w + 2)).join("") + "\n";
        text += rows
          .map((row) =>
            Object.values(row)
              .map((val, i) => String(val).padEnd(colWidths[i] + 2))
              .join("")
          )
          .join("\n");
        return new Response(text, {
          headers: {
            "Content-Type": "text/plain",
            "Content-Disposition": `attachment; filename=estandar.txt`,
          },
        });
      }

      return NextResponse.json({ error: "Formato no soportado" }, { status: 400 });
    }

    // === HISTORIAL ESTÁNDAR ===
    if (action === "historial") {
      const { userId } = options;
      if (!userId) return NextResponse.json({ error: "Falta userId" }, { status: 400 });

      try {
        const historial = await prisma.historialMuestra.findMany({
          where: { userId, tipo: "estandar" },
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
        return NextResponse.json(
          { error: "Error al consultar historial estándar", details: err.message },
          { status: 500 }
        );
      }
    }

    // === LIMPIAR HISTORIAL ESTÁNDAR ===
    if (action === "clearHistorial") {
      const { userId } = options;
      if (!userId) return NextResponse.json({ error: "Falta userId" }, { status: 400 });

      try {
        await prisma.historialMuestra.deleteMany({
          where: { userId, tipo: "estandar" },
        });
        return NextResponse.json({ ok: true });
      } catch (err: any) {
        return NextResponse.json(
          { error: "Error al limpiar historial estándar", details: err.message },
          { status: 500 }
        );
      }
    }

    // === ACCIÓN INVÁLIDA ===
    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: "Error interno masivo", details: err.message }, { status: 500 });
  }
}
