import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../types';

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

  // Handle other types of errors if necessary, e.g., Prisma errors
  // if (err instanceof Prisma.PrismaClientKnownRequestError) { ... }

  return res.status(500).json({
    success: false,
    error: 'Internal Server Error',
  });
}; 