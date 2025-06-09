import { Response } from 'express';
import { prisma, socketService } from '../index';
import { AuthenticatedRequest, ApiResponse } from '../types';

export class MessageController {
  // Получить сообщения для сервера
  static async getMessages(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    try {
      const userId = req.user?.id;
      const serverId = req.params.serverId;
      const { limit = 50, before } = req.query;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      // Проверяем доступ к серверу
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
          error: 'You do not have access to this server'
        });
      }

      const messages = await prisma.message.findMany({
        where: {
          serverId,
          ...(before && {
            createdAt: {
              lt: new Date(before as string)
            }
          })
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: Number(limit)
      });

      return res.json({
        success: true,
        data: messages.reverse() // Возвращаем в хронологическом порядке
      });
    } catch (error) {
      console.error('Error fetching messages:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Отправить сообщение
  static async sendMessage(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    try {
      const userId = req.user?.id;
      const serverId = req.params.serverId;
      const { content } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Message content is required'
        });
      }

      if (content.length > 2000) {
        return res.status(400).json({
          success: false,
          error: 'Message content cannot exceed 2000 characters'
        });
      }

      // Проверяем доступ к серверу
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
          error: 'You do not have access to this server'
        });
      }

      const message = await prisma.message.create({
        data: {
          content: content.trim(),
          authorId: userId,
          serverId
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          }
        }
      });

      // Уведомляем всех на сервере через сокет
      socketService.notifyNewMessage(serverId, message);

      return res.status(201).json({
        success: true,
        data: message,
        message: 'Message sent successfully'
      });
    } catch (error) {
      console.error('Error sending message:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Редактировать сообщение
  static async editMessage(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    try {
      const userId = req.user?.id;
      const messageId = req.params.messageId;
      const { content } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Message content is required'
        });
      }

      if (content.length > 2000) {
        return res.status(400).json({
          success: false,
          error: 'Message content cannot exceed 2000 characters'
        });
      }

      // Проверяем, что сообщение принадлежит пользователю
      const existingMessage = await prisma.message.findUnique({
        where: { id: messageId }
      });

      if (!existingMessage) {
        return res.status(404).json({
          success: false,
          error: 'Message not found'
        });
      }

      if (existingMessage.authorId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'You can only edit your own messages'
        });
      }

      const updatedMessage = await prisma.message.update({
        where: { id: messageId },
        data: {
          content: content.trim()
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          }
        }
      });

      // Уведомляем всех на сервере через сокет
      socketService.notifyUpdatedMessage(updatedMessage.serverId, updatedMessage);

      return res.json({
        success: true,
        data: updatedMessage,
        message: 'Message updated successfully'
      });
    } catch (error) {
      console.error('Error editing message:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Удалить сообщение
  static async deleteMessage(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    try {
      const userId = req.user?.id;
      const messageId = req.params.messageId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      // Проверяем права на удаление
      const existingMessage = await prisma.message.findUnique({
        where: { id: messageId },
        include: {
          server: true
        }
      });

      if (!existingMessage) {
        return res.status(404).json({
          success: false,
          error: 'Message not found'
        });
      }
      
      const serverId = existingMessage.server.id; // Сохраняем ID сервера перед удалением
      const isAuthor = existingMessage.authorId === userId;
      const isServerOwner = existingMessage.server.ownerId === userId;

      if (!isAuthor && !isServerOwner) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to delete this message'
        });
      }

      await prisma.message.delete({
        where: { id: messageId }
      });

      // Уведомляем всех на сервере через сокет
      socketService.notifyDeletedMessage(serverId, messageId);

      return res.json({
        success: true,
        message: 'Message deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
} 