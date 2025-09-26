import { NextResponse } from "next/server";

// Mapeo ocurrencias → frecuencia
function mapOccurrencesToFreq(occ: number): string {
  if (occ === 1) return "ANUAL";
  if (occ === 2) return "SEMESTRAL";
  if (occ >= 3 && occ <= 6) return "BIMENSUAL";
  if (occ >= 7 && occ <= 12) return "MENSUAL";
  if (occ >= 13 && occ <= 26) return "QUINCENAL";
  if (occ >= 27 && occ <= 52) return "SEMANAL";
  if (occ >= 53 && occ <= 366) return "DIARIO";
  return "PERIODICO"; // >366
}

// Tabla frecuencia × riesgo
function controlSampleSize(freq: string, risk: "BAJO" | "MODERADO_ALTO"): number {
  const tabla: Record<string, [number, number]> = {
    ANUAL: [1, 1],
    SEMESTRAL: [1, 2],
    BIMENSUAL: [3, 4],
    MENSUAL: [3, 4], // ⚠️ versión actualizada (antes era 3 y 5)
    QUINCENAL: [5, 8],
    SEMANAL: [6, 10],
    DIARIO: [25, 30],
    PERIODICO: [30, 40],
  };

  const [low, high] = tabla[freq];
  return risk === "BAJO" ? low : high;
}

export async function POST(req: Request) {
  const body = await req.json();
  const { occurrences, riskLevel } = body;

  if (!occurrences || !riskLevel) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const freq = mapOccurrencesToFreq(Number(occurrences));
  const n = controlSampleSize(freq, riskLevel);

  return NextResponse.json({
    occurrences,
    riskLevel,
    frequency: freq,
    sampleSize: n,
  });
}
