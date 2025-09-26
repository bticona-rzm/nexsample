// /api/atributos/planificacion/route.ts 

 import { NextResponse } from 'next/server'; 

 // Tabla de factores de confianza (para determinar el factor de riesgo) 
 // NOTA: Estos valores parecen ser para una confianza específica (ej. 95%) y se ajustarán al encontrar el número crítico. 
 // En un entorno real, esta tabla podría ser más extensa o calcularse usando distribuciones estadísticas. 
 const CONFIDENCE_FACTORS = [ 
    { deviations: 0, factor: 3.0, confidence: 95.00 }, 
    { deviations: 1, factor: 4.75, confidence: 94.97 }, 
    { deviations: 2, factor: 6.30, confidence: 94.99 }, 
    { deviations: 3, factor: 7.75, confidence: 94.99 }, 
    { deviations: 4, factor: 9.15, confidence: 94.99 }, 
    { deviations: 5, factor: 10.50, confidence: 94.99 }, 
    { deviations: 6, factor: 11.80, confidence: 94.99 }, 
    { deviations: 7, factor: 13.10, confidence: 94.99 }, 
    { deviations: 8, factor: 14.35, confidence: 94.99 }, 
    { deviations: 9, factor: 15.60, confidence: 94.99 }, 
    { deviations: 10, factor: 16.80, confidence: 94.99 }, 
 ]; 

export async function POST(request: Request) { 
    try { 
        const formData = await request.formData();
        const dataFile = formData.get('file') as File | null;
        const dataString = formData.get('data') as string | null;

        if (!dataFile) {
            return NextResponse.json({ error: "No se encontró el archivo en la solicitud (campo 'file')." }, { status: 400 });
        }
        if (!dataString) {
            return NextResponse.json({ error: "No se encontraron los datos de planificación (campo 'data')." }, { status: 400 });
        }

        // 3. Parsear la cadena JSON para obtener los parámetros de planificación
        const planificationData = JSON.parse(dataString!.toString());
        console.log("Planification Data:", planificationData);

        const { 
            populationSize, 
            tolerableDeviation, 
            confidenceLevel, 
            controlType, 
            expectedDeviation, 
            alphaConfidenceLevel 
        } = planificationData;

        // 1. Obtener Factor de Confianza (Punto de Fallo Común)
        const criticalDeviationForCalculation = 0; // O el valor que corresponda
        const targetFactor = CONFIDENCE_FACTORS.find(
            // 💡 VERIFICA QUE CONFIDENCE_FACTORS TIENE UN VALOR PARA 60
            cf => cf.confidence === confidenceLevel 
        )?.factor || CONFIDENCE_FACTORS[0].factor; // Usar el factor directamente, no el campo 'deviations'
        
        // 🚨 LOGGING DE FACTOR 🚨
        console.log("Target Factor:", targetFactor);

        // 2. Cálculo del Divisor
        const tolerableDeviationRate = tolerableDeviation / 100; 
        const expectedDeviationRate = expectedDeviation / 100; 

        let divisor: number;
        
        if (controlType === 'beta' || controlType === '') { // Controlar la cadena vacía
            divisor = tolerableDeviationRate;
        } else {
            divisor = tolerableDeviationRate - expectedDeviationRate;
        }

        if (divisor <= 0) {
             return NextResponse.json({ error: "La desviación tolerable no es mayor que la esperada." }, { status: 400 });
        }
         
        // 🚨 LOGGING DEL DIVISOR 🚨
        console.log("Divisor:", divisor);

        // 3. Cálculo de la Muestra Inicial
        let calculatedSampleSize = Math.ceil(targetFactor / divisor);
        
        // 🚨 LOGGING DE MUESTRA INICIAL 🚨
        console.log("Muestra Inicial (n0):", calculatedSampleSize);

        

        // 4. Aplicación del FPC (Punto de Fallo Crítico con N pequeño)
        if (populationSize <= 1) {
            calculatedSampleSize = populationSize; 
        } else {
             const fpc = (populationSize - calculatedSampleSize) / (populationSize - 1); 
             
             // 🚨 LOGGING DEL FPC 🚨
             console.log("FPC:", fpc);
             
             // 💡 Lanza error si FPC es negativo (caso donde n0 > N)
             if (fpc < 0) {
                 // Si n0 es mayor a N, el cálculo del FPC debe ser manejado.
                 // Usaremos la lógica estándar, pero el FPC debe ser <= 1.
             }

             calculatedSampleSize = Math.round(calculatedSampleSize * fpc); 
        }

        // Aplicar el Factor de Corrección para Población Finita (FPC) 
        const fpc = (populationSize - calculatedSampleSize) / (populationSize - 1); 
        calculatedSampleSize = Math.round(calculatedSampleSize * fpc); 

        // Asegurarse de que el tamaño de la muestra no supere el de la población 
        if (calculatedSampleSize > populationSize) { 
            calculatedSampleSize = populationSize; 
        } 
        
        if (calculatedSampleSize < 1) { 
             calculatedSampleSize = 1; 
        }

        // Encontrar el número crítico de desviaciones...
        const finalCriticalDeviation = CONFIDENCE_FACTORS.find( 
            (cf) => cf.confidence >= confidenceLevel 
        )?.deviations || 0; 

        return NextResponse.json({ 
            calculatedSampleSize, 
            criticalDeviation: finalCriticalDeviation 
        }); 

    } catch (error) { 
        console.error("Error al procesar FormData o en el cálculo de planificación:", error); 
        // 500 (Internal Server Error) si algo falla en el backend
        return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 }); 
    } 
}