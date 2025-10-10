import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function POST(req: Request) {
  try {
    const session: any = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId)
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 });

    // Traer TODO el historial (masivo + estandar)
    const historial = await prisma.historialMuestra.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } } },
    });

    if (!historial.length) {
      return NextResponse.json({ error: "No hay registros en el historial" }, { status: 404 });
    }

    // Crear PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([860, 600]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const { width, height } = page.getSize();

    let y = height - 50;
    const margin = 30;

    // 🔷 Título general
    page.drawText(`Historial General de Muestras`, {
      x: margin,
      y,
      size: 18,
      font: fontBold,
      color: rgb(0, 0.2, 0.6),
    });
    y -= 25;

    // Encabezado de tabla
    const headers = [
      "NOMBRE",
      "FECHA",
      "USUARIO",
      "REGISTROS",
      "RANGO",
      "SEMILLA",
      "DUPLICADOS",
      "FUENTE",
      "HASH",
      "TIPO",
    ];

    const colWidths = [80, 100, 90, 60, 60, 60, 70, 90, 70, 50];

    let x = margin;
    headers.forEach((h, i) => {
      page.drawText(h, {
        x,
        y,
        size: 9,
        font: fontBold,
        color: rgb(0.9, 0.9, 1),
      });
      x += colWidths[i];
    });

    // Línea azul bajo encabezado
    y -= 10;
    page.drawRectangle({
      x: margin - 5,
      y: y - 2,
      width: width - 2 * margin,
      height: 0.5,
      color: rgb(0.2, 0.4, 0.8),
    });

    // Filas
    y -= 12;
    const lineHeight = 12;
    historial.forEach((h) => {
      if (y < 60) {
        const newPage = pdfDoc.addPage([860, 600]);
        y = height - 50;
      }

      const values = [
        h.name || "-",
        new Date(h.createdAt).toLocaleString("es-BO"),
        h.user?.name || h.userId,
        String(h.records ?? "-"),
        h.range ?? "-",
        String(h.seed ?? "-"),
        h.allowDuplicates ? "Sí" : "No",
        h.source ?? "-",
        (h.hash || "").slice(0, 8),
        h.tipo?.toUpperCase() ?? "-",
      ];

      let x = margin;
      values.forEach((v, i) => {
        page.drawText(String(v), {
          x,
          y,
          size: 8,
          font,
          color: rgb(0, 0, 0),
        });
        x += colWidths[i];
      });
      y -= lineHeight;
    });

    const pdfBytes = await pdfDoc.save();

    return new Response(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="historial_general.pdf"`,
      },
    });
  } catch (err: any) {
    console.error("❌ Error al generar PDF historial:", err);
    return NextResponse.json(
      { error: "Error generando PDF historial", details: err.message },
      { status: 500 }
    );
  }
}
