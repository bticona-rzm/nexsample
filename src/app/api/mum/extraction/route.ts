// Controlador: Recibe la solicitud, llama al servicio y devuelve la respuesta.

import { NextResponse } from 'next/server';
import { executeExtraction } from '../../../../lib/extractionService'; // Importa la lógica

// Define la interfaz del Payload para asegurar la tipificación
interface ExtractionPayload {
    excelData: any[];
    estimatedSampleSize: number;
    sampleInterval: number;
    highValueLimit: number;
    highValueManagement: "agregados" | "separado";
    sampleField: string;
    randomStartPoint: number;
    estimatedPopulationValue: number;
    extractionType: "intervaloFijo" | "seleccionCelda";
    extractionFilename: string;
    highValueFilename: string;
}

export async function POST(req: Request) {
    try {
        const payload: ExtractionPayload = await req.json();

        // 1. Llamar a la Lógica de Negocio
        const { sampleFileBase64, highValueFileBase64 } = executeExtraction(payload);

        // 2. Devolver la respuesta HTTP (Controlador)
        return NextResponse.json({
            sampleFileBase64,
            highValueFileBase64,
            extractionFilename: payload.extractionFilename,
            highValueFilename: payload.highValueFilename,
        });

    } catch (error: any) {
        console.error("Error en la extracción (API Handler):", error);
        return NextResponse.json(
            { error: "Error interno del servidor al procesar la extracción: " + error.message }, 
            { status: 500 }
        );
    }
}