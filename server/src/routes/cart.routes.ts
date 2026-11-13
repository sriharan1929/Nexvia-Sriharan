import { Router } from 'express';
import {
  getCartController,
  getCartCountController,
  updateCartItemController,
  addItemToCartController,
  removeItemController,
  clearCartController,
} from '../controllers/cart.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateCartItemSchema } from '../validators/cart.validator';

const router = Router();

// All cart routes require an authenticated user session
router.use(authenticate);

router.get('/', getCartController);
router.get('/count', getCartCountController);
router.put('/items/:productId', validate(updateCartItemSchema), updateCartItemController);
router.post('/items/:productId', addItemToCartController);
router.delete('/items/:productId', removeItemController);
router.delete('/', clearCartController);

export default router;

