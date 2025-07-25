import { Response } from 'express';
import prisma from '../lib/prisma';
import { ApiResponse, AuthenticatedRequest } from '../types';

export class VolumePreferenceController {
  static async getAll(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    const userId = req.user!.id;
    const prefs = await prisma.volumePreference.findMany({ where: { ownerId: userId } });
    res.json({ success: true, data: prefs });
  }

  static async setPreference(
    req: AuthenticatedRequest & { params: { targetUserId: string }; body: { volume: number } },
    res: Response<ApiResponse>
  ) {
    const ownerId = req.user!.id;
    const { targetUserId } = req.params;
    const { volume } = req.body;

    const pref = await prisma.volumePreference.upsert({
      where: {
        ownerId_targetUserId: {
          ownerId,
          targetUserId,
        },
      },
      update: { volume },
      create: { ownerId, targetUserId, volume },
    });

    res.json({ success: true, data: pref });
  }
} 