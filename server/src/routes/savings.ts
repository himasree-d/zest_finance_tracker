import { Router } from 'express';
import {
  getPots, createPot, updatePot,
  deletePot, addPotTransaction
} from '../controllers/savingsController';
import { authenticate } from '../middleware/authenticate';

export const savingsRouter = Router();
savingsRouter.use(authenticate);

savingsRouter.get('/', getPots);
savingsRouter.post('/', createPot);
savingsRouter.put('/:id', updatePot);
savingsRouter.delete('/:id', deletePot);
savingsRouter.post('/:id/transaction', addPotTransaction);
