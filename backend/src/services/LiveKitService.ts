import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class LiveKitService {
  private static apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
  private static apiSecret = process.env.LIVEKIT_API_SECRET || 'secret';
  private static wsUrl = process.env.LIVEKIT_WS_URL || 'ws://localhost:7880';
  
  private static roomService = new RoomServiceClient(
    process.env.LIVEKIT_URL || 'http://localhost:7880',
    this.apiKey,
    this.apiSecret
  );

  /**
   * Создать JWT токен для подключения к LiveKit комнате
   */
  static async createAccessToken(
    roomName: string,
    identity: string,
    metadata?: string
  ): Promise<string> {
    const token = new AccessToken(this.apiKey, this.apiSecret, {
      identity,
      metadata,
    });

    // Права доступа
    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      canUpdateOwnMetadata: true,
    });

    return await token.toJwt();
  }

  /**
   * Создать токен для голосового чата сервера
   */
  static async createVoiceToken(
    userId: string,
    serverId: string,
    username: string
  ): Promise<{ token: string; wsUrl: string }> {
    // Получаем информацию о сервере
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      select: {
        livekitVoiceRoom: true,
        voiceChannelName: true
      }
    });

    if (!server) {
      throw new Error('Server not found');
    }

    const roomName = server.livekitVoiceRoom;
    const identity = `${userId}:${username}`;
    
    const metadata = JSON.stringify({
      userId,
      serverId,
      username,
      type: 'voice'
    });

    const token = await this.createAccessToken(roomName, identity, metadata);

    // Сохраняем токен в базе данных
    await prisma.liveKitToken.create({
      data: {
        userId,
        token,
        roomName,
        roomType: 'VOICE',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 часа
      }
    });

    return {
      token,
      wsUrl: this.wsUrl
    };
  }

  /**
   * Создать токен для стрима
   */
  static async createStreamToken(
    userId: string,
    streamId: string,
    username: string,
    isStreamer: boolean = false
  ): Promise<{ token: string; wsUrl: string }> {
    // Получаем информацию о стриме
    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      select: {
        livekitStreamRoom: true,
        title: true,
        streamerId: true
      }
    });

    if (!stream) {
      throw new Error('Stream not found');
    }

    const roomName = stream.livekitStreamRoom;
    const identity = `${userId}:${username}`;
    
    const metadata = JSON.stringify({
      userId,
      streamId,
      username,
      type: 'stream',
      isStreamer: isStreamer || stream.streamerId === userId
    });

    // Создаем токен с соответствующими правами
    const token = new AccessToken(this.apiKey, this.apiSecret, {
      identity,
      metadata,
    });

    if (isStreamer || stream.streamerId === userId) {
      // Права стримера
      token.addGrant({
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
        canUpdateOwnMetadata: true,
      });
    } else {
      // Права зрителя
      token.addGrant({
        room: roomName,
        roomJoin: true,
        canPublish: false,
        canSubscribe: true,
        canPublishData: true,
        canUpdateOwnMetadata: true,
      });
    }

    const jwt = await token.toJwt();

    // Сохраняем токен в базе данных
    await prisma.liveKitToken.create({
      data: {
        userId,
        token: jwt,
        roomName,
        roomType: 'STREAM',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }
    });

    return {
      token: jwt,
      wsUrl: this.wsUrl
    };
  }

  /**
   * Создать комнату для голосового чата
   */
  static async createVoiceRoom(roomName: string, maxParticipants: number = 50): Promise<void> {
    try {
      const options = {
        name: roomName,
        maxParticipants,
        emptyTimeout: 300, // 5 минут до закрытия пустой комнаты
        metadata: JSON.stringify({
          type: 'voice',
          createdAt: new Date().toISOString()
        })
      };

      await this.roomService.createRoom(options);
    } catch (error: any) {
      // Комната уже существует - это нормально
      if (!error.message?.includes('already exists')) {
        throw error;
      }
    }
  }

  /**
   * Создать комнату для стрима
   */
  static async createStreamRoom(roomName: string, maxParticipants: number = 100): Promise<void> {
    try {
      const options = {
        name: roomName,
        maxParticipants,
        emptyTimeout: 60, // 1 минута до закрытия пустой комнаты стрима
        metadata: JSON.stringify({
          type: 'stream',
          createdAt: new Date().toISOString()
        })
      };

      await this.roomService.createRoom(options);
    } catch (error: any) {
      if (!error.message?.includes('already exists')) {
        throw error;
      }
    }
  }

  /**
   * Получить информацию о комнате
   */
  static async getRoomInfo(roomName: string) {
    try {
      return await this.roomService.listParticipants(roomName);
    } catch (error) {
      console.error(`Error getting room info for ${roomName}:`, error);
      return null;
    }
  }

  /**
   * Закрыть комнату
   */
  static async deleteRoom(roomName: string): Promise<void> {
    try {
      await this.roomService.deleteRoom(roomName);
    } catch (error) {
      console.error(`Error deleting room ${roomName}:`, error);
    }
  }

  /**
   * Отключить участника от комнаты
   */
  static async removeParticipant(roomName: string, identity: string): Promise<void> {
    try {
      await this.roomService.removeParticipant(roomName, identity);
    } catch (error) {
      console.error(`Error removing participant ${identity} from room ${roomName}:`, error);
    }
  }

  /**
   * Очистить просроченные токены
   */
  static async cleanupExpiredTokens(): Promise<void> {
    try {
      await prisma.liveKitToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
    }
  }
} 