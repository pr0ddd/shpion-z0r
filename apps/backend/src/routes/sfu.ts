import { Router } from 'express';
import { SfuController } from '../controllers/SfuController';
import { catchAsync } from '../utils/catchAsync';

const router = Router();

router.get('/', catchAsync(SfuController.getAll));

export default router; 