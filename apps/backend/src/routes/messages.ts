import { Router } from 'express';
import { MessageController } from '../controllers/MessageController';
import { catchAsync } from '../utils/catchAsync';

const router = Router();

// Get messages for a server
router.get('/:serverId', catchAsync(MessageController.getMessages));

// Send a message to a server
router.post('/:serverId', catchAsync(MessageController.sendMessage));

// Edit a message
router.patch('/:messageId', catchAsync(MessageController.editMessage));

// Delete a message
router.delete('/:messageId', catchAsync(MessageController.deleteMessage));

export default router; 