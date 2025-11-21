/**
 * Generador de archivo .meta.json (revisión estable)
 * ---------------------------------------------------------------
 * - Soporta archivos grandes (GB)
 * - Detecta delimitador automáticamente
 * - Guarda previewStart y previewEnd (30 líneas cada uno)
 * - Maneja cabeceras o crea genéricas
 * - Es totalmente tolerante a errores
 */
//sripts/generarMeta.js
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { performance } = require("perf_hooks");

// ===== CLI =====
const args = process.argv.slice(2);
const filePath = args[0];
const datasetId = args[args.indexOf("--datasetId") + 1] || null;
const useHeadersArg = args[args.indexOf("--useHeaders") + 1] || "true";
const useHeaders = useHeadersArg === "true";

if (!filePath) {
  console.error("❌ [meta] Uso: node scripts/generarMeta.js <ruta fichero>");
  process.exit(1);
}
if (!fs.existsSync(filePath)) {
  console.error("❌ [meta] Archivo no encontrado:", filePath);
  process.exit(1);
}

const metaPath = `${filePath}.meta.json`;
const lockPath = `${filePath}.meta.lock`;
const logPath = `${filePath}.meta.log`;

// ===== util =====
// 🔹 Helper local para detectar delimitador en archivos de texto
function detectedDelimiter(line) {
  if (!line) return "|";
  const candidates = ["|", ";", ",", "\t"];
  const scores = candidates.map((d) => ({
    d,
    count: (line.match(new RegExp(`\\${d}`, "g")) || []).length,
  }));
  scores.sort((a, b) => b.count - a.count);
  return scores[0].d || "|";
}

function log(line) {
  fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${line}\n`);
}

function detectDelimiterFromSample(lines) {
  const candidates = ["|", ",", ";", "\t"];
  const scores = { "|":0, ",":0, ";":0, "\t":0 };
  for (const ln of lines) {
    const s = (ln || "").trim();
    if (!s) continue;
    for (const d of candidates) {
      const m = s.match(new RegExp(`\\${d}`, "g")) || [];
      scores[d] += m.length;
    }
  }
  return Object.entries(scores).sort((a,b)=>b[1]-a[1])[0]?.[0] || "|";
}
function splitLine(line, delimiter) {
  // Split simple (sin CSV quotes avanzadas). Igual que tu flujo actual.
  return line.split(delimiter).map(v => v.replace(/^"+|"+$/g, "").trim());
}

(async () => {
  const t0 = performance.now();
  fs.writeFileSync(lockPath, "processing", "utf8"); // lock
  log(`start processing ${filePath}`);

  const previewStart = [];        // objetos (máx 30)
  const tailBuffer   = [];        // objetos (máx 30)
  const SAMPLE_FOR_DELIM = [];    // primeras ~50 no vacías para detectar delimitador
  const MAX_PREVIEW = 30;

  let totalRows = 0;              // filas REALES (sin cabecera si useHeaders)
  let headerSeen = false;
  let headers = [];
  let delimiter = "|";
  let headerLine = null;

  try {
    const rs = fs.createReadStream(filePath, { encoding: "utf8", highWaterMark: 8 * 1024 * 1024 });
    const rl = readline.createInterface({ input: rs, crlfDelay: Infinity });

    let firstNonEmptyCaptured = false;
    let delimChosen = false;
    let sampled = 0;

    for await (const raw of rl) {
      const line = (raw ?? "").trim();
      if (!line) continue;

      // Muestreamos ~50 primeras no vacías para detectar delimitador
      if (!delimChosen && sampled < 50) {
        SAMPLE_FOR_DELIM.push(line);
        sampled++;
        if (sampled >= 3) {
          delimiter = detectDelimiterFromSample(SAMPLE_FOR_DELIM);
        }
      }
      if (!delimChosen && sampled >= 3) delimChosen = true;

      // Cabecera (1 sola vez) si useHeaders
      if (useHeaders && !headerSeen) {
        headerLine = line;
        headers = splitLine(headerLine, delimiter);
        headerSeen = true;
        // No contar como fila real; pasar a siguiente línea
        continue;
      }

      // Si no hay cabecera declarada, crea nombres genéricos en la 1ª línea de datos
      if (!useHeaders && headers.length === 0) {
        const cols = splitLine(line, delimiter).length;
        headers = Array.from({ length: cols }, (_, i) => `COL_${i + 1}`);
        headerSeen = true; // solo para no recalcular
      }

      // Parse a objeto con las headers que tengamos
      const values = splitLine(line, delimiter);
      const obj = {};
      for (let i = 0; i < headers.length; i++) {
        obj[headers[i]] = values[i] ?? "";
      }

      // Contador de filas reales
      totalRows++;

      // Llenar primeras 30
      if (previewStart.length < MAX_PREVIEW) {
        previewStart.push(obj);
      } else {
        // Mantener últimas 30 como buffer circular
        if (tailBuffer.length >= MAX_PREVIEW) tailBuffer.shift();
        tailBuffer.push(obj);
      }

      // === Log de progreso ===
      if (totalRows % 500000 === 0) {
        const memMB = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
        const elapsed = ((performance.now() - t0) / 1000).toFixed(0);
        log(`rows=${totalRows.toLocaleString()} | mem=${memMB} MB | t=${elapsed}s`);
        global.gc?.();
      }
    }
    const totalEffective = useHeaders ? totalRows : totalRows;
    const previewEnd = tailBuffer;

    // === Construcción del objeto meta FINAL ===
    const meta = {
      ok: true,
      ready: true,
      totalRows: useHeaders ? totalRows - 1 : totalRows,
      delimiter,                     // usa el delimitador ya detectado
      columns: headers || [],
      previewStart,                  // ya lo llenaste arriba (primeras 30 filas)
      previewEnd: tailBuffer,        // últimas 30 filas
      updatedAt: new Date().toISOString(),
      fileName: path.basename(filePath),
      datasetId,
    };


    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), "utf8");
    log(`meta.json written (${(performance.now()-t0).toFixed(0)} ms) rows=${totalRows}`);

  } catch (err) {
    log(`ERROR: ${err && err.stack ? err.stack : String(err)}`);
    try {
      fs.writeFileSync(metaPath, JSON.stringify({
        ok: false,
        ready: false,
        error: String(err),
        fileName: path.basename(filePath),
        datasetId
      }, null, 2), "utf8");
    } catch {}
  } finally {
    try { fs.existsSync(lockPath) && fs.unlinkSync(lockPath); } catch {}
    log(`done processing ${filePath}`);
    process.exit(0);
  }
})();
