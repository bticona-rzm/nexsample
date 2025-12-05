import fs from "fs";
import path from "path";

const CONFIG_PATH = path.resolve("storage/config.json");

export async function GET() {
  try {
    const folder = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }

    if (!fs.existsSync(CONFIG_PATH)) {
      return Response.json({ ok: true, dir: "F:/datasets" });
    }

    const raw = fs.readFileSync(CONFIG_PATH, "utf8");
    if (!raw.trim()) {
      return Response.json({ ok: true, dir: "F:/datasets" });
    }

    const json = JSON.parse(raw);
    return Response.json({ ok: true, dir: json.DATASETS_DIR || "F:/datasets" });

  } catch (err) {
    return Response.json({ ok: false, error: String(err) });
  }
}
