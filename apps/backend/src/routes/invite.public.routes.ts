import { Router } from 'express';
import { InviteController } from '../controllers/InviteController';
import { catchAsync } from '../utils/catchAsync';

const router = Router();

// Получить публичную информацию о приглашении (без авторизации)
router.get('/:inviteCode', catchAsync(InviteController.getPublicInviteInfo));

export default router; 