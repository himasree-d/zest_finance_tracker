import { Router } from 'express';
import {
  getBills, createBill, updateBill,
  deleteBill, markBillPaid
} from '../controllers/billsController';
import { authenticate } from '../middleware/authenticate';

export const billsRouter = Router();
billsRouter.use(authenticate);

billsRouter.get('/', getBills);
billsRouter.post('/', createBill);
billsRouter.put('/:id', updateBill);
billsRouter.delete('/:id', deleteBill);
billsRouter.post('/:id/pay', markBillPaid);
