import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const userRouter = router({
  getAll: publicProcedure.query(async () => {
    return prisma.user.findMany();
  }),
  create: publicProcedure.input(
    z.object({
      name: z.string(),
      email: z.string().email(),
      password: z.string(),
    })
  ).mutation(async ({ input }) => {
    return prisma.user.create({ data: input });
  }),
});
