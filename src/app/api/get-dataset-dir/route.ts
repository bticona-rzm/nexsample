import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const configPath = path.join(process.cwd(), "config.json");

    if (!fs.existsSync(configPath)) {
      return Response.json({ ok: true, dir: "F:/datasets" });
    }

    const json = JSON.parse(fs.readFileSync(configPath, "utf8"));
    return Response.json({ ok: true, dir: json.DATASETS_DIR || "F:/datasets" });

  } catch (err) {
    return Response.json({ ok: false, error: String(err) });
  }
}
