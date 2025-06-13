import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { ApiResponse } from '../types';
import { ApiError } from '../utils/ApiError';

export class UserController {
    static async getUserById(req: Request, res: Response<ApiResponse>) {
        const { userId } = req.params;
      const user = await prisma.user.findUnique({
        where: { id: userId },
            select: { id: true, username: true, avatar: true, createdAt: true },
      });

      if (!user) {
            throw new ApiError(404, 'User not found');
      }
        res.json({ success: true, data: user });
    }

    static async getAllUsers(_req: Request, res: Response<ApiResponse>) {
        const users = await prisma.user.findMany({
            select: { id: true, username: true, avatar: true, createdAt: true },
        });
        res.json({ success: true, data: users });
  }
} 