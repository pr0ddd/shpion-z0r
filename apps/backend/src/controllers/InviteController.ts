import { Request, Response } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { InviteService } from '../services/InviteService';
import { ApiError } from '../utils/ApiError';

export class InviteController {
  // Использовать код-приглашение для вступления в сервер
  static async useInvite(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    const userId = req.user?.id;
    if (!userId) throw new ApiError(401, 'User not authenticated');

    const updatedServer = await InviteService.joinServerWithInviteCode(req.params.inviteCode, userId);

    return res.json({
      success: true,
      data: updatedServer,
      message: `Successfully joined server ${updatedServer.name}`
    });
  }

  // Получить публичную информацию о сервере по коду приглашения
  static async getPublicInviteInfo(req: Request, res: Response<ApiResponse>) {
    const info = await InviteService.getPublicInviteInfo(req.params.inviteCode);

    res.json({
      success: true,
      data: info,
    });
  }
  
  // Сгенерировать новый код приглашения
  static async regenerateInviteCode(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    const userId = req.user?.id;
    if (!userId) throw new ApiError(401, 'Not authenticated');

    const updatedServer = await InviteService.refreshInviteCode(req.params.serverId, userId);

    return res.json({
      success: true,
      data: updatedServer,
      message: 'New invite code has been generated',
    });
  }

  static async joinServerWithInviteCode(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    const userId = req.user!.id;
    const updatedServer = await InviteService.joinServerWithInviteCode(req.params.inviteCode, userId);

    res.json({ success: true, data: updatedServer });
  }

  static async refreshInviteCodeForServer(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    const updatedServer = await InviteService.refreshInviteCode(req.params.serverId, req.user!.id);
    res.json({ success: true, data: updatedServer });
  }
} 