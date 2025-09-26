import { NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { Role } from "@prisma/client";
import type { NextRequest } from "next/server";

//  DELETE: eliminar usuario
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    await prisma.user.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }
    console.error("Error al eliminar usuario:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

//  PUT: actualizar rol usuario
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { role } = body;

    if (!role || !Object.values(Role).includes(role)) {
      return new NextResponse("Rol inválido o no proporcionado.", { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error al actualizar el rol del usuario:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
