import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import {
  previewCheckout,
  createCheckoutSession,
} from '../services/order.service';

export const previewCheckoutController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { address, couponCode } = req.body;
    const preview = await previewCheckout(req.user!.id, address, couponCode);

    res.status(200).json({
      success: true,
      data: preview,
    });
  } catch (error) {
    next(error);
  }
};

export const createCheckoutSessionController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { address, couponCode } = req.body;
    const session = await createCheckoutSession(
      req.user!.id,
      address,
      couponCode
    );

    res.status(201).json({
      success: true,
      message: 'Checkout session created and inventory reserved',
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

