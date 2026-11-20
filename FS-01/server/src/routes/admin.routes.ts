import { Router } from 'express';
import {
  listVendors,
  updateVendorStatus,
  createCategory,
  listCategories,
  updateCategory,
} from '../controllers/admin.controller';
import {
  createAdminCouponHandler,
  listAdminCouponsHandler,
} from '../controllers/coupon.controller';
import { getAdminOverviewHandler } from '../controllers/analytics.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { UserRole } from '../types';
import { updateVendorStatusSchema } from '../validators/vendor.validator';
import {
  createCategorySchema,
  updateCategorySchema,
} from '../validators/category.validator';

const router = Router();

// All admin routes require authentication and ADMIN role
router.use(authenticate, authorize(UserRole.ADMIN));

// Vendor management
router.get('/vendors', listVendors);
router.patch('/vendors/:id/status', validate(updateVendorStatusSchema), updateVendorStatus);

// Category management
router.get('/categories', listCategories);
router.post('/categories', validate(createCategorySchema), createCategory);
router.patch('/categories/:id', validate(updateCategorySchema), updateCategory);

// Coupon management
router.get('/coupons', listAdminCouponsHandler);
router.post('/coupons', createAdminCouponHandler);

// Analytics
router.get('/analytics/overview', getAdminOverviewHandler);

export default router;

