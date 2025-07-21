import { S3Client } from '@aws-sdk/client-s3';

export const s3 = new S3Client({
  region: 'auto', // R2 is global
  endpoint: process.env.R2_ENDPOINT, // e.g. https://<account>.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
  },
}); 