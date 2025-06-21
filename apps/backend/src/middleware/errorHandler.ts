import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../types';
import { Prisma } from '@prisma/client';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  console.error('ERROR STACK: ', err.stack);

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  // Convert well-known Prisma errors to user-friendly messages
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': // Unique constraint failed
        return res.status(400).json({ success: false, error: 'Resource already exists' });
      case 'P2025': // Record to update not found
        return res.status(404).json({ success: false, error: 'Requested resource not found' });
      default:
        return res.status(400).json({ success: false, error: 'Database validation error' });
    }
  }

  return res.status(500).json({
    success: false,
    error: 'Internal Server Error',
  });
}; 