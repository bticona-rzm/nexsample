import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function POST(req: Request) {
  try {
    const { tipo } = await req.json();
    const session: any = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 });

    // 🧠 Obtener historial desde Prisma
    const historial = await prisma.historialMuestra.findMany({
      where: { userId, ...(tipo ? { tipo } : {}) },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } } },
    });

    if (!historial.length) {
      return NextResponse.json({ error: "No hay registros en el historial" }, { status: 404 });
    }

    // 🧾 Crear PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([840, 600]); // horizontal
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const { width, height } = page.getSize();
    const margin = 40;
    let y = height - 50;

    page.drawText(`Historial de Muestras (${tipo === "masivo" ? "Masivo" : "Estandar"})`, {
      x: margin,
      y,
      size: 16,
      font: fontBold,
      color: rgb(0, 0.2, 0.6),
    });
    y -= 25;

    const headers = [
      "Nombre",
      "Fecha",
      "Usuario",
      "Registros",
      "Rango",
      "Semilla",
      "Duplicados",
      "Archivo",
      "Hash",
    ];

    // Encabezado
    headers.forEach((h, i) => {
      page.drawText(h, { x: margin + i * 90, y, size: 9, font: fontBold });
    });
    y -= 15;

    // Filas
    historial.forEach((h) => {
      if (y < 60) {
        y = height - 50;
        pdfDoc.addPage();
      }
      const values = [
        h.name || "-",
        new Date(h.createdAt).toLocaleString("es-BO"),
        h.user?.name || h.userId,
        h.records?.toString() || "-",
        h.range || "-",
        h.seed?.toString() || "-",
        h.allowDuplicates ? "Sí" : "No",
        h.source || "-",
        (h.hash || "").slice(0, 10),
      ];

      values.forEach((v, i) => {
        page.drawText(String(v), { x: margin + i * 90, y, size: 8, font });
      });
      y -= 13;
    });

    const pdfBytes = await pdfDoc.save();
    return new Response(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="historial_${tipo || "todos"}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error("❌ Error generando PDF historial:", err);
    return NextResponse.json(
      { error: "Error generando PDF historial", details: err.message },
      { status: 500 }
    );
  }
}
