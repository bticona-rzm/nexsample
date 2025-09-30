import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createHash } from "crypto";   
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

// ---------- Algoritmos internos ----------

// Generador aleatorio con semilla (PRNG determinístico)
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Muestreo con validaciones
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

// Exportar XML simple
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

// Función para generar hash
function generateHash(data: any): string {
  return createHash("sha256")
    .update(JSON.stringify(data))
    .digest("hex")
    .slice(0, 12); // recortamos a 12 caracteres
}

// ---------- API ----------
export async function POST(req: Request) {
  try {
    const session: any = await getServerSession(authOptions); // <- CAST a any
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id as string;

    const contentType = req.headers.get("content-type");

    // === SUBIDA DE ARCHIVOS (Excel/CSV) ===
    if (contentType?.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File;
      const datasetName = formData.get("datasetName") as string;
      const useHeader = formData.get("useHeader") === "true";

      if (!file) {
        return NextResponse.json({ error: "No se subió ningún archivo" }, { status: 400 });
      }

      // Leer archivo en buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Procesar con XLSX
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convertir a JSON
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: useHeader ? 0 : 1 });

      return NextResponse.json({
        rows,             // 👈 filas del Excel en JSON
        total: rows.length, // 👈 número de filas
        dataset: datasetName || file.name,
      });
    }


    // === ACCIONES JSON ===
    const { action, ...options } = await req.json();

    if (action === "sample") {
      const { array, n, seed, start, end, allowDuplicates, nombreMuestra } = options;

      const sample = randomSample(array, n, seed, start, end, allowDuplicates);
      const hash = generateHash({ sample, n, seed, start, end, allowDuplicates });

      await prisma.historialMuestra.create({
        data: {
          userId,
          name: nombreMuestra || `Muestra_${Date.now()}`,
          records: n,
          range: `${start}-${end}`,
          seed,
          allowDuplicates,
          source: "frontend",
          hash,
        },
      });

      return NextResponse.json({ sample, hash, totalRows: array.length });
    }

    if (action === "export") {
      const { rows, format, fileName } = options as {
        rows: Record<string, unknown>[];
        format: string;
        fileName?: string;
      };

      if (!rows || rows.length === 0) {
        return NextResponse.json({ error: "No hay datos para exportar" }, { status: 400 });
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