import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { hash } = await req.json();

        if (!hash) {
            return NextResponse.json({ error: 'Hash requerido' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        const historyEntry = await prisma.historialMuestra.findFirst({
            where: {
                userId: user.id,
                hash: hash,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json({
            isValid: !!historyEntry,
            lastSample: historyEntry || null,
        });

    } catch (error) {
        console.error('Error validating hash:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
