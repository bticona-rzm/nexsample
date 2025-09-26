// test-prisma.js - VERSIÓN FINAL
require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando script de prueba de Prisma (versión $executeRaw)...');

  try {
    // Creamos un vector de embedding de 768 dimensiones con valores de ejemplo
    const dummyEmbedding = Array(768).fill(0.1);

    // Convertimos el array de JavaScript a un formato de string que pgvector entiende: '[0.1,0.1,...]'
    const embeddingString = `[${dummyEmbedding.join(',')}]`;

    console.log('Intentando crear un registro en la tabla "normativa" con $executeRaw...');

    // Usamos una consulta SQL cruda para la inserción.
    // Esto nos da control total sobre el tipo de dato del vector.
    const result = await prisma.$executeRaw`
      INSERT INTO "normativa" (
        "orden", "tipo_contenido", "identificador", "contenido_markdown", 
        "titulo", "libro", "embedding"
      ) VALUES (
        9999, 'ARTICULO', 'Artículo de Prueba Raw', 
        'Contenido de prueba para $executeRaw.', 
        'Documento de Prueba Raw', 'Libro de Prueba Raw', 
        ${embeddingString}::vector
      )
    `;

    if (result > 0) {
      console.log('✅ ¡Éxito! El registro se ha creado correctamente.');
      console.log('Número de filas insertadas:', result);
    } else {
      console.error('❌ ERROR: La inserción no afectó ninguna fila.');
    }

  } catch (error) {
    console.error('❌ ERROR: El script de prueba falló.');
    console.error(error);
  } finally {
    await prisma.$disconnect();
    console.log('Desconectado de la base de datos.');
  }
}

main();