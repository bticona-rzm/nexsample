import { type inferAsyncReturnType } from '@trpc/server';
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import { prisma } from '@/server/db/client';

// Crear el contexto base (puede incluir autenticación más adelante)
export const createTRPCContext = (opts: CreateNextContextOptions) => {
  return {
    prisma,
    req: opts.req,
    res: opts.res,
  };
};

export type TRPCContext = inferAsyncReturnType<typeof createTRPCContext>;
