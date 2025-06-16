import { Router } from 'express';
import { ServerController } from '../controllers/ServerController';
import { catchAsync } from '../utils/catchAsync';
// import { authMiddleware } from '../middleware/auth';

const router = Router();

// Получить все серверы пользователя
router.get('/', catchAsync(ServerController.getServers));

// Создать новый сервер
router.post('/', catchAsync(ServerController.createServer));

// Получить конкретный сервер
router.get('/:serverId', catchAsync(ServerController.getServer));

// Получить участников сервера
router.get('/:serverId/members', catchAsync(ServerController.getServerMembers));

// Покинуть сервер
router.post('/:serverId/leave', catchAsync(ServerController.leaveServer));

export default router; 