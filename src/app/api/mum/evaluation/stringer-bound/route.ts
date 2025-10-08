// /app/api/mum/evaluation/stringer-bound/route.ts
import { NextResponse } from 'next/server';
import { StringerBoundService } from '@/lib/apiClient';

export async function POST(req: Request) {
    try {
        const requestData = await req.json();
        
        // Validación básica
        if (!requestData.sampleData || !Array.isArray(requestData.sampleData)) {
            return NextResponse.json({ 
                error: "Datos de muestra inválidos" 
            }, { status: 400 });
        }

        // Delegar toda la lógica al servicio
        const result = await StringerBoundService.evaluateStringerBound(requestData);

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("Error en API Stringer Bound:", error);
        return NextResponse.json({ 
            error: "Error procesando evaluación Stringer Bound: " + error.message 
        }, { status: 500 });
    }
}