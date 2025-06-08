import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest, ApiResponse } from '../types';

const prisma = new PrismaClient();

export class ServerController {
  // Получить все серверы пользователя
  static async getUserServers(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const servers = await prisma.server.findMany({
        where: {
          members: {
            some: {
              userId: userId
            }
          }
        },
        include: {
          _count: {
            select: {
              members: true,
              messages: true,
              streams: true
            }
          }
        }
      });

      return res.json({
        success: true,
        data: servers
      });
    } catch (error) {
      console.error('Error fetching user servers:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Создать новый сервер
  static async createServer(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const { name, description } = req.body;
      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Server name is required'
        });
      }

      // Создаем сервер с владельцем
      const server = await prisma.server.create({
        data: {
          name,
          description,
          ownerId: userId,
          members: {
            create: {
              userId,
              roleType: 'OWNER',
              canAccessTextChat: true,
              canAccessVoiceChat: true,
              canAccessStreams: true,
              canCreateStreams: true
            }
          }
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatar: true
                }
              }
            }
          }
        }
      });

      return res.status(201).json({
        success: true,
        data: server,
        message: 'Server created successfully'
      });
    } catch (error) {
      console.error('Error creating server:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Получить информацию о сервере
  static async getServer(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    try {
      const userId = req.user?.id;
      const serverId = req.params.serverId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      // Проверяем, состоит ли пользователь в сервере
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

      const server = await prisma.server.findUnique({
        where: { id: serverId },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                  status: true
                }
              }
            }
          },
          streams: {
            where: { status: 'LIVE' },
            include: {
              streamer: {
                select: {
                  id: true,
                  username: true,
                  avatar: true
                }
              },
              _count: {
                select: { viewers: true }
              }
            }
          }
        }
      });

      return res.json({
        success: true,
        data: server
      });
    } catch (error) {
      console.error('Error fetching server:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Покинуть сервер
  static async leaveServer(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    try {
      const userId = req.user?.id;
      const serverId = req.params.serverId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      // Проверяем, что пользователь не владелец
      const member = await prisma.serverMember.findUnique({
        where: {
          userId_serverId: {
            userId,
            serverId
          }
        }
      });

      if (!member) {
        return res.status(404).json({
          success: false,
          error: 'You are not a member of this server'
        });
      }

      if (member.roleType === 'OWNER') {
        return res.status(400).json({
          success: false,
          error: 'Owner cannot leave the server. Transfer ownership first or delete the server.'
        });
      }

      await prisma.serverMember.delete({
        where: {
          userId_serverId: {
            userId,
            serverId
          }
        }
      });

      return res.json({
        success: true,
        message: 'Successfully left the server'
      });
    } catch (error) {
      console.error('Error leaving server:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Получить участников сервера
  static async getServerMembers(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    try {
      const userId = req.user?.id;
      const serverId = req.params.serverId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      // Проверяем, состоит ли пользователь в сервере
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

      const members = await prisma.serverMember.findMany({
        where: { serverId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
              status: true,
              lastSeen: true
            }
          }
        },
        orderBy: [
          { roleType: 'desc' }, // OWNER, ADMIN, MODERATOR, MEMBER
          { user: { displayName: 'asc' } }
        ]
      });

      return res.json({
        success: true,
        data: members
      });
    } catch (error) {
      console.error('Error fetching server members:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
} 