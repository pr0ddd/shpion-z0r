import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// GET /api/users/me - получить информацию о текущем пользователе
router.get('/me', authMiddleware, UserController.getCurrentUser);

export default router; 