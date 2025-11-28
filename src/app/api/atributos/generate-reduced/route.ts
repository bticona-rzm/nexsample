import { NextResponse } from 'next/server';
import { ReservoirSampler } from '@/lib/samplingService';
import { Readable } from 'stream';
import * as XLSX from 'xlsx';
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { prisma } from "@/lib/prisma"; // Ajustar ruta según proyecto
import { calculateBufferHash } from '@/lib/hashUtils';

// Helper to convert Web Stream to Node Stream
function webToNodeStream(webStream: ReadableStream<Uint8Array>): Readable {
    const reader = webStream.getReader();
    return new Readable({
        async read() {
            const { done, value } = await reader.read();
            if (done) {
                this.push(null);
            } else {
                this.push(Buffer.from(value));
            }
        }
    });
}

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
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const sampleSize = parseInt(formData.get('sampleSize') as string || '0');
        const seed = parseInt(formData.get('seed') as string || '0');

        if (!file || sampleSize <= 0) {
            return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
        }

        // 3. Calculate Hash (Read entire buffer for reduced files)
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileHash = calculateBufferHash(buffer);

        // 4. Sampling
        // Create a stream from the buffer for the sampler
        const stream = Readable.from(buffer);

        const result = await ReservoirSampler.sampleFromStream(stream, {
            sampleSize,
            seed,
            hasHeader: true
        });

        const sample = result.sample;

        // 5. Generate Excel (Backend Side)
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(sample);
        XLSX.utils.book_append_sheet(workbook, worksheet, "Muestra");
        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // 6. Save History
        const historyEntry = await prisma.historialMuestra.create({
            data: {
                name: `Muestra Web - ${file.name}`,
                records: sample.length,
                range: `1-${sample.length}`, // Simplificado
                seed: seed,
                allowDuplicates: false, // TODO: Recibir parametro
                source: file.name,
                hash: fileHash,
                tipo: "estandar",
                userId: user.id,
                // Campos adicionales
                totalRecords: 0, // No sabemos el total sin leer todo, sampler podría devolverlo si se modifica
                createdAt: new Date()
            }
        });

        // 7. Return Excel File
        return new NextResponse(excelBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="muestra_${historyEntry.id}.xlsx"`,
                'X-History-ID': historyEntry.id
            }
        });

    } catch (error) {
        console.error('Error generating reduced sample:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
