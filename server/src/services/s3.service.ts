import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getS3Client } from '../config/s3';
import { env } from '../config';
import { nanoid } from 'nanoid';

export interface PresignedUploadResult {
  uploadUrl: string;
  key: string;
  publicUrl: string;
}

export const generatePresignedUploadUrl = async (
  fileName: string,
  contentType: string
): Promise<PresignedUploadResult> => {
  const extension = fileName.split('.').pop() || 'jpg';
  const uniqueId = nanoid(12);
  const key = `products/${uniqueId}.${extension}`;

  // If AWS S3 credentials are configured
  if (
    env.AWS_ACCESS_KEY_ID &&
    env.AWS_SECRET_ACCESS_KEY &&
    !env.AWS_ACCESS_KEY_ID.includes('your-access')
  ) {
    try {
      const s3 = getS3Client();
      const command = new PutObjectCommand({
        Bucket: env.AWS_S3_BUCKET,
        Key: key,
        ContentType: contentType,
      });

      const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
      const publicUrl = `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;

      return { uploadUrl, key, publicUrl };
    } catch (error) {
      console.warn('[S3] Presign failed, falling back to local simulation:', error);
    }
  }

  // Development Fallback: Provide direct placeholder/mock URL
  const mockPublicUrl = `https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80`;
  return {
    uploadUrl: `http://localhost:${env.PORT}/api/v1/uploads/mock-upload?key=${key}`,
    key,
    publicUrl: mockPublicUrl,
  };
};
