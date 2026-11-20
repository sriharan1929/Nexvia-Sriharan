import { Router } from 'express';
import { handleRazorpayWebhook } from '../controllers/payment.controller';

const router = Router();

router.post('/razorpay', handleRazorpayWebhook);

export default router;
