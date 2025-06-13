import { Router } from 'express';
import { InviteController } from '../controllers/InviteController';
import { catchAsync } from '../utils/catchAsync';

const router = Router();

// Использовать приглашение для вступления в сервер
router.post('/:inviteCode', catchAsync(InviteController.joinServerWithInviteCode));

// Сгенерировать новый код приглашения для сервера
router.patch('/:serverId/refresh-code', catchAsync(InviteController.refreshInviteCodeForServer));

export default router; 