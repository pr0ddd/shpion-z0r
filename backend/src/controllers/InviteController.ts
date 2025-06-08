import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest, ApiResponse } from '../types';

const prisma = new PrismaClient();

export class InviteController {
  // Получить приглашения сервера
  static async getServerInvites(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    try {
      const userId = req.user?.id;
      const serverId = req.params.serverId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      // Проверяем, что пользователь состоит в сервере
      const member = await prisma.serverMember.findUnique({
        where: {
          userId_serverId: {
            userId,
            serverId
          }
        }
      });

      if (!member) {
        return res.status(403).json({
          success: false,
          error: 'You are not a member of this server'
        });
      }

      const invites = await prisma.serverInvite.findMany({
        where: { 
          serverId,
          OR: [
            { inviterId: userId }, // Приглашения созданные пользователем
            { inviteeId: userId }, // Приглашения адресованные пользователю
            { inviteeId: null }    // Публичные приглашения
          ]
        },
        include: {
          inviter: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Форматируем для frontend
      const formattedInvites = invites.map(invite => ({
        id: invite.id,
        code: invite.code,
        serverId: invite.serverId,
        creatorId: invite.inviterId,
        maxUses: invite.maxUses,
        uses: invite.usedCount,
        expiresAt: invite.expiresAt?.toISOString(),
        createdAt: invite.createdAt.toISOString(),
        isActive: invite.status === 'PENDING' && 
                 (!invite.expiresAt || invite.expiresAt > new Date()) &&
                 (!invite.maxUses || invite.usedCount < invite.maxUses)
      }));

      return res.json({
        success: true,
        data: formattedInvites
      });
    } catch (error) {
      console.error('Error fetching server invites:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Создать приглашение
  static async createInvite(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    try {
      const userId = req.user?.id;
      const serverId = req.params.serverId;
      const { maxUses, expiresInHours } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      // Проверяем, что пользователь состоит в сервере
      const member = await prisma.serverMember.findUnique({
        where: {
          userId_serverId: {
            userId,
            serverId
          }
        }
      });

      if (!member) {
        return res.status(403).json({
          success: false,
          error: 'You are not a member of this server'
        });
      }

      const expiresAt = expiresInHours 
        ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000)
        : null;

      const invite = await prisma.serverInvite.create({
        data: {
          serverId,
          inviterId: userId,
          maxUses: maxUses || null,
          expiresAt,
          status: 'PENDING',
          type: 'LINK' // Приглашение по ссылке
        }
      });

      // Форматируем для frontend
      const formattedInvite = {
        id: invite.id,
        code: invite.code,
        serverId: invite.serverId,
        creatorId: invite.inviterId,
        maxUses: invite.maxUses,
        uses: invite.usedCount,
        expiresAt: invite.expiresAt?.toISOString(),
        createdAt: invite.createdAt.toISOString(),
        isActive: true
      };

      return res.status(201).json({
        success: true,
        data: formattedInvite,
        message: 'Invite created successfully'
      });
    } catch (error) {
      console.error('Error creating invite:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Удалить приглашение
  static async deleteInvite(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    try {
      const userId = req.user?.id;
      const inviteId = req.params.inviteId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      // Получаем приглашение
      const invite = await prisma.serverInvite.findUnique({
        where: { id: inviteId },
        include: {
          server: {
            include: {
              members: {
                where: { userId }
              }
            }
          }
        }
      });

      if (!invite) {
        return res.status(404).json({
          success: false,
          error: 'Invite not found'
        });
      }

      const member = invite.server.members[0];
      const canDelete = invite.inviterId === userId || 
                       member?.roleType === 'OWNER' || 
                       member?.roleType === 'ADMIN';

      if (!canDelete) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to delete this invite'
        });
      }

      await prisma.serverInvite.delete({
        where: { id: inviteId }
      });

      return res.json({
        success: true,
        message: 'Invite deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting invite:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Использовать приглашение
  static async useInvite(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    try {
      const userId = req.user?.id;
      const inviteCode = req.params.inviteCode;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      // Получаем приглашение
      const invite = await prisma.serverInvite.findUnique({
        where: { code: inviteCode },
        include: {
          server: {
            include: {
              members: {
                where: { userId }
              }
            }
          }
        }
      });

      if (!invite) {
        return res.status(404).json({
          success: false,
          error: 'Invalid invite code'
        });
      }

      // Проверяем, что пользователь не состоит в сервере
      if (invite.server.members.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'You are already a member of this server'
        });
      }

      // Проверяем валидность приглашения
      if (invite.status !== 'PENDING') {
        return res.status(400).json({
          success: false,
          error: 'Invite is no longer valid'
        });
      }

      if (invite.expiresAt && invite.expiresAt < new Date()) {
        return res.status(400).json({
          success: false,
          error: 'Invite has expired'
        });
      }

      if (invite.maxUses && invite.usedCount >= invite.maxUses) {
        return res.status(400).json({
          success: false,
          error: 'Invite has reached maximum uses'
        });
      }

      // Добавляем пользователя на сервер
      await prisma.serverMember.create({
        data: {
          userId,
          serverId: invite.serverId,
          roleType: 'MEMBER',
          canAccessTextChat: invite.grantTextChat,
          canAccessVoiceChat: invite.grantVoiceChat,
          canAccessStreams: invite.grantStreams,
          canCreateStreams: invite.grantCreateStreams
        }
      });

      // Увеличиваем счетчик использований
      await prisma.serverInvite.update({
        where: { id: invite.id },
        data: { usedCount: { increment: 1 } }
      });

      return res.json({
        success: true,
        data: invite.server,
        message: 'Successfully joined the server'
      });
    } catch (error) {
      console.error('Error using invite:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Получить информацию о приглашении (без использования)
  static async getInviteInfo(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    try {
      const userId = req.user?.id;
      const inviteCode = req.params.inviteCode;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      // Получаем приглашение
      const invite = await prisma.serverInvite.findUnique({
        where: { code: inviteCode },
        include: {
          server: {
            select: {
              id: true,
              name: true,
              description: true,
              icon: true,
              _count: {
                select: { members: true }
              }
            }
          },
          inviter: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          }
        }
      });

      if (!invite) {
        return res.status(404).json({
          success: false,
          error: 'Invalid invite code'
        });
      }

      // Проверяем, состоит ли пользователь уже в сервере
      const existingMember = await prisma.serverMember.findUnique({
        where: {
          userId_serverId: {
            userId,
            serverId: invite.serverId
          }
        }
      });

      // Проверяем валидность приглашения
      const isValid = invite.status === 'PENDING' && 
                     (!invite.expiresAt || invite.expiresAt > new Date()) &&
                     (!invite.maxUses || invite.usedCount < invite.maxUses);

      return res.json({
        success: true,
        data: {
          invite: {
            id: invite.id,
            code: invite.code,
            expiresAt: invite.expiresAt?.toISOString(),
            maxUses: invite.maxUses,
            usedCount: invite.usedCount,
            isValid
          },
          server: invite.server,
          inviter: invite.inviter,
          isAlreadyMember: !!existingMember
        }
      });
    } catch (error) {
      console.error('Error getting invite info:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Получить публичную информацию о приглашении (без авторизации)
  static async getPublicInviteInfo(req: any, res: Response<ApiResponse>) {
    try {
      const inviteCode = req.params.inviteCode;

      // Получаем приглашение
      const invite = await prisma.serverInvite.findUnique({
        where: { code: inviteCode },
        include: {
          server: {
            select: {
              id: true,
              name: true,
              description: true,
              icon: true,
              _count: {
                select: { members: true }
              }
            }
          },
          inviter: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          }
        }
      });

      if (!invite) {
        return res.status(404).json({
          success: false,
          error: 'Invalid invite code'
        });
      }

      // Проверяем валидность приглашения
      const isValid = invite.status === 'PENDING' && 
                     (!invite.expiresAt || invite.expiresAt > new Date()) &&
                     (!invite.maxUses || invite.usedCount < invite.maxUses);

      return res.json({
        success: true,
        data: {
          invite: {
            id: invite.id,
            code: invite.code,
            expiresAt: invite.expiresAt?.toISOString(),
            maxUses: invite.maxUses,
            usedCount: invite.usedCount,
            isValid
          },
          server: invite.server,
          inviter: invite.inviter,
          requiresAuth: true // Показываем что нужна авторизация
        }
      });
    } catch (error) {
      console.error('Error getting public invite info:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
} 