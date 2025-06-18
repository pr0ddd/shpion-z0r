import prisma from '../lib/prisma';
import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { socketService } from '../index';
import { ApiError } from '../utils/ApiError';

export class MessageController {
  // Получить сообщения для сервера
  static async getMessages(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    const { serverId } = req.params;
    const userId = req.user!.id;
    const { before } = req.query as { before?: string };

    const PAGE_SIZE = 50;

    const member = await prisma.member.findUnique({
      where: { userId_serverId: { userId, serverId } },
    });

    if (!member) {
      throw new ApiError(403, "You are not a member of this server");
    }

    const where: any = { serverId };
    if (before) {
      // fetch messages strictly older than provided cursor
      where.createdAt = { lt: new Date(before) };
    }

    const fetched = await prisma.message.findMany({
      where,
      include: {
        author: {
          select: { id: true, username: true, avatar: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
    });

    // Return in chronological (asc) order so UI can simply append/prepend.
    const messages = fetched.reverse();

    res.json({ success: true, data: messages });
  }

  // Отправить сообщение
  static async sendMessage(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    const { serverId } = req.params;
      const { content } = req.body;
    const userId = req.user!.id;

    if (!content) {
      throw new ApiError(400, "Message content cannot be empty");
      }

      const member = await prisma.member.findUnique({
      where: { userId_serverId: { userId, serverId } },
      });

      if (!member) {
      throw new ApiError(403, "You are not a member of this server");
      }

      const message = await prisma.message.create({
      data: { content, serverId, authorId: userId },
      include: { author: { select: { id: true, username: true, avatar: true } } },
      });

    // Отправляем сообщение через сокеты всем участникам сервера
      socketService.notifyNewMessage(serverId, message);

    res.status(201).json({ success: true, data: message });
  }

  // Редактировать сообщение
  static async editMessage(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    const { messageId } = req.params;
      const { content } = req.body;
    const userId = req.user!.id;
    
    if (!content) {
      throw new ApiError(400, "Message content cannot be empty");
      }

      const existingMessage = await prisma.message.findUnique({
      where: { id: messageId },
      });

      if (!existingMessage) {
      throw new ApiError(404, "Message not found");
      }

      if (existingMessage.authorId !== userId) {
      throw new ApiError(403, "You are not the author of this message");
      }

      const updatedMessage = await prisma.message.update({
        where: { id: messageId },
      data: { content, updatedAt: new Date() },
      include: { author: { select: { id: true, username: true, avatar: true } } },
    });

      socketService.notifyUpdatedMessage(updatedMessage.serverId, updatedMessage);

    res.json({ success: true, data: updatedMessage });
  }

  // Удалить сообщение
  static async deleteMessage(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    const { messageId } = req.params;
    const userId = req.user!.id;
    
      const existingMessage = await prisma.message.findUnique({
        where: { id: messageId },
      });

      if (!existingMessage) {
      throw new ApiError(404, "Message not found");
      }
      
    // Позволяем удалять сообщения либо автору, либо админу сервера
    const member = await prisma.member.findFirst({
      where: { serverId: existingMessage.serverId, userId: userId },
    });

    if (existingMessage.authorId !== userId && member?.role !== 'ADMIN') {
      throw new ApiError(403, "You do not have permission to delete this message");
      }
    
    const serverId = existingMessage.serverId;

      await prisma.message.delete({
      where: { id: messageId },
      });

      socketService.notifyDeletedMessage(serverId, messageId);

    res.status(204).send();
  }
} 