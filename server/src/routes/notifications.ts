import { Router } from 'express';
import {
  getNotifications, markRead, markAllRead,
  deleteNotification, clearAll
} from '../controllers/notificationsController';
import { authenticate } from '../middleware/authenticate';

export const notificationsRouter = Router();
notificationsRouter.use(authenticate);

notificationsRouter.get('/', getNotifications);
notificationsRouter.put('/read-all', markAllRead);
notificationsRouter.put('/:id/read', markRead);
notificationsRouter.delete('/:id', deleteNotification);
notificationsRouter.delete('/', clearAll);
