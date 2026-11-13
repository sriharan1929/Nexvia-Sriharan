import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { verifyPayment, simulatePayment } from '../controllers/payment.controller';

const router = Router();

// Customer payment verification
router.post('/razorpay/verify', authenticate, verifyPayment);

// Rapid testing / development simulation
router.post('/simulate', authenticate, simulatePayment);

export default router;
