import { Router } from 'express';
import { VolumePreferenceController } from '../controllers/VolumePreferenceController';
import { catchAsync } from '../utils/catchAsync';

const router = Router();

router.get('/', catchAsync(VolumePreferenceController.getAll));
router.put('/:targetUserId', VolumePreferenceController.setPreference);

export default router; 