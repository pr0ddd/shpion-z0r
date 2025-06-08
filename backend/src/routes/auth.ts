import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';

const router = Router();

// Регистрация
router.post('/register', AuthController.register);

// Вход
router.post('/login', AuthController.login);

// Получить информацию о пользователе
router.get('/me', AuthController.me);

// Выход
router.post('/logout', AuthController.logout);

export default router; 