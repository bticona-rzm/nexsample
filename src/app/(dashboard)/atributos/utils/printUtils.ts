// /app/dashboard/atributos/utils/printUtils.ts (NUEVO ARCHIVO)

import { jsPDF } from "jspdf";
import "jspdf-autotable"; // Se importa aquí, no en page.tsx

export const printPlanificationResults = (sampleSize: number, criticalDeviation: number) => {
    const doc = new jsPDF();
    doc.text("Resultados del Muestreo por Atributos", 14, 20);

    const dataForTable = [
        ["Tamaño de la Muestra", sampleSize],
        ["Desviaciones Críticas", criticalDeviation],
    ];

    (doc as any).autoTable({
        startY: 30,
        head: [['Concepto', 'Valor']],
        body: dataForTable,
        theme: 'striped'
    });

    doc.save("Planificacion_Muestreo_Atributos.pdf");
};