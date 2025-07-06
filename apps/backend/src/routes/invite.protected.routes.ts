import { Router } from 'express';
import { InviteController } from '../controllers/InviteController';
import { catchAsync } from '../utils/catchAsync';

const router = Router();

// Использовать приглашение для вступления в сервер
router.post('/:inviteCode', catchAsync(InviteController.joinServerWithInviteCode));

export default router; 