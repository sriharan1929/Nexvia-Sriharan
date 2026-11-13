import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import {
  getCustomerOrders,
  getCustomerOrderById,
  getVendorOrders,
  updateSellerOrderStatus,
} from '../services/order.service';

export const getCustomerOrdersController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;

    const result = await getCustomerOrders(req.user!.id, page, limit);

    res.status(200).json({
      success: true,
      data: result.orders,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerOrderByIdController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orderId = req.params.id as string;
    const order = await getCustomerOrderById(req.user!.id, orderId);

    res.status(200).json({
      success: true,
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

export const getVendorOrdersController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const status = req.query.status as string | undefined;

    const result = await getVendorOrders(
      req.vendor._id.toString(),
      status,
      page,
      limit
    );

    res.status(200).json({
      success: true,
      data: result.sellerOrders,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSellerOrderStatusController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sellerOrderId = req.params.id as string;
    const { status, trackingNumber, trackingUrl } = req.body;

    const updated = await updateSellerOrderStatus(
      req.vendor._id.toString(),
      sellerOrderId,
      status,
      trackingNumber,
      trackingUrl
    );

    res.status(200).json({
      success: true,
      message: 'Fulfillment status updated',
      data: { sellerOrder: updated },
    });
  } catch (error) {
    next(error);
  }
};
