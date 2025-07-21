import { Router } from 'express';
import { uploadPreview, getPreview } from '../controllers/PreviewController';

const router = Router();

// GET preview image
router.get('/:sid', getPreview);
// POST raw image (authenticated via middleware in main index)
router.post('/:sid', uploadPreview);

router.get('/youtube/:id', async (req, res) => {
  const { id } = req.params as { id: string };
  if (!id) return res.sendStatus(400);
  try {
    const response = await fetch(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`);
    if (!response.ok) return res.sendStatus(404);
    const buffer = Buffer.from(await response.arrayBuffer());
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(buffer);
  } catch (e) {
    console.error('yt thumb proxy error', e);
    return res.sendStatus(500);
  }
});

export default router; 