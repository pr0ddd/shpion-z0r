import { Router } from 'express';
import { MessageController } from '../controllers/MessageController';

const router = Router();

// Получить сообщения для сервера
router.get('/server/:serverId', MessageController.getMessages);

// Отправить сообщение в сервер
router.post('/server/:serverId', MessageController.sendMessage);

// Редактировать сообщение
router.put('/:messageId', MessageController.editMessage);

// Удалить сообщение
router.delete('/:messageId', MessageController.deleteMessage);

export default router; 