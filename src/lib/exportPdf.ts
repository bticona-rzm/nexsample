import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportSampleToPDF(data: any, type: "atributos" | "controles") {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text("Reporte de Muestreo Estadístico", 14, 20);

  if (type === "atributos") {
    autoTable(doc, {
      startY: 30,
      head: [["Parámetro", "Valor"]],
      body: [
        ["Población", data.populationSize],
        ["Riesgo", data.riskLevel],
        ["Confianza", data.confidenceLevel],
        ["Factor de Confianza", data.factorConfianza],
        ["Método", data.selectionMethod],
        ["Tamaño de muestra", data.sampleSize],
        ["Índices seleccionados", data.picks?.join(", ")],
      ],
    });
  } else {
    autoTable(doc, {
      startY: 30,
      head: [["Parámetro", "Valor"]],
      body: [
        ["Ocurrencias", data.occurrences],
        ["Riesgo", data.riskLevel],
        ["Frecuencia derivada", data.frequency],
        ["Tamaño de muestra", data.sampleSize],
      ],
    });
  }

  doc.save(`muestreo_${type}.pdf`);
}
