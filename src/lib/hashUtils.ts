import crypto from 'crypto';
import fs from 'fs';

/**
 * Calculates SHA-256 hash of a buffer.
 * Used for web uploads where we have the full file in memory/stream.
 */
export function calculateBufferHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Calculates a "Quick Hash" for massive local files.
 * Strategy: SHA-256(FileSize + LastModifiedTime + First 64KB + Last 64KB).
 * This avoids reading the entire TB-sized file while providing reasonable integrity checks.
 */
export async function calculateQuickHash(filePath: string): Promise<string> {
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }

    const stats = fs.statSync(filePath);
    const fileSize = stats.size;
    const mtime = stats.mtimeMs.toString();

    const CHUNK_SIZE = 64 * 1024; // 64KB
    const bufferStart = Buffer.alloc(Math.min(CHUNK_SIZE, fileSize));

    // Read first chunk
    const fd = fs.openSync(filePath, 'r');
    try {
        fs.readSync(fd, bufferStart, 0, bufferStart.length, 0);

        let bufferEnd = Buffer.alloc(0);
        if (fileSize > CHUNK_SIZE) {
            const readSize = Math.min(CHUNK_SIZE, fileSize - CHUNK_SIZE);
            bufferEnd = Buffer.alloc(readSize);
            fs.readSync(fd, bufferEnd, 0, readSize, fileSize - readSize);
        }

        const hash = crypto.createHash('sha256');
        hash.update(fileSize.toString());
        hash.update(mtime);
        hash.update(bufferStart);
        hash.update(bufferEnd);

        return hash.digest('hex');
    } finally {
        fs.closeSync(fd);
    }
}
