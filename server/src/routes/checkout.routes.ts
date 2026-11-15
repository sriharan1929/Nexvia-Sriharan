import { Router } from 'express';
import {
  previewCheckoutController,
  createCheckoutSessionController,
} from '../controllers/checkout.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  checkoutPreviewSchema,
  checkoutSessionSchema,
} from '../validators/order.validator';

const router = Router();

router.use(authenticate);

router.post('/preview', validate(checkoutPreviewSchema), previewCheckoutController);
router.post('/session', validate(checkoutSessionSchema), createCheckoutSessionController);

export default router;

