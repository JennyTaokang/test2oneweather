import { Router } from 'express';
import { healthRouter, handleHealthCheck, getHealthStatus } from './health.ts';

export * from './health.ts';

export const apiRouter = Router();

// Mount /api/health
apiRouter.use('/health', healthRouter);

export default apiRouter;
