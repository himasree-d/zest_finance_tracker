import { Router } from 'express';
import {
  getBudgets, createBudget, updateBudget,
  deleteBudget, getBudgetDetails
} from '../controllers/budgetsController';
import { authenticate } from '../middleware/authenticate';

export const budgetsRouter = Router();
budgetsRouter.use(authenticate);

budgetsRouter.get('/', getBudgets);
budgetsRouter.post('/', createBudget);
budgetsRouter.get('/:id', getBudgetDetails);
budgetsRouter.put('/:id', updateBudget);
budgetsRouter.delete('/:id', deleteBudget);
