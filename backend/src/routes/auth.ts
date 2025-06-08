import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Регистрация
router.post('/register', AuthController.register);

// Вход
router.post('/login', AuthController.login);

// Получить информацию о пользователе (защищено)
router.get('/me', authMiddleware, AuthController.me);

// Выход (защищено)
router.post('/logout', authMiddleware, AuthController.logout);

export default router; 