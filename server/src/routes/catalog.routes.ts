import { Router } from 'express';
import {
  getProducts,
  getProductBySlug,
  getCategories,
} from '../controllers/catalog.controller';

const router = Router();

// Public catalog endpoints
router.get('/products', getProducts);
router.get('/products/:slug', getProductBySlug);
router.get('/categories', getCategories);

export default router;

