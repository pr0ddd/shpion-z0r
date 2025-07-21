import { Router } from 'express';
import { createUploadUrl } from '../controllers/UploadController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/presigned', authMiddleware, createUploadUrl);
// Note: public download route is defined in src/index.ts before auth middleware.
// Keeping only protected endpoints here to avoid duplication.

export default router; 