import { Router } from 'express';
import { handleRazorpayWebhook } from '../controllers/payment.controller';

const router = Router();

// Razorpay webhook endpoint
router.post('/razorpay', handleRazorpayWebhook);

export default router;
