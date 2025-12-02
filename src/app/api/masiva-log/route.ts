//src/app/api/masiva-log/route.ts
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getDatasetDir } from "@/lib/getDatasetDir";

const DATASETS_DIR = getDatasetDir();

export async function POST(req: Request) {
  const { fileName } = await req.json();
  const logPath = path.join(DATASETS_DIR, fileName + ".meta.log");

  if (!fs.existsSync(logPath))
    return NextResponse.json({ ok: false, log: [] });

  const content = await fs.promises.readFile(logPath, "utf8");
  const lines = content.trim().split("\n");
  return NextResponse.json({
    ok: true,
    log: lines.slice(-20) // solo las últimas 20 líneas
  });
}
