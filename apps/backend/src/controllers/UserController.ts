import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { ApiResponse } from '../types';
import { ApiError } from '../utils/ApiError';
import { socketService } from '../index';
import { AuthenticatedRequest } from '../types';

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

  static async updateAvatar(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    const userId = req.user?.id;
    const { avatar } = req.body as { avatar?: string };

    if (!userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    if (!avatar || typeof avatar !== 'string' || avatar.length < 10) {
      throw new ApiError(400, 'Avatar is required');
    }

    // TODO: Add extra validation (size, mime-type) if needed

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { avatar },
      select: { id: true, username: true, email: true, avatar: true, createdAt: true },
    });

    // Broadcast to servers
    socketService.broadcastUserUpdated(userId);

    res.json({ success: true, data: updated });
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    const userId = req.user?.id;
    const { username } = req.body as { username?: string };

    if (!userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    if (!username || username.length < 3) {
      throw new ApiError(400, 'Username must be at least 3 characters');
    }

    try {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { username },
        select: { id: true, username: true, email: true, avatar: true, createdAt: true },
      });

      socketService.broadcastUserUpdated(userId);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      if (err.code === 'P2002') {
        // unique constraint
        throw new ApiError(409, 'Username already taken');
      }
      throw err;
    }
  }
} 