import { Router } from 'express';
import { LiveKitController } from '../controllers/LiveKitController';

const router = Router();

// Voice chat routes
router.get('/voice/:serverId/token', LiveKitController.getVoiceToken);
router.get('/voice/:serverId/status', LiveKitController.getVoiceStatus);

export default router; 