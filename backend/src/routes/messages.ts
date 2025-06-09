import { Router } from 'express';
import { MessageController } from '../controllers/MessageController';

const router = Router();

// Get messages for a server
router.get('/:serverId', MessageController.getMessages);

// Send a message to a server
router.post('/:serverId', MessageController.sendMessage);

// Edit a message
router.patch('/:messageId', MessageController.editMessage);

// Delete a message
router.delete('/:messageId', MessageController.deleteMessage);

export default router; 