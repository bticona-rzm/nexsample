// Ruta: src/app/api/clientes/route.ts

import { NextResponse } from 'next/server';
// CORRECCIÓN: Se utiliza el alias de ruta '@/' para apuntar a la carpeta src
// y se importa desde el archivo 'client' que contiene la instancia de Prisma.
import { prisma } from '@/server/db/client'; 
import { Prisma } from '@prisma/client';

/**
 * GET: Obtiene la lista de todos los clientes.
 */
export async function GET() {
  // Opcional: Proteger la ruta para que solo usuarios autenticados puedan acceder.
  // import { getAuth } from '@clerk/nextjs/server';
  // const { userId } = getAuth(request);
  // if (!userId) {
  //   return new NextResponse("Unauthorized", { status: 401 });
  // }  

  try {
    const clientes = await prisma.cliente.findMany({
      orderBy: {
        nombre: 'asc',
      },
      // include: {
      //   // Incluimos la relación para saber qué usuarios están asignados
      //   usuarios: {
      //     include: {
      //       usuario: {
      //         select: {
      //           id: true,
      //           name: true,
      //         },
      //       },
      //     },
      //   },
      // },
    });
    return NextResponse.json(clientes);
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

/**
 * POST: Crea un nuevo cliente.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { codigo, nombre, tipo } = body;

    if (!codigo || !nombre || !tipo) {
      return new NextResponse("Faltan campos requeridos: código, nombre y tipo.", { status: 400 });
    }

    const nuevoCliente = await prisma.cliente.create({
      data: {
        codigo,
        nombre,
        tipo,
      },
    });

    return NextResponse.json(nuevoCliente, { status: 201 }); // 201 Created
  } catch (error) {
    console.error("Error al crear el cliente:", error);
    // Manejar error de código duplicado
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return new NextResponse("Ya existe un cliente con ese código.", { status: 409 }); // 409 Conflict
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
