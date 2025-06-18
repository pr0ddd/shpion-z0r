import prisma from '../lib/prisma';
import { Response } from 'express';
import { ApiResponse } from '../types';

export class SfuController {
  static async getAll(_req: any, res: Response<ApiResponse>) {
    const list = await prisma.sfuServer.findMany({ orderBy: { name: 'asc' } });
    res.json({ success: true, data: list });
  }
} 