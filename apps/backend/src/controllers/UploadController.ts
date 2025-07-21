import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { Request, Response } from 'express';
import crypto from 'crypto';
import { s3 } from '../lib/s3Client';

export const createUploadUrl = async (req: Request, res: Response) => {
  const { contentType, ext } = req.body || {};
  if (!contentType || !ext) {
    res.status(400).json({ success: false, error: 'Invalid params' });
    return;
  }

  const key = `chat/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  try {
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 300 });
    res.json({ success: true, url, key });
    return;
  } catch (err) {
    console.error('R2 presign error', err);
    res.status(500).json({ success: false, error: 'Failed to create presigned url' });
    return;
  }
};

// ---- Download file proxy (streams the object instead of redirect) ----
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

export const getFile = async (req: Request, res: Response) => {
  const { key } = req.params as { key: string };

  if (!key) {
    res.status(400).json({ success: false, error: 'key required' });
    return;
  }

  try {
    const { Body, ContentType, ContentLength, LastModified } = await s3.send(
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: key,
      }),
    );

    // Suggest filename
    let suggestedName = req.query.name as string | undefined;
    if (suggestedName) {
      try { suggestedName = decodeURIComponent(suggestedName); } catch {}
    }
    if (!suggestedName) {
      suggestedName = key.split('/').pop() || 'file';
    }
    // RFC 5987 – UTF-8 filename fallback
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(suggestedName)}`);

    // Set useful headers so browser can display / cache the image
    if (ContentType) res.setHeader('Content-Type', ContentType);
    if (ContentLength) res.setHeader('Content-Length', ContentLength.toString());
    if (LastModified)
      res.setHeader('Last-Modified', new Date(LastModified).toUTCString());
    // 1 year immutable cache (files are content-addressed by unique key)
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    // R2 returns Body as a Node.js Readable stream – pipe it to response
    const stream =
      Body instanceof Readable ? Body : Readable.from(Body as any);

    stream.pipe(res);
  } catch (err: any) {
    const code = err?.$metadata?.httpStatusCode;
    const status = code && code >= 400 && code < 600 ? code : 500;
    console.error('R2 download stream error', err);
    res.status(status).json({ success: false, error: 'Failed to download file' });
  }
}; 