import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import {
  validateCoupon,
  createAdminCoupon,
  listAdminCoupons,
} from '../services/coupon.service';
import { getCart } from '../services/cart.service';

export const validateCouponHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code, subtotalPaise: customSubtotal } = req.body;
    let subtotalPaise = customSubtotal;

    if (subtotalPaise === undefined && req.user?.id) {
      const cart = await getCart(req.user.id);
      subtotalPaise = cart.subtotalPaise;
    }

    const result = await validateCoupon(code, subtotalPaise || 0);

    res.status(200).json({
      success: true,
      message: 'Coupon applied successfully',
      data: {
        code: result.coupon.code,
        type: result.coupon.type,
        discountPaise: result.discountPaise,
        finalSubtotalPaise: result.finalSubtotalPaise,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createAdminCouponHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const newCoupon = await createAdminCoupon(req.body);
    res.status(201).json({
      success: true,
      message: 'Promotional coupon created successfully',
      data: { coupon: newCoupon },
    });
  } catch (error) {
    next(error);
  }
};

export const listAdminCouponsHandler = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const coupons = await listAdminCoupons();
    res.status(200).json({
      success: true,
      data: coupons,
    });
  } catch (error) {
    next(error);
  }
};
