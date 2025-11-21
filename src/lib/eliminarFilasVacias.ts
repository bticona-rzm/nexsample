import fs from "fs";
import * as readline from "readline";

export async function eliminarFilasVacias(originalPath: string, cleanPath: string): Promise<number> {
  const rl = readline.createInterface({
    input: fs.createReadStream(originalPath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  const output = fs.createWriteStream(cleanPath, { encoding: "utf8" });
  let written = 0;

  for await (const line of rl) {
    if (!line.trim() || /^([,;|\s]*)$/.test(line)) continue;
    output.write(line + "\n");
    written++;
  }

  output.end();

  // ✅ Esperar correctamente a que termine de escribir
  await new Promise<void>((resolve) => output.on("finish", () => resolve()));

  return written;
}