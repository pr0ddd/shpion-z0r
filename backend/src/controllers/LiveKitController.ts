import { Request, Response } from 'express';
import { LiveKitService } from '../services/LiveKitService';
import { AuthenticatedRequest } from '../types';

export class LiveKitController {
  /**
   * GET /api/livekit/token
   * Generate a generic LiveKit access token.
   * The room name is passed as a query parameter.
   */
  static async getToken(req: AuthenticatedRequest, res: Response) {
    try {
      const { roomName } = req.query;
      const user = req.user!;

      if (typeof roomName !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'roomName query parameter is required'
        });
      }

      console.log(`🎤 Generating LiveKit token for user ${user.username} in room ${roomName}`);

      // We can use a simplified participant identity
      const participantIdentity = user.id;
      const participantName = user.username;

      const token = LiveKitService.createToken(participantIdentity, participantName, roomName);

      return res.json({
        success: true,
        data: { token },
        message: 'LiveKit token generated successfully'
      });
    } catch (error: any) {
      console.error('Error generating LiveKit token:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to generate LiveKit token',
        message: error.message
      });
    }
  }

  /**
   * GET /api/livekit/voice/:serverId/token
   * Generate voice token for server voice chat
   */
  static async getVoiceToken(req: AuthenticatedRequest, res: Response) {
    try {
      const { serverId } = req.params;
      const user = req.user!;

      const roomName = `shpion-server-${serverId}`;
      console.log(`🎤 Generating voice token for user ${user.username} in room ${roomName}`);

      const token = await LiveKitService.createToken(
        user.id,
        user.username,
        roomName
      );

      return res.json({
        success: true,
        data: { token },
        message: 'Voice token generated successfully'
      });
    } catch (error: any) {
      console.error('Error generating voice token:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to generate voice token',
        message: error.message
      });
    }
  }

  /**
   * GET /api/livekit/voice/:serverId/status
   * Get voice chat status for server
   */
  static async getVoiceStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { serverId } = req.params;
      const roomName = `shpion-server-${serverId}`;

      const roomInfo = await LiveKitService.getRoomInfo(roomName);

      return res.json({
        success: true,
        data: {
          roomName: roomName,
          participants: roomInfo?.length || 0,
          details: roomInfo
        },
        message: 'Voice status retrieved successfully'
      });
    } catch (error: any) {
      console.error('Error getting voice status:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get voice status',
        message: error.message
      });
    }
  }
} 