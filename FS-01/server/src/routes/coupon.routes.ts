import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateCouponHandler } from '../controllers/coupon.controller';

const router = Router();

router.post('/validate', authenticate, validateCouponHandler);

export default router;
