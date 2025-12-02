import fs from "fs";
import path from "path";

const CONFIG_PATH = path.join(process.cwd(), "config.json");

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const dir = body?.dir;

    if (!dir || typeof dir !== "string") {
      return Response.json(
        { ok: false, error: "Directorio inválido" },
        { status: 400 }
      );
    }

    const newConfig = { DATASETS_DIR: dir };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(newConfig, null, 2), "utf8");

    return Response.json({ ok: true, dir });
  } catch (err) {
    return Response.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
