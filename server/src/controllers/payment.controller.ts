import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middleware/errorHandler';
import Order from '../models/Order';
import {
  verifyClientSignature,
  verifyWebhookSignature,
  processPaymentSuccess,
  processPaymentFailure,
} from '../services/payment.service';

/**
 * Verifies client Razorpay checkout signature and captures payment.
 * POST /api/v1/payments/razorpay/verify
 */
export const verifyPayment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!orderId || !razorpayOrderId || !razorpayPaymentId) {
      throw new AppError('Missing payment verification details', 400);
    }

    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.customerId.toString() !== userId) {
      throw new AppError('Forbidden: you do not own this order', 403);
    }

    // Verify signature
    const isValid = verifyClientSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature || ''
    );

    if (!isValid) {
      throw new AppError('Invalid payment signature', 400);
    }

    // Process payment success & vendor Route transfers
    const result = await processPaymentSuccess({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    res.status(200).json({
      success: true,
      message: 'Payment verified and captured successfully',
      data: {
        orderId: result.order._id,
        orderNumber: result.order.orderNumber,
        paymentStatus: result.order.paymentStatus,
        alreadyProcessed: result.alreadyProcessed,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Simulates payment success for rapid local development / testing without live Razorpay account.
 * POST /api/v1/payments/simulate
 */
export const simulatePayment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    const { orderId } = req.body;
    if (!orderId) {
      throw new AppError('Order ID is required', 400);
    }

    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.customerId.toString() !== userId) {
      throw new AppError('Forbidden: you do not own this order', 403);
    }

    if (!order.razorpayOrderId) {
      throw new AppError('Order has no gateway checkout session associated', 400);
    }

    const mockPaymentId = `pay_sim_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const result = await processPaymentSuccess({
      razorpayOrderId: order.razorpayOrderId,
      razorpayPaymentId: mockPaymentId,
      razorpaySignature: 'simulated_success',
    });

    res.status(200).json({
      success: true,
      message: 'Simulated payment succeeded and recorded',
      data: {
        orderId: result.order._id,
        orderNumber: result.order.orderNumber,
        paymentStatus: result.order.paymentStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles incoming Razorpay Route & Payment Webhooks.
 * POST /api/v1/webhooks/razorpay
 */
export const handleRazorpayWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const rawBody = req.body; // Buffer from express.raw()

    if (!rawBody || (Buffer.isBuffer(rawBody) && rawBody.length === 0)) {
      return res.status(400).json({ message: 'Empty webhook payload' });
    }

    const isVerified = verifyWebhookSignature(rawBody, signature || '');
    if (!isVerified) {
      return res.status(400).json({ message: 'Invalid webhook signature' });
    }

    let payload: any;
    try {
      const bodyStr = Buffer.isBuffer(rawBody) ? rawBody.toString('utf-8') : rawBody;
      payload = typeof bodyStr === 'string' ? JSON.parse(bodyStr) : bodyStr;
    } catch {
      return res.status(400).json({ message: 'Malformed JSON payload' });
    }

    const event = payload.event;
    const eventId = payload.id || `evt_${Date.now()}`;

    switch (event) {
      case 'payment.captured': {
        const paymentEntity = payload.payload?.payment?.entity;
        if (paymentEntity?.order_id) {
          await processPaymentSuccess({
            razorpayOrderId: paymentEntity.order_id,
            razorpayPaymentId: paymentEntity.id,
            eventId,
          });
        }
        break;
      }

      case 'payment.failed': {
        const paymentEntity = payload.payload?.payment?.entity;
        if (paymentEntity?.order_id) {
          await processPaymentFailure({
            razorpayOrderId: paymentEntity.order_id,
            reason: paymentEntity.error_description || 'Payment failed',
            eventId,
          });
        }
        break;
      }

      default:
        // Ignore unhandled events safely
        break;
    }

    return res.status(200).json({ status: 'ok', handled: true });
  } catch (error) {
    next(error);
  }
};
