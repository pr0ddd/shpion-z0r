import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';

export class LiveKitService {
  private static apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
  private static apiSecret = process.env.LIVEKIT_API_SECRET || 'secret';
  private static wsUrl = process.env.LIVEKIT_URL || 'ws://localhost:7880';
  
  private static roomService = new RoomServiceClient(
    process.env.LIVEKIT_URL || 'http://localhost:7880',
    this.apiKey,
    this.apiSecret
  );

  /**
   * Create a generic JWT access token for a LiveKit room.
   */
  static async createToken(participantIdentity: string, participantName: string, roomName: string): Promise<string> {
    const at = new AccessToken(this.apiKey, this.apiSecret, {
      identity: participantIdentity,
      name: participantName,
    });

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });
    
    return await at.toJwt();
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