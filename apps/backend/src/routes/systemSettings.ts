import { Router } from 'express';
import { SystemSettingsController } from '../controllers/SystemSettings';
import { catchAsync } from '../utils/catchAsync';

const router = Router();

router.get('/', catchAsync(SystemSettingsController.getAll));
router.patch('/bulk_update', SystemSettingsController.bulkUpdate);

export default router;