import { Router } from 'express';
import {
  getTransactions, createTransaction, updateTransaction,
  deleteTransaction, bulkDeleteTransactions, exportTransactions, bulkCreateTransactions
} from '../controllers/transactionsController';
import { authenticate } from '../middleware/authenticate';

export const transactionsRouter = Router();
transactionsRouter.use(authenticate);

transactionsRouter.get('/export', exportTransactions);
transactionsRouter.get('/', getTransactions);
transactionsRouter.post('/', createTransaction);
transactionsRouter.post('/bulk', bulkCreateTransactions);
transactionsRouter.put('/:id', updateTransaction);
transactionsRouter.delete('/bulk', bulkDeleteTransactions);
transactionsRouter.delete('/:id', deleteTransaction);
