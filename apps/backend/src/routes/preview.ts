import { Router } from 'express';
import { uploadPreview, getPreview } from '../controllers/PreviewController';

const router = Router();

// GET preview image
router.get('/:sid', getPreview);
// POST raw image (authenticated via middleware in main index)
router.post('/:sid', uploadPreview);

export default router; 