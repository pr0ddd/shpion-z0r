import { Request, Response } from 'express';

// In-memory storage <trackSid, { buffer: Buffer, mime: string, updated: Date }>
const previewStore: Record<string, { buffer: Buffer; mime: string; updated: number }> = {};

export const uploadPreview = (req: Request, res: Response): void => {
  const { sid } = req.params;
  if (!sid) { res.status(400).send('sid required'); return; }

  if (!req.is('image/*')) {
    res.status(400).send('Content-Type must be image');
    return;
  }
  const chunks: Buffer[] = [];
  req.on('data', (chunk) => chunks.push(chunk));
  req.on('end', () => {
    const buffer = Buffer.concat(chunks);
    previewStore[sid] = { buffer, mime: req.headers['content-type'] || 'image/jpeg', updated: Date.now() };
    res.sendStatus(200);
  });
  return;
};

export const getPreview = (req: Request, res: Response): void => {
  const { sid } = req.params;
  const entry = previewStore[sid];
  if (!entry) { res.sendStatus(404); return; }
  res.setHeader('Content-Type', entry.mime);
  res.setHeader('Cache-Control', 'no-store');
  res.send(entry.buffer);
  return;
}; 