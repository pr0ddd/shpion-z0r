import { Response } from 'express';
import { prisma } from '../index';
import { AuthenticatedRequest, ApiResponse } from '../types';

export class InviteController {
  // Использовать код-приглашение для вступления в сервер
  static async useInvite(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    try {
      const userId = req.user?.id;
      const { inviteCode } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const server = await prisma.server.findUnique({
        where: { inviteCode },
        include: {
          members: {
            where: { userId }
          }
        }
      });

      if (!server) {
        return res.status(404).json({
          success: false,
          error: 'Invite code is invalid or has expired'
        });
      }

      if (server.members.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'You are already a member of this server'
        });
      }

      const updatedServer = await prisma.server.update({
        where: { id: server.id },
        data: {
          members: {
            create: {
              userId: userId,
              role: 'MEMBER'
            }
          }
        },
        include: {
          members: true
        }
      });

      return res.json({
        success: true,
        data: updatedServer,
        message: `Successfully joined server ${server.name}`
      });
    } catch (error) {
      console.error('Error using invite:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Получить публичную информацию о сервере по коду приглашения
  static async getPublicInviteInfo(req: any, res: Response<ApiResponse>) {
    try {
      const { inviteCode } = req.params;

      if (!inviteCode) {
        return res.status(400).json({
          success: false,
          error: 'Invite code is required'
        });
      }

      const server = await prisma.server.findUnique({
        where: { inviteCode },
        select: {
          id: true,
          name: true,
          icon: true,
          _count: {
            select: {
              members: true,
            }
          }
        }
      });

      if (!server) {
        return res.status(404).json({
          success: false,
          error: 'Invite code is invalid'
        });
      }

      return res.json({
        success: true,
        data: {
          id: server.id,
          name: server.name,
          icon: server.icon,
          memberCount: server._count.members,
        }
      });

    } catch (error) {
      console.error('Error fetching public invite info:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
  
  // Сгенерировать новый код приглашения
  static async regenerateInviteCode(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    try {
      const userId = req.user?.id;
      const { serverId } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated'
        });
      }

      const server = await prisma.server.findFirst({
        where: {
          id: serverId,
          ownerId: userId // Только владелец может менять код
        }
      });

      if (!server) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to change the invite code for this server'
        });
      }
      
      const { v4: uuidv4 } = await import('uuid');
      const newInviteCode = uuidv4();

      const updatedServer = await prisma.server.update({
        where: { id: serverId },
        data: { inviteCode: newInviteCode },
        select: {
          inviteCode: true
        }
      });

      return res.json({
        success: true,
        data: updatedServer,
        message: "New invite code has been generated"
      });

    } catch (error) {
      console.error('Error regenerating invite code:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
} 