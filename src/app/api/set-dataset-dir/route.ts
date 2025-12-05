import fs from "fs";
import path from "path";

const CONFIG_PATH = path.resolve("storage/config.json");

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const dir = body?.dir;

    if (!dir || typeof dir !== "string") {
      return Response.json({ ok: false, error: "Directorio inválido" });
    }

    const folder = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }

    fs.writeFileSync(
      CONFIG_PATH,
      JSON.stringify({ DATASETS_DIR: dir }, null, 2),
      "utf8"
    );

    return Response.json({ ok: true, dir });

  } catch (err) {
    return Response.json({ ok: false, error: String(err) });
  }
}
