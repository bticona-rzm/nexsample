//src/app/(dashboard)/api/fs/disk/route.ts
import fs from "fs";

export async function GET() {
  const possible = "CDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const disks: string[] = [];

  for (const letter of possible) {
    const drive = `${letter}:\\`;
    try {
      if (fs.existsSync(drive)) {
        disks.push(drive);
      }
    } catch {}
  }

  return Response.json({ ok: true, disks });
}
