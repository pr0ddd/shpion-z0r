import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { catchAsync } from '../utils/catchAsync';

const router = Router();

// GET /api/users/ - получить список всех пользователей
router.get('/', catchAsync(UserController.getAllUsers));

// GET /api/users/:userId - получить информацию о пользователе по ID
router.get('/:userId', catchAsync(UserController.getUserById));

// PUT /api/users/me/avatar - обновить аватар текущего пользователя
router.put('/me/avatar', catchAsync(UserController.updateAvatar));

// PUT /api/users/me - обновить профиль (username)
router.put('/me', catchAsync(UserController.updateProfile));

export default router; 