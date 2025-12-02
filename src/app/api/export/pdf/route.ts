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

    const importes = await prisma.historialImport.findMany({
      where: { usuarioId: userId },
      orderBy: { creadoEn: "desc" },
    });


    const muestras = await prisma.historialMuestra.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } },
    });


    const exportes = await prisma.historialExport.findMany({
      where: { usuarioId: userId },
      orderBy: { creadoEn: "desc" },
    });


    if (!importes.length && !muestras.length && !exportes.length) {
      return NextResponse.json({ error: "No hay historial" }, { status: 404 });
    }

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const page = pdfDoc.addPage([900, 650]);
    let currentPage = page;
    let y = 600;
    const margin = 40;
    const { height } = currentPage.getSize();

    const newPage = () => {
      const p = pdfDoc.addPage([900, 650]);
      currentPage = p;
      y = 600;
    };

    const drawTitle = (text: string) => {
      currentPage.drawText(text, {
        x: margin,
        y,
        size: 18,
        color: rgb(0, 0.25, 0.6),
        font: fontBold,
      });
      y -= 25;
    };

    const drawHeaders = (headers: string[], widths: number[], color: any) => {
      let x = margin;

      currentPage.drawRectangle({
        x: margin - 5,
        y: y - 3,
        width: widths.reduce((a, b) => a + b, 0) + 10,
        height: 18,
        color,
      });

      headers.forEach((h, i) => {
        currentPage.drawText(h, {
          x,
          y,
          size: 9,
          font: fontBold,
          color: rgb(0, 0, 0.4),
        });
        x += widths[i];
      });

      y -= 18;
    };

    const drawRow = (values: string[], widths: number[]) => {
      if (y < 40) newPage();

      let x = margin;

      values.forEach((val, i) => {
        currentPage.drawText(String(val), {
          x,
          y,
          size: 8.5,
          font,
          color: rgb(0, 0, 0),
        });

        x += widths[i];
      });

      y -= 14;
    };

    drawTitle("Historial de Importaciones");

    drawHeaders(
      ["ARCHIVO", "FECHA", "TAMAÑO", "ORIGEN", "ENCAB", "REGISTROS", "DATASET"],
      [160, 120, 60, 80, 50, 70, 100],
      rgb(0.90, 0.85, 1)
    );

    importes.forEach(i => {
      drawRow(
        [
          i.nombreArchivo.slice(0, 40),
          i.creadoEn.toLocaleString("es-BO"),
          (Number(i.tamanoBytes ?? 0) / 1024).toFixed(1) + " KB",
          i.origenDatos || "-",
          i.tieneEncabezados ? "Sí" : "No",
          String(i.registrosTotales),
          i.datasetId || "-"
        ],
        [160, 120, 60, 80, 50, 70, 100]
      );
    });

    y -= 20;

    drawTitle("Historial de Muestreos");

    drawHeaders(
      ["NOMBRE", "FECHA", "USUARIO", "REG", "RANGO", "SEM", "DUP", "FUENTE", "HASH", "TIPO"],
      [100, 120, 90, 40, 60, 40, 40, 120, 60, 50],
      rgb(0.80, 0.90, 1)
    );

    muestras.forEach(h => {
      drawRow(
        [
          h.name.slice(0, 18),
          new Date(h.createdAt).toLocaleString("es-BO"),
          h.user?.name || "—",
          String(h.records),
          h.range,
          String(h.seed),
          h.allowDuplicates ? "Sí" : "No",
          h.source?.slice(0, 15),
          h.hash?.slice(0, 10),
          h.tipo
        ],
        [100, 120, 90, 40, 60, 40, 40, 120, 60, 50]
      );
    });

    y -= 20;

    drawTitle("Historial de Exportaciones");

    drawHeaders(
      ["EXPORTADO", "FECHA", "FORMATO", "REG", "RANGO", "FUENTE"],
      [150, 120, 60, 40, 80, 140],
      rgb(0.85, 1, 0.90)
    );

    exportes.forEach(e => {
      drawRow(
        [
          e.nombreExportado.slice(0, 25),
          e.creadoEn.toLocaleString("es-BO"),
          e.formatoExportacion,
          String(e.registrosExportados),
          `${e.rangoInicio}-${e.rangoFin}`,
          e.archivoFuenteNombre?.slice(0, 20) || "-"
        ],
        [150, 120, 60, 40, 80, 140]
      );
    });

    const pdfBytes = await pdfDoc.save();

    return new Response(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=historial_general.pdf",
      },
    });

  } catch (err: any) {
    console.error("❌ Error PDF:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
