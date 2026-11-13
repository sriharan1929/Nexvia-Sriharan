import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { generatePresignedUploadUrl } from '../services/s3.service';
import { AppError } from '../middleware/errorHandler';

export const getPresignedUploadUrl = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { fileName, contentType } = req.body;

    if (!fileName || !contentType) {
      throw new AppError('fileName and contentType are required', 400);
    }

    // Validate image mime type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(contentType.toLowerCase())) {
      throw new AppError(
        'Invalid file type. Allowed formats: JPEG, PNG, WebP, GIF',
        400
      );
    }

    const presignedData = await generatePresignedUploadUrl(
      fileName,
      contentType
    );

    res.status(200).json({
      success: true,
      data: presignedData,
    });
  } catch (error) {
    next(error);
  }
};

export const mockUpload = async (
  _req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  res.status(200).json({
    success: true,
    message: 'Mock file uploaded successfully in development mode',
  });
};

