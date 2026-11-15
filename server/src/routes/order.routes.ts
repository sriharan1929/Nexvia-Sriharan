import { Router } from 'express';
import {
  getCustomerOrdersController,
  getCustomerOrderByIdController,
  downloadInvoiceController,
} from '../controllers/order.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getCustomerOrdersController);
router.get('/:id', getCustomerOrderByIdController);
router.get('/:id/invoice.pdf', downloadInvoiceController);

export default router;
