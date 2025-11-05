import { Request, Response, NextFunction } from 'express';

export function dbErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
    console.error('Database connection error:', err.message);
    return res.status(503).json({
      success: false,
      error: 'Database temporarily unavailable',
      message: 'Please try again in a moment'
    });
  }

  if (err.message && err.message.includes('Connection terminated')) {
    console.error('Database connection timeout:', err.message);
    return res.status(503).json({
      success: false,
      error: 'Database connection timeout',
      message: 'Please try again'
    });
  }

  next(err);
}