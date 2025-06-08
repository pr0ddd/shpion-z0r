import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { LiveKitService } from '../services/LiveKitService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class LiveKitController {
  /**
   * Получить токен для подключения к голосовому чату сервера
   */
  static async getVoiceToken(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    try {
      const userId = req.user?.id;
      const username = req.user?.username;
      const serverId = req.params.serverId;

      if (!userId || !username) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      // Проверяем доступ к серверу и голосовому чату
      const member = await prisma.serverMember.findUnique({
        where: {
          userId_serverId: {
            userId,
            serverId
          }
        }
      });

      if (!member || !member.canAccessVoiceChat) {
        return res.status(403).json({
          success: false,
          error: 'You do not have access to voice chat on this server'
        });
      }

      // Создаем комнату если её нет
      const server = await prisma.server.findUnique({
        where: { id: serverId },
        select: { livekitVoiceRoom: true, maxVoiceUsers: true }
      });

      if (!server) {
        return res.status(404).json({
          success: false,
          error: 'Server not found'
        });
      }

      await LiveKitService.createVoiceRoom(server.livekitVoiceRoom, server.maxVoiceUsers);

      // Генерируем токен
      const tokenData = await LiveKitService.createVoiceToken(userId, serverId, username);

      // Обновляем статус пользователя как подключенного к голосовому чату
      await prisma.serverMember.update({
        where: {
          userId_serverId: {
            userId,
            serverId
          }
        },
        data: {
          voiceConnectedAt: new Date()
        }
      });

      return res.json({
        success: true,
        data: tokenData,
        message: 'Voice token generated successfully'
      });

    } catch (error) {
      console.error('Error generating voice token:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Покинуть голосовой чат
   */
  static async leaveVoice(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    try {
      const userId = req.user?.id;
      const serverId = req.params.serverId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      // Обновляем статус как отключенного от голосового чата
      await prisma.serverMember.update({
        where: {
          userId_serverId: {
            userId,
            serverId
          }
        },
        data: {
          voiceConnectedAt: null,
          isMuted: false,
          isDeafened: false,
          isSpeaking: false
        }
      });

      return res.json({
        success: true,
        message: 'Successfully left voice chat'
      });

    } catch (error) {
      console.error('Error leaving voice chat:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Получить токен для подключения к стриму
   */
  static async getStreamToken(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    try {
      const userId = req.user?.id;
      const username = req.user?.username;
      const streamId = req.params.streamId;

      if (!userId || !username) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      // Получаем информацию о стриме
      const stream = await prisma.stream.findUnique({
        where: { id: streamId },
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

      if (!stream) {
        return res.status(404).json({
          success: false,
          error: 'Stream not found'
        });
      }

      const member = stream.server.members[0];
      
      // Проверяем доступ к стримам
      if (!member || !member.canAccessStreams) {
        return res.status(403).json({
          success: false,
          error: 'You do not have access to streams on this server'
        });
      }

      const isStreamer = stream.streamerId === userId;

      // Создаем комнату для стрима если её нет
      await LiveKitService.createStreamRoom(stream.livekitStreamRoom, stream.maxViewers);

      // Генерируем токен
      const tokenData = await LiveKitService.createStreamToken(userId, streamId, username, isStreamer);

      // Если это зритель, добавляем запись в таблицу зрителей
      if (!isStreamer) {
        await prisma.streamViewer.upsert({
          where: {
            userId_streamId: {
              userId,
              streamId
            }
          },
          update: {
            joinedAt: new Date()
          },
          create: {
            userId,
            streamId,
            joinedAt: new Date()
          }
        });
      }

      return res.json({
        success: true,
        data: {
          ...tokenData,
          isStreamer,
          streamTitle: stream.title
        },
        message: 'Stream token generated successfully'
      });

    } catch (error) {
      console.error('Error generating stream token:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Получить информацию о голосовом чате сервера
   */
  static async getVoiceStatus(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    try {
      const userId = req.user?.id;
      const serverId = req.params.serverId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      // Получаем участников в голосовом чате
      const server = await prisma.server.findUnique({
        where: { id: serverId },
        include: {
          members: {
            where: {
              voiceConnectedAt: { not: null }
            },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatar: true
                }
              }
            }
          }
        }
      });

      if (!server) {
        return res.status(404).json({
          success: false,
          error: 'Server not found'
        });
      }

      // Получаем информацию от LiveKit о комнате
      const participants = await LiveKitService.getRoomInfo(server.livekitVoiceRoom);

      return res.json({
        success: true,
        data: {
          roomName: server.livekitVoiceRoom,
          voiceChannelName: server.voiceChannelName,
          maxUsers: server.maxVoiceUsers,
          connectedMembers: server.members,
          liveKitParticipants: participants || []
        }
      });

    } catch (error) {
      console.error('Error getting voice status:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
} 