import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { calculateQuickHash } from '@/lib/hashUtils';
import fs from 'fs';
import readline from 'readline';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { filePath } = await request.json();

        if (!filePath) {
            return NextResponse.json({ error: 'File path is required' }, { status: 400 });
        }

        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: 'File not found at the specified path' }, { status: 404 });
        }

        const stats = fs.statSync(filePath);
        const fileSize = stats.size;
        const mtime = stats.mtime;

        // Calculate Quick Hash
        const hash = await calculateQuickHash(filePath);

        // 1. Count lines and get preview
        const fileStream = fs.createReadStream(filePath);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        let lineCount = 0;
        let headers: string[] = [];
        const previewLines: string[] = [];
        const PREVIEW_LIMIT = 20;

        for await (const line of rl) {
            if (lineCount === 0) {
                // Assume comma delimiter for now, could be enhanced to detect
                headers = line.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
            } else if (lineCount <= PREVIEW_LIMIT) {
                previewLines.push(line);
            }
            lineCount++;
        }

        // Parse preview data
        const previewData = previewLines.map(line => {
            const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            const row: Record<string, string | number | null> = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || null;
            });
            return row;
        });

        // Adjust line count (exclude header)
        const populationSize = Math.max(0, lineCount - 1);

        return NextResponse.json({
            populationSize,
            headers,
            previewData,
            fileSize,
            mtime,
            hash
        });

    } catch (error) {
        console.error('Error processing massive file info:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error processing file' },
            { status: 500 }
        );
    }
}
