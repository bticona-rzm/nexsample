// src/app/api/masiva-info/route.ts
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDatasetDir } from "@/lib/getDatasetDir";


const DATASETS_DIR = getDatasetDir();
export async function POST(req: Request) {
  try {
    const { fileName } = await req.json();
    if (!fileName) {
      return NextResponse.json(
        { ok: false, error: "Falta fileName" },
        { status: 400 }
      );
    }
    // Normalizar
    const clean = path.basename(fileName).trim().replace(/\s+/g, "_");
    const base = path.join(DATASETS_DIR, clean);

    const metaPath = `${base}.meta.json`;
    const lockPath = `${base}.meta.lock`;
    const statusPath = `${base}.meta.status`;
    const progressPath = `${base}.meta.log.progress`;

    const hasMeta = fs.existsSync(metaPath);
    const hasLock = fs.existsSync(lockPath);
    const hasStatus = fs.existsSync(statusPath);
    const hasProgress = fs.existsSync(progressPath);

    // ======================
    // 1) NO EXISTE meta.json
    // ======================
    if (!hasMeta) {
      // hay lock → está procesando
      if (hasLock || hasStatus || hasProgress) {
        let progress = 0;

        if (hasProgress) {
          try {
            const p = JSON.parse(fs.readFileSync(progressPath, "utf8"));
            progress = p?.lines ?? 0;
          } catch (_) {}
        }

        return NextResponse.json({
          ok: true,
          ready: false,
          status: "processing",
          progress,
          fileName: clean,
        });
      }

      // no hay nada → meta todavía no iniciado
      return NextResponse.json({
        ok: true,
        ready: false,
        status: "pending",
        progress: 0,
        fileName: clean,
      });
    }

    // ======================
    // 2) SÍ EXISTE meta.json
    // ======================
    let meta: any = null;
    try {
      meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
    } catch (err) {
      return NextResponse.json({
        ok: false,
        ready: false,
        status: "error",
        error: "meta.json corrupto",
        fileName: clean,
      });
    }

    // Si meta.no listo
    if (!meta.ok || !meta.ready) {
      let progress = 0;

      if (hasProgress) {
        try {
          const p = JSON.parse(fs.readFileSync(progressPath, "utf8"));
          progress = p?.lines ?? 0;
        } catch {}
      }

      return NextResponse.json({
        ok: true,
        ready: false,
        status: "processing",
        progress,
        fileName: clean,
      });
    }

    // ==========================================================
    // === HISTORIALIMPORT MASIVO — ACTUALIZACIÓN FINAL =========
    // ==========================================================
    try {
      await prisma.historialImport.updateMany({
        where: {
          datasetId: meta.datasetId,
        },
        data: {
          delimitadorDetectado: meta.delimiter ?? null,
          registrosTotales: meta.totalRows ?? 0,
          previewInicio: Array.isArray(meta.previewStart) ? meta.previewStart.length : 0,
          previewFin: Array.isArray(meta.previewEnd) ? meta.previewEnd.length : 0,
          metadata: {
            estado: "READY",
            columns: meta.columns,
            previewStart: meta.previewStart,
            previewEnd: meta.previewEnd,
            updatedAt: meta.updatedAt,
          },
        },
      });

      console.log("🟢 HistorialImport MASIVO actualizado (FINAL)");
    } catch (err) {
      console.error("❌ Error actualizando historial import masivo:", err);
    }

    // ======================
    // 3) META LISTO (FINAL)
    // ======================
    return NextResponse.json({
      ok: true,
      ready: true,
      status: "ready",
      fileName: clean,
      totalRows: meta.totalRows ?? 0,
      delimiter: meta.delimiter ?? "|",
      columns: meta.columns ?? [],
      previewStart: Array.isArray(meta.previewStart)
        ? meta.previewStart.slice(0, 30)
        : [],
      previewEnd: Array.isArray(meta.previewEnd)
        ? meta.previewEnd.slice(0, 30)
        : [],
      updatedAt: meta.updatedAt ?? new Date().toISOString(),
      datasetId: meta.datasetId ?? null,
    });

  } catch (err: any) {
    return NextResponse.json(
      { ok: false, ready: false, status: "error", details: err.message },
      { status: 500 }
    );
  }
}
