import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createHash } from "crypto";   
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

// ---- Cache global para datasets ----
if (!(globalThis as any).datasetStore) {
  (globalThis as any).datasetStore = {};
}
const datasetStore: Record<string, any[]> = (globalThis as any).datasetStore;

// ---------- Algoritmos internos ----------
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomSample(
  array: any[],
  n: number,
  seed: number,
  start: number,
  end: number,
  allowDuplicates: boolean
) {
  if (!Array.isArray(array) || array.length === 0)
    throw new Error("El dataset está vacío");
  if (start < 1 || end > array.length || start > end)
    throw new Error("El rango de inicio/fin no es válido");
  if (!allowDuplicates && n > end - start + 1)
    throw new Error("Más registros que rango disponible sin duplicados");

  let rng = mulberry32(seed);
  let slice = array.slice(start - 1, end);
  let result: any[] = [];

  while (result.length < n && slice.length > 0) {
    let idx = Math.floor(rng() * slice.length);
    let item = slice[idx];
    if (!allowDuplicates) slice.splice(idx, 1);
    result.push(item);
  }
  return result;
}

function toXML(rows: any[]): string {
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

function generateHash(data: any): string {
  return createHash("sha256")
    .update(JSON.stringify(data))
    .digest("hex")
    .slice(0, 12);
}

// ---------- API ----------
export async function POST(req: Request) {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id as string;

    const contentType = req.headers.get("content-type");

    if (contentType?.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File;
      const datasetName = formData.get("datasetName") as string;
      const useHeader = formData.get("useHeader") === "true";

      if (!file) {
        return NextResponse.json({ error: "No se subió ningún archivo" }, { status: 400 });
      }
      // ⚠️ Validación de tamaño: máximo 100 MB
      const maxSize = 100 * 1024 * 1024; // 100 MB en bytes
      if (file.size > maxSize) {
        return NextResponse.json(
          {
            error: `El archivo excede el límite permitido (100 MB). Tamaño recibido: ${(file.size / (1024 * 1024)).toFixed(2)} MB`
          },
          { status: 413 } // 413 Payload Too Large
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: useHeader ? 0 : 1 });
      const datasetId = `ds_${Date.now()}`;
      datasetStore[datasetId] = rows;

      return NextResponse.json({
        datasetId,
        rows: rows.slice(0, 50), // preview de 50 filas
        total: rows.length,
        dataset: datasetName || file.name,
      });
    }

    // === ACCIONES JSON ===
    const { action, ...options } = await req.json();

    if (action === "sample") {
      const {
        datasetId, n, seed, start, end, allowDuplicates,
        nombreMuestra, datasetLabel, sourceFile,
      } = options;

      const dataset = datasetStore[datasetId];
      if (!dataset) {
        return NextResponse.json({ error: "Dataset no encontrado o expirado" }, { status: 404 });
      }

      const sample = randomSample(dataset, n, seed, start, end, allowDuplicates);
      const hash = generateHash({ sample, n, seed, start, end, allowDuplicates });

      await prisma.historialMuestra.create({
        data: {
          userId,
          name: nombreMuestra || `Muestra_${Date.now()}`,
          records: n,
          range: `${start}-${end}`,
          seed,
          allowDuplicates,
          source: sourceFile || datasetLabel || "frontend",
          hash,
        },
      });

      return NextResponse.json({ sample, hash, totalRows: dataset.length });
    }

    if (action === "export") {
      const { datasetId, format, fileName } = options as {
        datasetId: string;
        format: string;
        fileName?: string;
      };

      const rows = datasetStore[datasetId];
      if (!rows || rows.length === 0) {
        return NextResponse.json({ error: "Dataset no encontrado o vacío" }, { status: 400 });
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
            "Content-Disposition": `attachment; filename=${fileName || "muestra"}.txt`,
          },
        });
      }

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");
      const arrayBuffer = XLSX.write(workbook, { type: "array", bookType: format as any });

      return new Response(arrayBuffer, {
        headers: {
          "Content-Type":
            format === "csv"
              ? "text/csv"
              : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename=${fileName || "muestra"}.${format}`,
        },
      });
    } 

    if (action === "historial") {
      const historial = await prisma.historialMuestra.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } } },
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
      }));

      return NextResponse.json(items);
    }

    if (action === "clearHistorial") {
      await prisma.historialMuestra.deleteMany({ where: { userId } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Error interno del servidor", details: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

// ---------- CONFIGURACIÓN ESPECÍFICA PARA ESTE ROUTE ----------
export const config = {
  api: {
    bodyParser: false,
    sizeLimit: "100mb", // límite para DataEstandar
  },
};  