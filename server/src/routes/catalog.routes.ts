import { Router } from 'express';
import {
  getProducts,
  getProductBySlug,
  getCategories,
} from '../controllers/catalog.controller';
import {
  createProductReviewHandler,
  getProductReviewsHandler,
} from '../controllers/review.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public catalog endpoints
router.get('/products', getProducts);
router.get('/products/:slug', getProductBySlug);
router.get('/categories', getCategories);

// Reviews
router.get('/products/:id/reviews', getProductReviewsHandler);
router.post('/products/:id/reviews', authenticate, createProductReviewHandler);

export default router;

