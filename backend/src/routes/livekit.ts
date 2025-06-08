import { Router } from 'express';
import { LiveKitController } from '../controllers/LiveKitController';

const router = Router();

// Голосовой чат
router.post('/voice/:serverId/token', LiveKitController.getVoiceToken);
router.post('/voice/:serverId/leave', LiveKitController.leaveVoice);
router.get('/voice/:serverId/status', LiveKitController.getVoiceStatus);

// Стримы
router.post('/stream/:streamId/token', LiveKitController.getStreamToken);

export default router; 