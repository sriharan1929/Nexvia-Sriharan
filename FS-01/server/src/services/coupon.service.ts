import Coupon, { ICoupon } from '../models/Coupon';
import { AppError } from '../middleware/errorHandler';

export interface CouponValidationResult {
  coupon: ICoupon;
  discountPaise: number;
  finalSubtotalPaise: number;
}

export const validateCoupon = async (
  code: string,
  subtotalPaise: number
): Promise<CouponValidationResult> => {
  if (!code) {
    throw new AppError('Coupon code is required', 400);
  }

  const cleanCode = code.trim().toUpperCase();
  const coupon = await Coupon.findOne({ code: cleanCode });

  if (!coupon || !coupon.isActive) {
    throw new AppError('Invalid or expired coupon code', 400);
  }

  const now = new Date();
  if (now < coupon.validFrom || now > coupon.validUntil) {
    throw new AppError('This coupon is not currently active', 400);
  }

  if (coupon.usedCount >= coupon.usageLimit) {
    throw new AppError('Coupon usage limit has been reached', 400);
  }

  if (subtotalPaise < coupon.minOrderPaise) {
    const minRupees = Math.round(coupon.minOrderPaise / 100);
    throw new AppError(
      `Coupon requires a minimum order amount of ₹${minRupees}`,
      400
    );
  }

  let discountPaise = 0;

  if (coupon.type === 'FIXED') {
    discountPaise = Math.min(coupon.valuePaise || 0, subtotalPaise);
  } else if (coupon.type === 'PERCENTAGE') {
    const rawDiscount = Math.round(
      (subtotalPaise * (coupon.percentage || 0)) / 100
    );
    discountPaise = coupon.maxDiscountPaise
      ? Math.min(rawDiscount, coupon.maxDiscountPaise)
      : rawDiscount;
  }

  const finalSubtotalPaise = Math.max(0, subtotalPaise - discountPaise);

  return {
    coupon,
    discountPaise,
    finalSubtotalPaise,
  };
};

/**
 * Atomically marks coupon usage.
 */
export const incrementCouponUsage = async (couponId: string) => {
  await Coupon.findByIdAndUpdate(couponId, { $inc: { usedCount: 1 } });
};

/**
 * Admin: Creates a new coupon.
 */
export const createAdminCoupon = async (data: Partial<ICoupon>) => {
  const existing = await Coupon.findOne({ code: data.code?.trim().toUpperCase() });
  if (existing) {
    throw new AppError('Coupon code already exists', 400);
  }
  return await Coupon.create(data);
};

/**
 * Admin: Lists all coupons.
 */
export const listAdminCoupons = async () => {
  return await Coupon.find().sort({ createdAt: -1 });
};
