import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { socketService } from '../index';
import MessageService from '../services/MessageService';

export class MessageController {
  // Получить сообщения для сервера
  static async getMessages(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    const { serverId } = req.params;
    const userId = req.user!.id;
    const { before } = req.query as { before?: string };

    const messages = await MessageService.getMessages(userId, serverId, before);
    res.json({ success: true, data: messages });
  }

  // Отправить сообщение
  static async sendMessage(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    const { serverId } = req.params;
    const { content, replyToId } = req.body;
    const userId = req.user!.id;

    const message = await MessageService.createMessage({
      userId,
      serverId,
      content,
      replyToId,
    });

    socketService.notifyNewMessage(serverId, message);
    res.status(201).json({ success: true, data: message });
  }

  // Отправить сообщение от бота (LLM)
  static async sendBotMessage(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    const { serverId } = req.params;
    const { content, replyToId } = req.body;

    const message = await MessageService.createBotMessage({ serverId, content, replyToId });

    socketService.notifyNewMessage(serverId, message);
    return res.status(201).json({ success: true, data: message });
  }

  // Редактировать сообщение
  static async editMessage(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user!.id;

    const updatedMessage = await MessageService.editMessage(userId, messageId, content);
    socketService.notifyUpdatedMessage(updatedMessage.serverId, updatedMessage);
    res.json({ success: true, data: updatedMessage });
  }

  // Удалить сообщение
  static async deleteMessage(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    const { messageId } = req.params;
    const userId = req.user!.id;

    const serverId = await MessageService.deleteMessage(userId, messageId);
    socketService.notifyDeletedMessage(serverId, messageId);
    res.status(204).send();
  }
} 