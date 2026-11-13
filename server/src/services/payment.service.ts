import crypto from 'crypto';
import mongoose from 'mongoose';
import Razorpay from 'razorpay';
import { env } from '../config';
import { Order } from '../models/Order';
import { SellerOrder } from '../models/SellerOrder';
import { VendorProfile } from '../models/VendorProfile';
import { Payment } from '../models/Payment';
import { VendorTransfer } from '../models/VendorTransfer';
import { InventoryReservation } from '../models/InventoryReservation';
import { Product } from '../models/Product';
import { AppError } from '../middleware/errorHandler';
import { PaymentStatus, TransferStatus } from '../types';

// Initialize Razorpay SDK instance if keys are configured
const isLiveConfigured =
  Boolean(env.RAZORPAY_KEY_ID) &&
  Boolean(env.RAZORPAY_KEY_SECRET) &&
  !env.RAZORPAY_KEY_ID.includes('mock');

const razorpay = isLiveConfigured
  ? new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    })
  : null;

/**
 * Creates or retrieves a Razorpay Order for a pending BadaVyapar checkout.
 */
export const createGatewayOrder = async (
  orderId: string,
  amountPaise: number,
  receipt: string
) => {
  let razorpayOrderId: string;

  if (razorpay) {
    const rzpOrder = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt,
      notes: { orderId },
    });
    razorpayOrderId = rzpOrder.id;
  } else {
    // Deterministic mock order ID for testing / development without live credentials
    razorpayOrderId = `order_mock_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
  }

  // Record initial Payment entity
  await Payment.create({
    orderId: new mongoose.Types.ObjectId(orderId),
    razorpayOrderId,
    amountPaise,
    currency: 'INR',
    status: 'CREATED',
    webhookEvents: [],
  });

  // Attach razorpayOrderId to parent order
  await Order.findByIdAndUpdate(orderId, { razorpayOrderId });

  return {
    razorpayOrderId,
    amountPaise,
    currency: 'INR',
    keyId: env.RAZORPAY_KEY_ID || 'rzp_test_mock_badavyapar',
  };
};

/**
 * Verifies Razorpay checkout HMAC-SHA256 signature.
 */
export const verifyClientSignature = (
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
  secretOverride?: string
): boolean => {
  // Allow simulated signatures in development/test
  if (!isLiveConfigured) {
    if (razorpaySignature.startsWith('mock_sig') || razorpaySignature === 'simulated_success') {
      return true;
    }
  }

  const secret = secretOverride || env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    return false;
  }

  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  return generatedSignature === razorpaySignature;
};

/**
 * Verifies incoming Razorpay Webhook signature against raw payload.
 */
export const verifyWebhookSignature = (
  rawBody: string | Buffer,
  signature: string,
  secretOverride?: string
): boolean => {
  const secret = secretOverride || env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  return expectedSignature === signature;
};

/**
 * Processes successful payment capture idempotently.
 * Updates Order to PAID, confirms inventory, and executes vendor Route transfers.
 */
export const processPaymentSuccess = async (params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature?: string;
  eventId?: string;
}) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, eventId } = params;

  // 1. Find Order by razorpayOrderId
  const order = await Order.findOne({ razorpayOrderId });
  if (!order) {
    throw new AppError(`Order not found for Razorpay Order ${razorpayOrderId}`, 404);
  }

  // 2. Fetch or create Payment record
  let payment = await Payment.findOne({ razorpayOrderId });
  if (!payment) {
    payment = await Payment.create({
      orderId: order._id,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      amountPaise: order.totalPaise,
      currency: 'INR',
      status: 'CAPTURED',
      webhookEvents: [],
    });
  }

  // Idempotency check: if eventId is provided and already recorded, skip duplicate work
  if (eventId) {
    const isAlreadyHandled = payment.webhookEvents.some((ev) => ev.eventId === eventId);
    if (isAlreadyHandled) {
      return { order, payment, alreadyProcessed: true };
    }
    payment.webhookEvents.push({
      eventId,
      event: 'payment.captured',
      receivedAt: new Date(),
    });
  }

  // If already paid and captured, just return
  if (order.paymentStatus === PaymentStatus.PAID && payment.status === 'CAPTURED') {
    await payment.save();
    return { order, payment, alreadyProcessed: true };
  }

  // 3. Update Order and Payment status
  order.paymentStatus = PaymentStatus.PAID;
  order.razorpayPaymentId = razorpayPaymentId;
  await order.save();

  payment.status = 'CAPTURED';
  payment.razorpayPaymentId = razorpayPaymentId;
  if (razorpaySignature) {
    payment.razorpaySignature = razorpaySignature;
  }
  await payment.save();

  // 4. Confirm inventory reservations
  await InventoryReservation.updateMany(
    { orderId: order._id, status: 'HELD' },
    { status: 'CONFIRMED' }
  );

  // 5. Execute Razorpay Route Transfers to participating vendors
  const sellerOrders = await SellerOrder.find({ orderId: order._id });

  for (const sellerOrder of sellerOrders) {
    try {
      const vendor = await VendorProfile.findById(sellerOrder.vendorId);
      const linkedAccountId =
        vendor?.paymentProviderAccountId || vendor?.razorpayLinkedAccountId;

      if (!linkedAccountId) {
        // Vendor hasn't set up linked bank account; mark as PENDING for manual or post-setup transfer
        sellerOrder.transferStatus = TransferStatus.PENDING;
        await sellerOrder.save();

        await VendorTransfer.create({
          sellerOrderId: sellerOrder._id,
          orderId: order._id,
          vendorId: sellerOrder.vendorId,
          razorpayPaymentId,
          vendorAccountId: 'UNLINKED',
          amountPaise: sellerOrder.vendorNetPaise,
          currency: 'INR',
          status: TransferStatus.PENDING,
          failureReason: 'Vendor has not linked a payment account yet',
        });
        continue;
      }

      let transferId: string;

      if (razorpay) {
        // Live Razorpay Route transfer
        const transferResponse = await (razorpay.payments as any).transfer(
          razorpayPaymentId,
          {
            transfers: [
              {
                account: linkedAccountId,
                amount: sellerOrder.vendorNetPaise,
                currency: 'INR',
                notes: {
                  sellerOrderId: sellerOrder._id.toString(),
                  parentOrderId: order._id.toString(),
                },
              },
            ],
          }
        );
        transferId =
          transferResponse.items?.[0]?.id || `trf_${Date.now().toString(36)}`;
      } else {
        // Simulated Route Transfer
        transferId = `trf_mock_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
      }

      sellerOrder.transferStatus = TransferStatus.TRANSFERRED;
      sellerOrder.razorpayTransferId = transferId;
      await sellerOrder.save();

      await VendorTransfer.create({
        sellerOrderId: sellerOrder._id,
        orderId: order._id,
        vendorId: sellerOrder.vendorId,
        razorpayPaymentId,
        razorpayTransferId: transferId,
        vendorAccountId: linkedAccountId,
        amountPaise: sellerOrder.vendorNetPaise,
        currency: 'INR',
        status: TransferStatus.TRANSFERRED,
      });
    } catch (transferErr: any) {
      sellerOrder.transferStatus = TransferStatus.FAILED;
      await sellerOrder.save();

      await VendorTransfer.create({
        sellerOrderId: sellerOrder._id,
        orderId: order._id,
        vendorId: sellerOrder.vendorId,
        razorpayPaymentId,
        vendorAccountId: 'ERROR',
        amountPaise: sellerOrder.vendorNetPaise,
        currency: 'INR',
        status: TransferStatus.FAILED,
        failureReason: transferErr.message || 'Route transfer exception',
      });
    }
  }

  return { order, payment, alreadyProcessed: false };
};

/**
 * Handles payment failure: marks order FAILED, rolls back held inventory.
 */
export const processPaymentFailure = async (params: {
  razorpayOrderId: string;
  reason?: string;
  eventId?: string;
}) => {
  const { razorpayOrderId, reason, eventId } = params;

  const order = await Order.findOne({ razorpayOrderId });
  if (!order) return;

  let payment = await Payment.findOne({ razorpayOrderId });
  if (payment) {
    if (eventId) {
      payment.webhookEvents.push({
        eventId,
        event: 'payment.failed',
        receivedAt: new Date(),
      });
    }
    payment.status = 'FAILED';
    await payment.save();
  }

  order.paymentStatus = PaymentStatus.FAILED;
  await order.save();

  // Rollback inventory for held reservations
  const heldReservations = await InventoryReservation.find({
    orderId: order._id,
    status: 'HELD',
  });

  for (const reservation of heldReservations) {
    await Product.updateOne(
      { _id: reservation.productId },
      { $inc: { stock: reservation.quantity } }
    );
    reservation.status = 'RELEASED';
    await reservation.save();
  }
};
