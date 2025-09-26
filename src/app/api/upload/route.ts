import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx'; // Importar la librería XLSX

// Definimos el tipo para la respuesta de la API para mayor claridad
type ApiResponse = {
    headers: string[];
    data: { [key: string]: any }[];
    populationSize: number;
    status: 'ok';
};

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse | { error: string }>> {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file || !(file instanceof File)) {
            return NextResponse.json({ error: 'No se encontró ningún archivo para subir.' }, { status: 400 });
        }

        // 1. Convertir el objeto File a un ArrayBuffer
        const buffer = await file.arrayBuffer();

        // 2. Cargar el buffer con XLSX
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        
        // Asumimos que queremos la primera hoja
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // 3. Convertir la hoja de trabajo a un array de objetos JSON
        const excelData = XLSX.utils.sheet_to_json(worksheet) as { [key: string]: any }[];
        
        // Si el archivo está vacío (solo encabezados)
        if (excelData.length === 0) {
             return NextResponse.json({ error: 'El archivo Excel/CSV está vacío o solo contiene encabezados.' }, { status: 422 });
        }

        // 4. Extraer los encabezados de las columnas
        // Usamos las claves del primer objeto para obtener los encabezados.
        const headers = Object.keys(excelData[0]);
        
        const populationSize = excelData.length;

        // 5. Devolver los datos reales al cliente
        return NextResponse.json({ 
            headers: headers,
            data: excelData,
            populationSize: populationSize,
            status: 'ok' 
        }, { status: 200 });

    } catch (error) {
        console.error("Error procesando el archivo:", error);
        // Si el error es una excepción de la librería XLSX (ej. archivo corrupto)
        return NextResponse.json({ error: 'Error al leer el archivo. Asegúrate de que sea un Excel o CSV válido.' }, { status: 500 });
    }
}