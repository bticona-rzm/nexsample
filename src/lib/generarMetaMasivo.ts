// src/lib/generarMetaMasivo.ts
import fs from "fs";
import path from "path";
import * as readline from "readline";
import { validarArchivoMasivo } from "./validarArchivoMasivo";

export interface MetaResult {
  ok: boolean;
  ready: boolean;
  totalRows: number;
  delimiter: string;
  previewStart: string[];
  previewEnd: string[];
  updatedAt: string;
}

/**
 * 🧠 Genera el archivo .meta.json sin cargar todo el dataset a memoria.
 * - Lee solo las primeras y últimas N líneas (por streaming).
 * - Compatible con archivos gigantes (>50 GB).
 * - Devuelve el objeto final con previews + total + delimitador.
 */
export async function generarMetaMasivo(
  filePath: string,
  previewLines = 30
): Promise<MetaResult> {
  console.log(`📊 Generando meta.json para ${filePath}`);

  // 1️⃣ Primero, obtener delimitador y validaciones básicas
  const validation = await validarArchivoMasivo(filePath);
  const delimiter = validation.delimiter || "|";

  // 2️⃣ Lectura en streaming para previews y conteo total
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  const previewStart: string[] = [];
  const previewEndBuffer: string[] = [];
  let totalRows = 0;

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue; // ignorar vacías
    totalRows++;

    // primeras N líneas
    if (previewStart.length < previewLines) previewStart.push(trimmed);

    // buffer circular para últimas N líneas
    if (previewEndBuffer.length >= previewLines) previewEndBuffer.shift();
    previewEndBuffer.push(trimmed);
  }

  const meta: MetaResult = {
    ok: true,
    ready: true,
    totalRows,
    delimiter,
    previewStart,
    previewEnd: previewEndBuffer,
    updatedAt: new Date().toISOString(),
  };
  (meta as any).fileName = path.basename(filePath);
  (meta as any).hash = Buffer.from(filePath).toString("base64").slice(0, 16);

  // 3️⃣ Guardar meta.json en disco
  const metaPath = `${filePath}.meta.json`;
  await fs.promises.writeFile(metaPath, JSON.stringify(meta, null, 2), "utf8");
  console.log(`🗂️ Meta.json creado y guardado: ${metaPath}`);
  return meta;
}
