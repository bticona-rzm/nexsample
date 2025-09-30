import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createHash } from "crypto";   // 👈 CORRECTO
import { prisma } from "@/lib/prisma";

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
    const contentType = req.headers.get("content-type");

    // === SUBIDA DE ARCHIVOS (Excel/CSV) ===
    if (contentType?.includes("multipart/form-data")) {
      // ... tu lógica existente para subir archivos
    }

    // === ACCIONES JSON ===
    const { action, ...options } = await req.json();

    //  1) Generar muestreo y guardar en historial
    if (action === "sample") {
      const { array, n, seed, start, end, allowDuplicates, userId, nombreMuestra } = options;

      const sample = randomSample(array, n, seed, start, end, allowDuplicates);
      const hash = generateHash({ sample, n, seed, start, end, allowDuplicates });

      // Guardar en historial
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

    //  2) Exportación en distintos formatos
    if (action === "export") {
      const { rows, format, fileName } = options as {
        rows: Record<string, unknown>[];
        format: string;
        fileName?: string;
      };

      if (!rows || rows.length === 0) {
        return NextResponse.json(
          { error: "No hay datos para exportar" },
          { status: 400 }
        );
      }

      // JSON → devolver directamente
      if (format === "json") return NextResponse.json(rows);

      // XML → generar string
      if (format === "xml") {
        const xml = toXML(rows);
        return new Response(xml, {
          headers: { "Content-Type": "application/xml" },
        });
      }

      // TXT → generar tabla alineada
      if (format === "txt") {
        const headers = Object.keys(rows[0]);
        const colWidths = headers.map(
          (h, i) =>
            Math.max(
              h.length,
              ...rows.map((row) => String(Object.values(row)[i]).length)
            )
        );

        let text = "";

        // encabezados
        text += headers.map((h, i) => h.padEnd(colWidths[i] + 2)).join("") + "\n";

        // separador
        text += colWidths.map((w) => "-".repeat(w + 2)).join("") + "\n";

        // filas
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

      // Excel / CSV → generar workbook
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");

      const arrayBuffer = XLSX.write(workbook, {
        type: "array",
        bookType: format as any,
      });

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

    // === 3) Consultar historial de un usuario (SIEMPRE devuelve array) ===
    if (action === "historial") {
      const { userId } = options || {};
      if (!userId) {
        // devolvemos array vacío para no romper el frontend
        return NextResponse.json([], { status: 200 });
      }

      const historial = await prisma.historialMuestra.findMany({
        where: { userId },
        orderBy: { date: "desc" },
      });

      return NextResponse.json(historial ?? []); // nunca null/undefined
    }


    // === 4) Limpiar historial de un usuario ===
    if (action === "clearHistorial") {
      const { userId } = options || {};
      if (!userId) {
        return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 });
      }

      await prisma.historialMuestra.deleteMany({ where: { userId } });
      return NextResponse.json({ success: true });
    }


    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Error interno del servidor", details: err.message },
      { status: 500 }
    );
  }
}
