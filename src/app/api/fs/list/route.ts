//src/app/(dashboard)/api/fs/list/route.ts
import fs from "fs";
import path from "path";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let dir = searchParams.get("path");

    if (!dir) return Response.json({ ok: false, error: "Missing path" });

    // Normalizar ruta
    dir = path.normalize(dir);

    // Verificar si existe
    if (!fs.existsSync(dir)) {
      return Response.json({ ok: false, error: "Path does not exist" });
    }

    const items = fs.readdirSync(dir, { withFileTypes: true });

    const folders = items
      .filter((f) => f.isDirectory())
      .map((f) => ({
        name: f.name,
        fullPath: path.join(dir!, f.name)
      }));

    return Response.json({ ok: true, path: dir, folders });

  } catch (err) {
    return Response.json({ ok: false, error: String(err) });
  }
}
