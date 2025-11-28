//src/app/api/meta-lock/route.ts
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

const DATASETS_DIR = "D:/datasets";

type MetaFile = {
  ok?: boolean;
  ready?: boolean;
};

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const fileName = body.fileName as string | undefined;

    if (!fileName) {
      return NextResponse.json(
        { ok: false, processing: false, error: "fileName requerido" },
        { status: 400 }
      );
    }

    const filePath = path.join(DATASETS_DIR, fileName);
    const lockPath = `${filePath}.meta.lock`;
    const metaPath = `${filePath}.meta.json`;

    let processing = false;

    // 1) Si existe el lock => está procesando
    if (fs.existsSync(lockPath)) {
      processing = true;
    } else if (fs.existsSync(metaPath)) {
      // 2) Si hay meta.json pero no está listo / está roto => también lo consideramos “processing”
      try {
        const raw = fs.readFileSync(metaPath, "utf8");
        const meta = JSON.parse(raw) as MetaFile;
        if (!meta.ok || !meta.ready) {
          processing = true;
        }
      } catch {
        processing = true;
      }
    }

    return NextResponse.json({ ok: true, processing });
  } catch (err) {
    return NextResponse.json(
      { ok: false, processing: false, error: String(err) },
      { status: 500 }
    );
  }
}
