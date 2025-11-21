import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

export async function POST(req: Request) {
  const session: any = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const { action, data } = await req.json();

    if (action === "add") {
      const saved = await prisma.historialMuestra.create({
        data: {
          ...data,
          userId: session.user.id,
        },
      });
      return NextResponse.json(saved);
    }

    if (action === "list") {
      const rows = await prisma.historialMuestra.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(rows);
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: "Error en historial", details: err.message }, { status: 500 });
  }
}
