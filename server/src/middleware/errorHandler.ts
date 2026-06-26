import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError | ZodError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const message = err.errors.map((e) => e.message).join(', ');
    res.status(400).json({ error: message });
    return;
  }

  const appErr = err as AppError;
  const statusCode = appErr.statusCode ?? 500;
  const message = appErr.isOperational ? appErr.message : 'Internal server error';

  if (process.env.NODE_ENV !== 'production') {
    console.error('[ERROR]', err.message, err.stack);
  }

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

export class HttpError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}