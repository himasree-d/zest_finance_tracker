import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

dotenv.config();

import { connectDB } from './lib/db';
import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './routes/auth';
import { transactionsRouter } from './routes/transactions';
import { budgetsRouter } from './routes/budgets';
import { savingsRouter } from './routes/savings';
import { billsRouter } from './routes/bills';
import { dashboardRouter } from './routes/dashboard';
import { insightsRouter } from './routes/insights';
import { notificationsRouter } from './routes/notifications';
import { settingsRouter } from './routes/settings';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/budgets', budgetsRouter);
app.use('/api/savings', savingsRouter);
app.use('/api/bills', billsRouter);
app.use('/api/insights', insightsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/settings', settingsRouter);

// Error handler (must be last)
app.use(errorHandler);

async function main() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Zest API running on http://localhost:${PORT}`);
  });
}

main().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
