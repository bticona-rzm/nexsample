// Ruta: src/types/next-auth.d.ts

import { Role } from "@prisma/client";
import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

// Extiende los tipos por defecto para añadir nuestras propiedades personalizadas
declare module "next-auth" {
  /**
   * El objeto de Sesión que se devuelve al cliente.
   */
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"]; // Mantiene las propiedades originales (name, email, image)
  }

  /**
   * El objeto de Usuario que se devuelve desde la función `authorize`.
   */
  interface User extends DefaultUser {
    role: Role;
  }
}

declare module "next-auth/jwt" {
  /**
   * El token JWT que se usa para la sesión.
   */
  interface JWT extends DefaultJWT {
    id: string;
    role: Role;
  }
}
