import { NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";

//  PUT: actualizar cliente
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; // 👈 ahora es promesa
    const body = await request.json();
    const { nombre, tipo } = body;

    const updated = await prisma.cliente.update({
      where: { id: Number(id) },
      data: { nombre, tipo },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error al actualizar cliente:", error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ error: "Error al actualizar cliente" }, { status: 500 });
  }
}

// DELETE: eliminar cliente
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    await prisma.cliente.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ message: "Cliente eliminado" }, { status: 200 });
  } catch (error) {
    console.error("Error al eliminar cliente:", error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ error: "Error al eliminar cliente" }, { status: 500 });
  }
}
