import { Router } from 'express';
import {
  getCustomerOrdersController,
  getCustomerOrderByIdController,
} from '../controllers/order.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getCustomerOrdersController);
router.get('/:id', getCustomerOrderByIdController);

export default router;
