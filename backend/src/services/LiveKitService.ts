import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class LiveKitService {
  private static apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
  private static apiSecret = process.env.LIVEKIT_API_SECRET || 'secret';
  private static wsUrl = process.env.LIVEKIT_URL || 'ws://10.10.3.1:7880';
  
  private static roomService = new RoomServiceClient(
    process.env.LIVEKIT_URL || 'ws://10.10.3.1:7880',
    this.apiKey,
    this.apiSecret
  );

  /**
   * Create JWT access token for LiveKit room connection
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

    // Grant permissions
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
   * Create voice token for server voice chat
   */
  static async createVoiceToken(
    userId: string,
    serverId: string,
    username: string
  ): Promise<{ token: string; wsUrl: string }> {
    // Get server info
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      select: {
        livekitVoiceRoom: true,
        name: true
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

    // Store token in database for tracking
    await prisma.liveKitToken.create({
      data: {
        userId,
        token,
        roomName,
        roomType: 'VOICE',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      }
    });

    return {
      token,
      wsUrl: this.wsUrl
    };
  }

  /**
   * Create voice room for server
   */
  static async createVoiceRoom(roomName: string, maxParticipants: number = 50): Promise<void> {
    try {
      const options = {
        name: roomName,
        maxParticipants,
        emptyTimeout: 300, // 5 minutes until empty room closes
        metadata: JSON.stringify({
          type: 'voice',
          createdAt: new Date().toISOString()
        })
      };

      await this.roomService.createRoom(options);
    } catch (error: any) {
      // Room already exists - that's fine
      if (!error.message?.includes('already exists')) {
        throw error;
      }
    }
  }

  /**
   * Get room participants info
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
   * Remove participant from room
   */
  static async removeParticipant(roomName: string, identity: string): Promise<void> {
    try {
      await this.roomService.removeParticipant(roomName, identity);
    } catch (error) {
      console.error(`Error removing participant ${identity} from room ${roomName}:`, error);
    }
  }

  /**
   * Delete room
   */
  static async deleteRoom(roomName: string): Promise<void> {
    try {
      await this.roomService.deleteRoom(roomName);
    } catch (error) {
      console.error(`Error deleting room ${roomName}:`, error);
    }
  }
} 