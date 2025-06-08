import { Router } from 'express';
import { InviteController } from '../controllers/InviteController';

const router = Router();

// Получить публичную информацию о приглашении (без авторизации)
router.get('/:inviteCode/public', InviteController.getPublicInviteInfo);

// Получить информацию о приглашении
router.get('/:inviteCode/info', InviteController.getInviteInfo);

// Удалить приглашение
router.delete('/:inviteId', InviteController.deleteInvite);

// Использовать приглашение
router.post('/:inviteCode/use', InviteController.useInvite);

export default router; 