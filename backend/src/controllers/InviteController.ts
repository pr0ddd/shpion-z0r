import prisma from '../lib/prisma';
import { Request, Response } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { ApiError } from '../utils/ApiError';
import { v4 as uuidv4 } from 'uuid';

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
  static async getPublicInviteInfo(req: Request, res: Response<ApiResponse>) {
      const { inviteCode } = req.params;
      const server = await prisma.server.findUnique({
        where: { inviteCode },
        select: {
          id: true,
          name: true,
          icon: true,
        _count: { select: { members: true } },
      },
      });

      if (!server) {
      throw new ApiError(404, 'Invalid invite code');
      }

    res.json({
        success: true,
        data: {
          id: server.id,
          name: server.name,
          icon: server.icon,
          memberCount: server._count.members,
      },
      });
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

  static async joinServerWithInviteCode(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    const { inviteCode } = req.params;
    const userId = req.user!.id;

    const serverToJoin = await prisma.server.findUnique({
      where: { inviteCode },
      include: { members: { where: { userId } } },
    });

    if (!serverToJoin) {
      throw new ApiError(404, 'Invalid invite code');
    }

    if (serverToJoin.members.length > 0) {
      throw new ApiError(400, 'You are already a member of this server');
    }

    const updatedServer = await prisma.server.update({
      where: { id: serverToJoin.id },
      data: { members: { create: { userId } } },
    });

    res.json({ success: true, data: updatedServer });
  }

  static async refreshInviteCodeForServer(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    const { serverId } = req.params;
    const userId = req.user!.id;

    const server = await prisma.server.findUnique({
      where: { id: serverId, ownerId: userId },
    });

    if (!server) {
      throw new ApiError(403, 'You are not the owner of this server or server does not exist');
    }

    const updatedServer = await prisma.server.update({
      where: { id: serverId },
      data: { inviteCode: uuidv4() },
    });

    res.json({ success: true, data: updatedServer });
  }
} 