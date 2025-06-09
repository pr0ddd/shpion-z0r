import { Response } from 'express';
import { prisma } from '../index';
import { AuthenticatedRequest, ApiResponse } from '../types';

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
          },
          _count: {
            select: {
              members: true,
              messages: true
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

      const { name } = req.body;
      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Server name is required'
        });
      }

      const server = await prisma.server.create({
        data: {
          name,
          ownerId: userId,
          members: {
            create: {
              userId,
              role: 'ADMIN'
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

      const member = await prisma.member.findUnique({
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
                  avatar: true
                }
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
      const { serverId } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const server = await prisma.server.findUnique({
        where: { id: serverId },
      });

      if (!server) {
        return res.status(404).json({
          success: false,
          error: 'Server not found'
        });
      }

      if (server.ownerId === userId) {
        return res.status(400).json({
          success: false,
          error: 'Owner cannot leave the server. You must delete it instead.'
        });
      }

      await prisma.member.delete({
        where: {
          userId_serverId: {
            userId,
            serverId
          }
        }
      });

      return res.json({
        success: true,
        message: `Successfully left server ${server.name}`
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
      const serverId = req.params.serverId;

      const members = await prisma.member.findMany({
        where: { serverId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          }
        }
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