import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const data = await prisma.historialExport.findMany({
    orderBy: { creadoEn: "desc" }
  });
  return NextResponse.json({ data });
}
