import { Router } from 'express';
import { getDashboard } from '../controllers/dashboardController';
import { authenticate } from '../middleware/authenticate';

export const dashboardRouter = Router();
dashboardRouter.use(authenticate);
dashboardRouter.get('/', getDashboard);
