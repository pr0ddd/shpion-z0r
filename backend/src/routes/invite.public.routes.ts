import { Router } from 'express';
import { InviteController } from '../controllers/InviteController';

const router = Router();

// Получить публичную информацию о приглашении (без авторизации)
router.get('/:inviteCode', InviteController.getPublicInviteInfo);

export default router; 