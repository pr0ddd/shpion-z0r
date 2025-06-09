import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { prisma, socketService } from '../index';

export class UserController {
  static async getCurrentUser(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated'
        });
      }

      // Получаем информацию о пользователе с серверами где он участник
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          servers: {
            include: {
              server: true
            }
          }
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Получаем текущий сервер пользователя из сокетов
      const currentServerId = socketService.getUserCurrentServer(user.id);
      
      return res.json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          servers: user.servers.map((member: any) => member.server),
          currentServerId: currentServerId // Теперь возвращаем реальный ID!
        }
      });
      
    } catch (error) {
      console.error('Error getting current user:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async getUsersByIds(req: AuthenticatedRequest, res: Response) {
    try {
      const { userIds } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'userIds must be a non-empty array'
        });
      }

      const users = await prisma.user.findMany({
        where: {
          id: { in: userIds }
        },
        select: {
          id: true,
          username: true,
          avatar: true,
        }
      });

      return res.json({
        success: true,
        data: users
      });

    } catch (error) {
      console.error('Error getting users by ids:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
} 