import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createHash } from "crypto";
import { totalmem } from "os";

// ---------- Algoritmos internos ----------

// Generador aleatorio con semilla (para que el muestreo sea reproducible)  
// algoritmos deterministas llamados PRNG (Pseudo Random Number Generators).
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Muestreo con validaciones
function randomSample(array: any[], n: number, seed: number, start: number, end: number, allowDuplicates: boolean) {
  if (!Array.isArray(array) || array.length === 0) throw new Error("El dataset está vacío");
  if (start < 1 || end > array.length || start > end) throw new Error("El rango de inicio/fin no es válido");
  if (!allowDuplicates && n > end - start + 1) throw new Error("Más registros que rango disponible sin duplicados");

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

// Función para generar hash de un objeto/array
// función hash
function generateHash(data: any): string {
  return createHash("sha256")
    .update(JSON.stringify(data))
    .digest("hex")
    .slice(0, 12); // lo recortamos a 12 caracteres
}

// ---------- API ----------
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type");

    // === SUBIDA DE ARCHIVOS (Excel/CSV) ===
    if (contentType?.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File;
      const useHeaders = formData.get("useHeaders") === "true";

      if (!file) return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });

      try {
        const arrayBuffer = await file.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: "array", codepage: 65001 });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        let jsonData: any[] = [];
        if (useHeaders) {
          jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        } else {
          const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as any[];
          const headers = raw[0].map((_: any, i: number) => `Columna${i + 1}`);
          jsonData = raw.slice(1).map((row: any[]) =>
            Object.fromEntries(row.map((val, i) => [headers[i], val]))
          );
        }

        return NextResponse.json({ data: jsonData, totalRows: jsonData.length });
      } catch {
        return NextResponse.json({ error: "Archivo inválido o corrupto" }, { status: 400 });
      }
    }

    // === ACCIONES JSON ===
    const { action, ...options } = await req.json();

    // en action === "sample"
    if (action === "sample") {
      const { array, n, seed, start, end, allowDuplicates } = options;
      const sample = randomSample(array, n, seed, start, end, allowDuplicates);

      const hash = generateHash({ sample, n, seed, start, end, allowDuplicates });

      return NextResponse.json({ sample, hash, totalRows: array.length });
    }

    // 2) Exportación en distintos formatos
    if (action === "export") {
      const { rows, format, fileName } = options;
      if (!rows || rows.length === 0) return NextResponse.json({ error: "No hay datos para exportar" }, { status: 400 });

      // JSON → devolver directamente
      if (format === "json") return NextResponse.json(rows);

      // XML → generar string
      if (format === "xml") {
        const xml = toXML(rows);
        return new Response(xml, { headers: { "Content-Type": "application/xml" } });
      }
      if (format === "txt") {
        const text = (rows as Record<string, unknown>[])
          .map((row) =>
            Object.values(row).join("\t")
          )
          .join("\n");

        return new Response(text, {
          headers: {
            "Content-Type": "text/plain",
            "Content-Disposition": `attachment; filename=${fileName || "muestra"}.txt`,
          },
        });
      }


      // Excel / CSV → generar workbook con datos
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");

      const arrayBuffer = XLSX.write(workbook, { type: "array", bookType: format as any});

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

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: "Error interno del servidor", details: err.message }, { status: 500 });
  }
}
