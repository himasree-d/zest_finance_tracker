import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, refresh, logout, getMe } from '../controllers/authController';
import { authenticate } from '../middleware/authenticate';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts, please try again later.' }
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Too many accounts created, please try again later.' }
});

export const authRouter = Router();

authRouter.post('/register', registerLimiter, register);
authRouter.post('/login', loginLimiter, login);
authRouter.post('/refresh', refresh);
authRouter.post('/logout', authenticate, logout);
authRouter.get('/me', authenticate, getMe);
