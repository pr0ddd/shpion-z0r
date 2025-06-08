import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { socketService } from '../index';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

const prisma = new PrismaClient();

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
          serverMembers: {
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
          servers: user.serverMembers.map((member: any) => member.server),
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
} 