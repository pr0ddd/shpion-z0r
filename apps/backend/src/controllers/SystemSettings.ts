import prisma from '../lib/prisma';
import { Request, Response } from 'express';
import { ApiResponse, BulkUpdateSystemSettingsRequest } from '../types';

export class SystemSettingsController {
  static async getAll(_req: any, res: Response<ApiResponse>) {
    const list = await prisma.systemSetting.findMany({
      orderBy: {
        code_name: 'asc',
      },
    });
    res.json({ success: true, data: list });
  }

  static async bulkUpdate(
    req: Request<{}, ApiResponse, BulkUpdateSystemSettingsRequest>,
    res: Response<ApiResponse>
  ) {
    const data = req.body;

    await prisma.$transaction(
      data.map((systemSetting) =>
        prisma.systemSetting.update({
          where: { id: systemSetting.id },
          data: { value: systemSetting.value },
        })
      )
    );

    const list = await prisma.systemSetting.findMany({
      orderBy: {
        code_name: 'asc',
      },
    });
    res.json({ success: true, data: list });
  }
}
