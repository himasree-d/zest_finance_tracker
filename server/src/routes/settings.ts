import { Router } from 'express';
import {
  getSettings, updateSettings, updateProfile,
  exportData, deleteAccount
} from '../controllers/settingsController';
import { authenticate } from '../middleware/authenticate';

export const settingsRouter = Router();
settingsRouter.use(authenticate);

settingsRouter.get('/', getSettings);
settingsRouter.put('/', updateSettings);
settingsRouter.put('/profile', updateProfile);
settingsRouter.get('/export', exportData);
settingsRouter.delete('/account', deleteAccount);
