import { Request, Response } from 'express';
import { LiveKitService } from '../services/LiveKitService';
import { AuthenticatedRequest } from '../types';
import { prisma } from '../index';

export class LiveKitController {
  /**
   * GET /api/livekit/voice/:serverId/token
   * Generate voice token for server voice chat
   */
  static async getVoiceToken(req: AuthenticatedRequest, res: Response) {
    try {
      const { serverId } = req.params;
      const user = req.user!;

      console.log(`🎤 Generating voice token for user ${user.username} in server ${serverId}`);

      const tokenData = await LiveKitService.createVoiceToken(
        user.id,
        serverId,
        user.username
      );

      return res.json({
        success: true,
        data: tokenData,
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
      
      // Get server info
      const server = await prisma.server.findUnique({
        where: { id: serverId },
        select: {
          livekitVoiceRoom: true,
          name: true
        }
      });

      if (!server) {
        return res.status(404).json({
          success: false,
          error: 'Server not found'
        });
      }

      const roomInfo = await LiveKitService.getRoomInfo(server.livekitVoiceRoom);

      return res.json({
        success: true,
        data: {
          roomName: server.livekitVoiceRoom,
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