import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../middleware/auth';
import { authValidator } from '../validators/authValidator';
import { catchAsync } from '../utils/catchAsync';

const router = Router();

// Регистрация
router.post('/register', authValidator.register, catchAsync(AuthController.register));

// Вход
router.post('/login', authValidator.login, catchAsync(AuthController.login));

// Получить информацию о пользователе (защищено)
router.get('/me', authMiddleware, catchAsync(AuthController.me));

// Выход (защищено)
router.post('/logout', authMiddleware, catchAsync(AuthController.logout));

export default router; 