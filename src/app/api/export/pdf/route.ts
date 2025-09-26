import { exportSampleToExcel } from "@/lib/exportExcel";
import { SlowBuffer } from "buffer";
import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function POST(req: Request) {
  try {
    const { rows, title } = await req.json();

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "No hay datos para exportar" }, { status: 400 });
    }

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const page = pdfDoc.addPage([800, 600]); // A4 horizontal
    const { width, height } = page.getSize();

    // 🔹 Header
    page.drawText(title || "Muestra Estadística", {
      x: 40,
      y: height - 50,
      size: 20,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.6),
    });

    // 🔹 Config tabla
    const margin = 40;
    const cellPadding = 5;
    const rowHeight = 20;
    const colWidth = (width - margin * 2) / Object.keys(rows[0]).length;

    let y = height - 90;

    // 🔹 Dibujar cabecera
    Object.keys(rows[0]).forEach((key, i) => {
      const x = margin + i * colWidth;
      page.drawRectangle({
        x,
        y: y - rowHeight,
        width: colWidth,
        height: rowHeight,
        color: rgb(0.85, 0.9, 1),
      });
      page.drawText(key.toUpperCase(), {
        x: x + cellPadding,
        y: y - rowHeight + 6,
        size: 10,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
    });

    y -= rowHeight;

    // 🔹 Dibujar filas
    rows.forEach((row: any) => {
      Object.values(row).forEach((val: any, i) => {
        const x = margin + i * colWidth;
        page.drawRectangle({
          x,
          y: y - rowHeight,
          width: colWidth,
          height: rowHeight,
          borderColor: rgb(0.7, 0.7, 0.7),
          borderWidth: 0.5,
        });
        page.drawText(String(val), {
          x: x + cellPadding,
          y: y - rowHeight + 6,
          size: 9,
          font,
          color: rgb(0.1, 0.1, 0.1),
        });
      });
      y -= rowHeight;
      if (y < 50) {
        y = height - 90;
        pdfDoc.addPage([800, 600]); // nueva página
      }
    });

    const pdfBytes = await pdfDoc.save();

    return new Response(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="muestra.pdf"`,
      },
    });
  } catch (err: any) {  
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
