import { initTRPC } from '@trpc/server';
import superjson from 'superjson';

// Context type definition
export interface Context {
  // We'll add auth and other context here later if needed
}

// Helper function to create context
export const createContext = async (): Promise<Context> => {
  return {};
};

// Initialize tRPC
const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

// Export tRPC utilities
export const router = t.router;
export const procedure = t.procedure;
export const middleware = t.middleware;
