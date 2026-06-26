import { Router } from 'express';
import { getInsights } from '../controllers/insightsController';
import { authenticate } from '../middleware/authenticate';

export const insightsRouter = Router();
insightsRouter.use(authenticate);

insightsRouter.get('/', getInsights);
