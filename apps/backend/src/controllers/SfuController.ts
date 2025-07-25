import prisma from '../lib/prisma';
import { Response } from 'express';
import { ApiResponse } from '../types';

export class SfuController {
  static async getAll(_req: any, res: Response<ApiResponse>) {
    const list = await prisma.sfuServer.findMany({ orderBy: { name: 'asc' } });

    const enriched = await Promise.all(
      list.map(async (s) => {
        let latency: number | null = null;
        try {
          const host = new URL(s.url).hostname;
          const { ping } = await import('../utils/ping');
          latency = await ping(host);
        } catch {
          latency = null;
        }
        return { ...s, ping: latency };
      })
    );

    res.json({ success: true, data: enriched });
  }
} 