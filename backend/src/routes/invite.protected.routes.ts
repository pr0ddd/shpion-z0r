import { Router } from 'express';
import { InviteController } from '../controllers/InviteController';

const router = Router();

// Получить информацию о приглашении
router.get('/:inviteCode/info', InviteController.getInviteInfo);

// Удалить приглашение
router.delete('/:inviteId', InviteController.deleteInvite);

// Использовать приглашение
router.post('/:inviteCode/use', InviteController.useInvite);

export default router; 