import { S3Client } from '@aws-sdk/client-s3';
import env from './env';

let s3Client: S3Client | null = null;

const connectS3 = (): S3Client => {
  if (s3Client) return s3Client;

  s3Client = new S3Client({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  });

  console.log('[S3] Client initialized');
  return s3Client;
};

export const getS3Client = (): S3Client => {
  if (!s3Client) return connectS3();
  return s3Client;
};

export default connectS3;
