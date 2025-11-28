import { NextResponse } from 'next/server';
import fs from 'fs';
import { ReservoirSampler } from '@/lib/samplingService';
import * as XLSX from 'xlsx';
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { prisma } from "@/lib/prisma"; // Ajustar ruta
import { calculateQuickHash } from '@/lib/hashUtils';

export async function POST(request: Request) {
    try {
        // 1. Auth Check
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        // 2. Parse Request
        const body = await request.json();
        const { filePath, sampleSize, seed } = body;

        if (!filePath || !fs.existsSync(filePath)) {
            return NextResponse.json({ error: 'Archivo local no encontrado' }, { status: 400 });
        }

        // 3. Calculate Quick Hash
        const fileHash = await calculateQuickHash(filePath);

        // 4. Sampling
        const stream = fs.createReadStream(filePath);
        const result = await ReservoirSampler.sampleFromStream(stream, {
            sampleSize,
            seed,
            hasHeader: true
        });

        const sample = result.sample;

        // 5. Generate Excel (Backend Side)
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(sample);
        XLSX.utils.book_append_sheet(workbook, worksheet, "Muestra Masiva");
        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // 6. Save History
        const historyEntry = await prisma.historialMuestra.create({
            data: {
                name: `Muestra Masiva - ${filePath.split('\\').pop()}`,
                records: sample.length,
                range: `1-${sample.length}`, // Simplificado
                seed: seed,
                allowDuplicates: false,
                source: filePath,
                hash: fileHash,
                tipo: "masivo",
                userId: user.id,
                createdAt: new Date()
            }
        });

        // 7. Return Excel File
        return new NextResponse(excelBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="muestra_masiva_${historyEntry.id}.xlsx"`,
                'X-History-ID': historyEntry.id
            }
        });

    } catch (error) {
        console.error('Error generating massive sample:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
