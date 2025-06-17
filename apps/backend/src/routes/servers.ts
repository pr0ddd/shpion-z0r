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

// Удалить сервер
router.delete('/:serverId', catchAsync(ServerController.deleteServer));

// Переименовать сервер
router.patch('/:serverId', catchAsync(ServerController.renameServer));

export default router; 