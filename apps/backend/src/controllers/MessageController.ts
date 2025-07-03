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
        author: { select: { id: true, username: true, avatar: true } },
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
    const { content, replyToId } = req.body;
    const userId = req.user!.id;

    if (!content) {
      throw new ApiError(400, "Message content cannot be empty");
    }

    if (replyToId) {
      const parent = await prisma.message.findUnique({ where: { id: replyToId } });
      if (!parent || parent.serverId !== serverId) {
        throw new ApiError(400, 'Invalid replyToId');
      }
    }

    const member = await prisma.member.findUnique({
      where: { userId_serverId: { userId, serverId } },
    });

    if (!member) {
      throw new ApiError(403, "You are not a member of this server");
    }

    // For user message block
    const createArgs1: any = {
      data: { content, serverId, authorId: userId, replyToId },
      include: {
        author: { select: { id: true, username: true, avatar: true } },
        replyTo: { include: { author: { select: { id: true, username: true, avatar: true } } } },
      },
    };
    const message = await (prisma.message as any).create(createArgs1);

    // Отправляем сообщение через сокеты всем участникам сервера
    socketService.notifyNewMessage(serverId, message);

    res.status(201).json({ success: true, data: message });
  }

  // Отправить сообщение от бота (LLM)
  static async sendBotMessage(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    const { serverId } = req.params;
    const { content, replyToId } = req.body;
    const userId = req.user!.id;

    if (!content) {
      throw new ApiError(400, 'Message content cannot be empty');
    }

    if (replyToId) {
      const parent = await prisma.message.findUnique({ where: { id: replyToId } });
      if (!parent || parent.serverId !== serverId) {
        throw new ApiError(400, 'Invalid replyToId');
      }
    }

    // Проверяем, что отправитель является участником сервера
    const member = await prisma.member.findUnique({
      where: { userId_serverId: { userId, serverId } },
    });

    if (!member) {
      throw new ApiError(403, 'You are not a member of this server');
    }

    // --- Upsert бота ---
    // Позволяем задать через переменные окружения, но если их нет — используем
    // безопасные значения по умолчанию, чтобы прод-деплой не падал ошибкой 500.

    const BOT_USER_ID = process.env.BOT_USER_ID ?? 'ollama-bot';
    const BOT_USERNAME = process.env.BOT_USERNAME ?? 'Shpion AI';
    const BOT_AVATAR = process.env.BOT_AVATAR_URL ?? '/bot-avatar.png';

    if (!process.env.BOT_USER_ID || !process.env.BOT_USERNAME || !process.env.BOT_AVATAR_URL) {
      // Логируем предупреждение, но не прерываем работу.
      console.warn('[Warning] BOT_* env vars are not fully set; using default values');
    }

    await prisma.user.upsert({
      where: { id: BOT_USER_ID },
      create: {
        id: BOT_USER_ID,
        email: `${BOT_USER_ID}@local`,
        username: BOT_USERNAME,
        password: '!', // never used
        avatar: BOT_AVATAR,
      },
      update: {
        username: BOT_USERNAME,
        avatar: BOT_AVATAR,
      },
    });

    // Ensure bot is a member of server (role MEMBER)
    await prisma.member.upsert({
      where: { userId_serverId: { userId: BOT_USER_ID, serverId } },
      create: { userId: BOT_USER_ID, serverId },
      update: {},
    });

    // For bot message block
    const createArgs2: any = {
      data: { content, serverId, authorId: BOT_USER_ID, replyToId },
      include: {
        author: { select: { id: true, username: true, avatar: true } },
        replyTo: { include: { author: { select: { id: true, username: true, avatar: true } } } },
      },
    };
    const message = await (prisma.message as any).create(createArgs2);

    socketService.notifyNewMessage(serverId, message);

    return res.status(201).json({ success: true, data: message });
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