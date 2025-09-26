// Ruta: src/app/api/clientes/asignacion/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/server/db/client';
import { Prisma } from '@prisma/client';

/**
 * POST: Crea una nueva asignación (asigna un usuario a un cliente).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clienteId, usuarioId } = body;

    if (!clienteId || !usuarioId) {
      return new NextResponse("Faltan clienteId y usuarioId.", { status: 400 });
    }

    const asignacion = await prisma.clienteUsuario.create({
      data: {
        clienteId,
        usuarioId,
      },
    });

    return NextResponse.json(asignacion, { status: 201 });
  } catch (error) {
    console.error("Error al asignar usuario:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return new NextResponse("Este usuario ya está asignado a este cliente.", { status: 409 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}


/**
 * DELETE: Elimina una asignación (desasigna un usuario de un cliente).
 */
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { clienteId, usuarioId } = body;

    if (!clienteId || !usuarioId) {
      return new NextResponse("Faltan clienteId y usuarioId en el cuerpo de la solicitud.", { status: 400 });
    }

    await prisma.clienteUsuario.delete({
      where: {
        clienteId_usuarioId: {
          clienteId,
          usuarioId,
        },
      },
    });

    return new NextResponse("Asignación eliminada", { status: 200 });
  } catch (error) {
    console.error("Error al desasignar usuario:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return new NextResponse("No se encontró la asignación para eliminar.", { status: 404 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
