import { Router } from 'express';
import { InviteController } from '../controllers/InviteController';

const router = Router();

// Получить публичную информацию о приглашении (без авторизации)
router.get('/:inviteCode/public', InviteController.getPublicInviteInfo);

export default router; 