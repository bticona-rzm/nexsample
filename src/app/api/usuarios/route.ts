// src/app/api/usuarios/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/client';
import { Role } from '@/lib/types';
import bcrypt from 'bcryptjs';

// ... tu función GET existente ...
export async function GET(request: NextRequest) { // Usamos NextRequest para acceder a la URL
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role'); // Leemos el parámetro "role"

    let whereClause = {}; // Cláusula de búsqueda vacía por defecto

    // Si se especificó un rol, lo añadimos a la búsqueda
    if (role && role === 'GERENTE') {
      whereClause = {
        role: Role.GERENTE,
      };
    }
    // Si no se especifica un rol, whereClause queda vacío y se buscan todos los usuarios.

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        // ...otros campos que necesites
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(users);

  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
// ▼▼▼ AÑADE ESTA NUEVA FUNCIÓN ▼▼▼
export async function POST(req: Request) {
  try {
    const { name, email, password, role } = await req.json();

    if (!name || !email || !password || !role) {
      // Devolvemos un error en formato JSON
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role as Role,
      },
    });

    const { password: _, ...userWithoutPassword } = newUser;
    return NextResponse.json(userWithoutPassword, { status: 201 });

  } catch (error: any) {
    console.error("Error al crear usuario:", error);
    
    // Devolvemos errores específicos en formato JSON
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return NextResponse.json({ error: "El correo electrónico ya está en uso" }, { status: 409 });
    }
    
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}