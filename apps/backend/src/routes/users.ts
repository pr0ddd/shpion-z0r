import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { catchAsync } from '../utils/catchAsync';

const router = Router();

// GET /api/users/ - получить список всех пользователей
router.get('/', catchAsync(UserController.getAllUsers));

// GET /api/users/:userId - получить информацию о пользователе по ID
router.get('/:userId', catchAsync(UserController.getUserById));

export default router; 