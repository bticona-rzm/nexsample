import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export function exportSampleToExcel(data: any, type: "atributos" | "controles") {
  let ws;
  if (type === "atributos") {
    ws = XLSX.utils.json_to_sheet([
      {
        Poblacion: data.populationSize,
        Riesgo: data.riskLevel,
        Confianza: data.confidenceLevel,
        FactorConfianza: data.factorConfianza,
        Metodo: data.selectionMethod,
        TamañoMuestra: data.sampleSize,
        IndicesSeleccionados: data.picks?.join(", "),
      },
    ]);
  } else {
    ws = XLSX.utils.json_to_sheet([
      {
        Ocurrencias: data.occurrences,
        Riesgo: data.riskLevel,
        Frecuencia: data.frequency,
        TamañoMuestra: data.sampleSize,
      },
    ]);
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Muestreo");

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(new Blob([wbout], { type: "application/octet-stream" }), `muestreo_${type}.xlsx`);
}
