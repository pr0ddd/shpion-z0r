import prisma from '../lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { ApiError } from '../utils/ApiError';

export class ServerController {
  // Получить все серверы пользователя
  static async getServers(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    const userId = req.user!.id;
    const servers = await prisma.server.findMany({
      where: { members: { some: { userId } } },
      include: { _count: { select: { members: true } } },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data: servers });
  }

  // Создать новый сервер
  static async createServer(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    const { name } = req.body;
    const userId = req.user!.id;

    if (!name) {
      throw new ApiError(400, 'Server name is required');
    }

    const server = await prisma.server.create({
      data: {
        name,
        ownerId: userId,
        inviteCode: uuidv4(),
        members: { create: [{ userId, role: 'ADMIN' }] },
      },
    });
    res.status(201).json({ success: true, data: server });
  }

  // Получить информацию о сервере
  static async getServer(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    const userId = req.user?.id;
    const serverId = req.params.serverId;

    if (!userId) {
      throw new ApiError(401, 'User not authenticated');
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
      throw new ApiError(403, 'You are not a member of this server');
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
  }

  // Покинуть сервер
  static async leaveServer(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    const { serverId } = req.params;
    const userId = req.user!.id;

    const server = await prisma.server.findFirst({
      where: { 
        id: serverId,
        members: {
          some: { userId }
        }
      },
    });

    if (!server) {
      throw new ApiError(404, "Server not found or you are not a member");
    }

    if (server.ownerId === userId) {
      throw new ApiError(400, "Owner cannot leave the server. You must delete it instead.");
    }

    await prisma.member.delete({
      where: { userId_serverId: { userId, serverId } },
    });
    
    res.json({ success: true, message: 'Successfully left the server' });
  }

  // Получить участников сервера
  static async getServerMembers(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    const { serverId } = req.params;
    const userId = req.user!.id;

    const member = await prisma.member.findUnique({
      where: { userId_serverId: { userId, serverId } },
    });

    if (!member) {
      throw new ApiError(403, "You are not a member of this server");
    }

    const server = await prisma.server.findUnique({
      where: { id: serverId },
      include: { members: { include: { user: true } } },
    });

    if (!server) {
      throw new ApiError(404, "Server not found");
    }
    res.json({ success: true, data: server.members });
  }
}