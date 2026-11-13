import { Router } from 'express';
import {
  getPresignedUploadUrl,
  mockUpload,
} from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/presign', authenticate, getPresignedUploadUrl);
router.all('/mock-upload', mockUpload);

export default router;

