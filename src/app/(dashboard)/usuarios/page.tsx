// src/app/usuarios/page.tsx
import UserTable from '@/components/usuarios/UserTable';
import { Prisma } from '@prisma/client';
import { prisma } from '@/server/db/client';
import { Role } from '@/lib/types';

async function getData() {
  const users = await prisma.user.findMany();
  const roles = Object.values(Role);
  return { users, roles };
}

export default async function GestionUsuariosPage() {
  const { users, roles } = await getData();

  // No necesitas envolver el componente en <Layout>
  // Next.js ya lo hace por ti usando el archivo raíz src/app/layout.tsx
  return (
    <UserTable initialUsers={users} allRoles={roles} />
  );
}
