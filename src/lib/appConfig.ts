// src/lib/appConfig.ts
import fs from "fs";
import path from "path";

const CONFIG_PATH = path.join(process.cwd(), "config.json");

type AppConfig = {
  DATASETS_DIR?: string;
};

function readConfigFile(): AppConfig {
  try {
    if (!fs.existsSync(CONFIG_PATH)) return {};
    const raw = fs.readFileSync(CONFIG_PATH, "utf8");
    return JSON.parse(raw) as AppConfig;
  } catch {
    return {};
  }
}

export function getDatasetsDir(): string {
  // 1) leer config.json si existe
  const cfg = readConfigFile();

  // 2) si hay valor en config, usarlo
  let dir =
    cfg.DATASETS_DIR?.trim() ||
    process.env.DATASETS_DIR ||
    "F:/datasets"; // <-- tu valor actual por defecto

  // Normalizar backslashes por si acaso
  dir = dir.replace(/\\\\/g, "\\");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return dir;
}

export function setDatasetsDir(newPath: string) {
  const cleaned = newPath.trim();
  if (!cleaned) throw new Error("Ruta de carpeta vacía.");

  // Crear carpeta si no existe
  if (!fs.existsSync(cleaned)) {
    fs.mkdirSync(cleaned, { recursive: true });
  }

  let cfg: AppConfig = {};
  try {
    cfg = readConfigFile();
  } catch {
    cfg = {};
  }

  cfg.DATASETS_DIR = cleaned;
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), "utf8");
}
