import fs from "fs";
import path from "path";

const FALLBACK = "C:/datasets"; // valor por defecto

export function getDatasetDir() {
  try {
    const configPath = path.join(process.cwd(), "config.json");

    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, "utf8");
      const json = JSON.parse(raw);
      if (json.DATASETS_DIR && typeof json.DATASETS_DIR === "string") {
        return json.DATASETS_DIR;
      }
    }
    return FALLBACK;
  } catch (err) {
    console.error("Error leyendo config.json:", err);
    return FALLBACK;
  }
}
