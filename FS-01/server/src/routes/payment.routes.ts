import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { verifyPayment, simulatePayment } from '../controllers/payment.controller';

const router = Router();

router.post('/razorpay/verify', authenticate, verifyPayment);

router.post('/simulate', authenticate, simulatePayment);

export default router;
