//src/app/api/log-progress/route.ts
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

const DATASETS_DIR = "F:/datasets";

type ProgressData = {
  lines?: number;
  file?: string;
  updatedAt?: string;
};

export async function GET() {
  try {
    const files = fs.readdirSync(DATASETS_DIR);

    // buscamos cualquier archivo *.meta.log.progress
    const progressFile = files.find((f) =>
      f.endsWith(".meta.log.progress")
    );

    // Si no hay progreso, devolvemos “sin procesamiento”
    if (!progressFile) {
      return NextResponse.json({
        ok: true,
        processing: false,
        progress: 0,
        processedLines: 0,
        file: null,
        updatedAt: null,
      });
    }

    const fullPath = path.join(DATASETS_DIR, progressFile);
    const raw = fs.readFileSync(fullPath, "utf8").trim();

    let data: ProgressData = {};

    try {
      data = JSON.parse(raw) as ProgressData;
    } catch {
      // Si el JSON está roto, consideramos que sigue procesando
      return NextResponse.json({
        ok: true,
        processing: true,
        progress: null,
        processedLines: null,
        file: null,
        updatedAt: null,
      });
    }

    return NextResponse.json({
      ok: true,
      processing: true,
      // aquí usamos “lines” como progreso (nº de filas leídas)
      progress: data.lines ?? 0,
      processedLines: data.lines ?? 0,
      file: data.file ?? null,
      updatedAt: data.updatedAt ?? null,
    });

  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
