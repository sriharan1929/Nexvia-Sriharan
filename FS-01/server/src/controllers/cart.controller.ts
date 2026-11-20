import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import {
  getCart,
  updateItemQuantity,
  removeItemFromCart,
  clearCart,
  getCartCount,
  addItemToCart,
} from '../services/cart.service';

export const getCartController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const cart = await getCart(req.user!.id);
    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCartItemController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const productId = req.params.productId as string;
    const { quantity } = req.body;

    const cart = await updateItemQuantity(req.user!.id, productId, quantity);

    res.status(200).json({
      success: true,
      message: 'Cart updated',
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

export const addItemToCartController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const productId = req.params.productId as string;
    const quantity = req.body.quantity || 1;

    const cart = await addItemToCart(req.user!.id, productId, quantity);

    res.status(200).json({
      success: true,
      message: 'Item added to cart',
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

export const removeItemController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const productId = req.params.productId as string;
    const cart = await removeItemFromCart(req.user!.id, productId);

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

export const clearCartController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await clearCart(req.user!.id);
    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      data: {
        items: [],
        subtotalPaise: 0,
        itemCount: 0,
        vendorCount: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCartCountController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const count = await getCartCount(req.user!.id);
    res.status(200).json({
      success: true,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
};
