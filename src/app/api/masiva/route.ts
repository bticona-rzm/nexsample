import fs from "fs";
import csv from "csv-parser";
import JSONStream from "JSONStream";
import xmlFlow from "xml-flow";

export async function POST(req: Request) {
  try {
    const { action, path, format } = await req.json();

    if (action === "loadLocal") {
      if (!path || !format) {
        return new Response(
          JSON.stringify({ error: "Debe enviar path y format" }),
          { status: 400 }
        );
      }

      const datasetId = `ds_${Date.now()}`;
      const rows: any[] = [];

      if (format === "csv" || format === "txt") {
        await new Promise<void>((resolve, reject) => {
          fs.createReadStream(path)
            .pipe(csv())
            .on("data", (row) => rows.push(row))
            .on("end", resolve)
            .on("error", reject);
        });
      }

      if (format === "json") {
        await new Promise<void>((resolve, reject) => {
          fs.createReadStream(path)
            .pipe(JSONStream.parse("*"))
            .on("data", (row) => rows.push(row))
            .on("end", resolve)
            .on("error", reject);
        });
      }

      if (format === "xml") {
        await new Promise<void>((resolve, reject) => {
          const stream = xmlFlow(fs.createReadStream(path));
          stream.on("tag:row", (row: any) => rows.push(row));
          stream.on("end", resolve);
          stream.on("error", reject);
        });
      }

      // Guardamos en memoria (como siempre)
      (globalThis as any).datasetStore ||= {};
      (globalThis as any).datasetStore[datasetId] = rows;

      return new Response(
        JSON.stringify({
          datasetId,
          rows: rows.slice(0, 50),
          total: rows.length,
          sourceFile: path,
        }),
        { status: 200 }
      );
    }

    return new Response(JSON.stringify({ error: "Acción inválida" }), {
      status: 400,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
