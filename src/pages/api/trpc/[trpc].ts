import { createNextApiHandler } from '@trpc/server/adapters/next';
import { appRouter } from '@/server/routers';
import { createTRPCContext } from '@/server/context';

// Next.js API handler para tRPC
export default createNextApiHandler({
  router: appRouter,
  createContext: createTRPCContext,
});