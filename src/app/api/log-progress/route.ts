//src/app/api/log-progress/route.ts
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getDatasetDir } from "@/lib/getDatasetDir";

const DATASETS_DIR = getDatasetDir();

export async function GET() {
  try {
    const progressPath = path.join(DATASETS_DIR, "progress.json");

    // Si no existe → no hay indexando
    if (!fs.existsSync(progressPath)) {
      return NextResponse.json({
        ok: true,
        processing: false,
        percent: 0,
        processedLines: 0,
        totalRows: 0,
        file: null,
        updatedAt: null
      });
    }

    // Leer JSON real del indexador
    const raw = fs.readFileSync(progressPath, "utf8").trim();

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return NextResponse.json({
        ok: true,
        processing: true,
        percent: null,
        processedLines: null,
        totalRows: null,
        file: null,
        updatedAt: null
      });
    }

    return NextResponse.json({
      ok: true,
      processing: !data.completed,
      percent: data.percent ?? 0,
      processedLines: data.processedLines ?? 0,
      totalRows: data.totalRows ?? 0,
      file: data.file ?? null,
      updatedAt: data.updatedAt ?? null
    });

  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
