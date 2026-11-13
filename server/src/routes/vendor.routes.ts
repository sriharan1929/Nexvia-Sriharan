import { Router } from 'express';
import {
  applyVendor,
  getVendorProfile,
  updateVendorProfile,
  getVendorProducts,
  createVendorProduct,
  updateVendorProduct,
  deleteVendorProduct,
} from '../controllers/vendor.controller';
import { authenticate } from '../middleware/auth';
import { ensureApprovedVendor } from '../middleware/ensureApprovedVendor';
import { validate } from '../middleware/validate';
import {
  applyVendorSchema,
  updateVendorProfileSchema,
} from '../validators/vendor.validator';
import {
  createProductSchema,
  updateProductSchema,
} from '../validators/product.validator';

const router = Router();

// Seller application & profile
router.post('/applications', authenticate, validate(applyVendorSchema), applyVendor);
router.get('/profile', authenticate, getVendorProfile);
router.patch(
  '/profile',
  authenticate,
  ensureApprovedVendor,
  validate(updateVendorProfileSchema),
  updateVendorProfile
);

// Seller catalog management (requires approved vendor)
router.get('/products', authenticate, ensureApprovedVendor, getVendorProducts);
router.post(
  '/products',
  authenticate,
  ensureApprovedVendor,
  validate(createProductSchema),
  createVendorProduct
);
router.patch(
  '/products/:id',
  authenticate,
  ensureApprovedVendor,
  validate(updateProductSchema),
  updateVendorProduct
);
router.delete('/products/:id', authenticate, ensureApprovedVendor, deleteVendorProduct);

export default router;

