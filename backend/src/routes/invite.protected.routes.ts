import { Router } from 'express';
import { InviteController } from '../controllers/InviteController';

const router = Router();

// Использовать приглашение для вступления в сервер
router.post('/:inviteCode', InviteController.useInvite);

// Сгенерировать новый код приглашения для сервера
router.post('/:serverId/regenerate', InviteController.regenerateInviteCode);

export default router; 