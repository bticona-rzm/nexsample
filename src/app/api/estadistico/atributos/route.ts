import { NextResponse } from "next/server";

// Tabla de atributos
function attributeSampleSize(N: number, risk: "BAJO" | "MODERADO_ALTO"): number {
  if (N <= 10) return risk === "BAJO" ? 5 : 7;
  if (N <= 49) return risk === "BAJO" ? 10 : 15;
  if (N <= 249) return risk === "BAJO" ? 15 : 25;
  return risk === "BAJO" ? 15 : 30;
}

// Factor de confianza (IDEA simplificado)
function confidenceFactor(level: "ALTO" | "MODERADO" | "BAJO"): number {
  switch (level) {
    case "ALTO": return 3.0;
    case "MODERADO": return 2.0;
    case "BAJO": return 1.2;
  }
}

// Selección aleatoria
function randomSampleIndices(N: number, k: number): number[] {
  const arr = Array.from({ length: N }, (_, i) => i + 1); // elementos 1..N
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, k).sort((a, b) => a - b);
}

// Selección sistemática
function systematicSampleIndices(N: number, k: number): number[] {
  if (k <= 0) return [];
  const interval = Math.floor(N / k);
  const start = Math.floor(Math.random() * interval);
  const picks: number[] = [];
  for (let t = 0; t < k; t++) {
    const idx = start + t * interval;
    if (idx < N) picks.push(idx + 1); // 1..N
  }
  return picks.slice(0, k);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { populationSize, riskLevel, confidenceLevel, selectionMethod } = body;

  if (!populationSize || !riskLevel || !confidenceLevel || !selectionMethod) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const n = attributeSampleSize(Number(populationSize), riskLevel);
  const factor = confidenceFactor(confidenceLevel);

  let picks: number[] = [];
  if (selectionMethod === "ALEATORIO") {
    picks = randomSampleIndices(Number(populationSize), n);
  } else if (selectionMethod === "SISTEMATICO") {
    picks = systematicSampleIndices(Number(populationSize), n);
  }

  return NextResponse.json({
    populationSize,
    riskLevel,
    confidenceLevel,
    factorConfianza: factor,
    selectionMethod,
    sampleSize: n,
    picks,
  });
}
