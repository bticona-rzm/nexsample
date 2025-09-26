import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Inicializa el cliente de Prisma
const prisma = new PrismaClient();

// Función principal del script de seed
async function main() {
  console.log('Iniciando el script de seed...');

  // Configura las credenciales del usuario administrador
  // ¡Asegúrate de cambiar estos valores antes de usar en producción!
  const email = 'admin@tuapp.com';
  const plainPassword = '123456';

  // Hashea la contraseña para guardarla de forma segura en la base de datos
  const contraseñaHasheada = await bcrypt.hash(plainPassword, 10);

  // Elimina el usuario si ya existe para evitar errores de duplicado
  const usuarioExistente = await prisma.user.findUnique({ where: { email } });
  if (usuarioExistente) {
    await prisma.user.delete({ where: { email } });
    console.log(`Usuario existente ${email} eliminado.`);
  }

  // Crea el nuevo usuario administrador
  const nuevoUsuario = await prisma.user.create({
    data: {
      email: email,
      name: 'Administrador',
      password: contraseñaHasheada,
      role: 'ADMIN', // Asigna el rol de ADMIN directamente
    },
  });

  console.log(`✅ Usuario administrador creado con éxito:`);
  console.log(nuevoUsuario);
}

// Llama a la función principal y maneja errores
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
