import { Router } from 'express';
import { ServerController } from '../controllers/ServerController';
import { InviteController } from '../controllers/InviteController';
// import { authMiddleware } from '../middleware/auth';

const router = Router();

// Получить все серверы пользователя
router.get('/', ServerController.getUserServers);

// Создать новый сервер
router.post('/', ServerController.createServer);

// Получить конкретный сервер
router.get('/:serverId', ServerController.getServer);

// Получить участников сервера
router.get('/:serverId/members', ServerController.getServerMembers);

// Покинуть сервер
router.post('/:serverId/leave', ServerController.leaveServer);

export default router; 