import { router } from '../trpc';
import { r2Router } from './r2Router';

export const appRouter = router({
  r2: r2Router,
});

// Export type definition of API
export type AppRouter = typeof appRouter;
