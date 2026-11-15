import mongoose from 'mongoose';
import { getCart, clearCart, HydratedCartItem } from './cart.service';
import Order, { IAddressSnapshot } from '../models/Order';
import SellerOrder from '../models/SellerOrder';
import InventoryReservation from '../models/InventoryReservation';
import Product from '../models/Product';
import { createGatewayOrder } from './payment.service';
import { validateCoupon, incrementCouponUsage } from './coupon.service';
import { env } from '../config';
import { FulfillmentStatus, PaymentStatus, TransferStatus } from '../types';
import { AppError } from '../middleware/errorHandler';

export interface VendorPackagePreview {
  vendorId: string;
  vendorName: string;
  items: HydratedCartItem[];
  subtotalPaise: number;
  estimatedCommissionPaise: number;
  estimatedVendorNetPaise: number;
}

export interface CheckoutPreviewResponse {
  vendorPackages: VendorPackagePreview[];
  itemSubtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  taxPaise: number;
  totalPaise: number;
  itemCount: number;
}

const ALLOWED_TRANSITIONS: Record<FulfillmentStatus, FulfillmentStatus[]> = {
  [FulfillmentStatus.PLACED]: [FulfillmentStatus.PACKED, FulfillmentStatus.CANCELLED],
  [FulfillmentStatus.PACKED]: [FulfillmentStatus.SHIPPED, FulfillmentStatus.CANCELLED],
  [FulfillmentStatus.SHIPPED]: [FulfillmentStatus.DELIVERED],
  [FulfillmentStatus.DELIVERED]: [],
  [FulfillmentStatus.CANCELLED]: [],
};

/**
 * Previews financial breakdown and per-vendor packages without creating database records.
 */
export const previewCheckout = async (
  userId: string,
  _address: IAddressSnapshot,
  couponCode?: string
): Promise<CheckoutPreviewResponse> => {
  const cart = await getCart(userId);

  if (cart.items.length === 0) {
    throw new AppError('Your cart is empty. Please add items before checking out.', 400);
  }

  let discountPaise = 0;
  if (couponCode) {
    const couponRes = await validateCoupon(couponCode, cart.subtotalPaise);
    discountPaise = couponRes.discountPaise;
  }

  // Group items by vendor
  const vendorMap = new Map<string, { vendorName: string; items: HydratedCartItem[] }>();

  for (const item of cart.items) {
    const vId = item.product.vendor?._id || 'unknown';
    const vName = item.product.vendor?.storeName || 'Verified Merchant';

    if (!vendorMap.has(vId)) {
      vendorMap.set(vId, { vendorName: vName, items: [] });
    }
    vendorMap.get(vId)!.items.push(item);
  }

  const commissionRate = env.DEFAULT_COMMISSION_RATE;
  const vendorPackages: VendorPackagePreview[] = [];

  for (const [vId, group] of vendorMap.entries()) {
    const rawSubtotal = group.items.reduce((sum, item) => sum + item.lineTotalPaise, 0);
    const allocatedDiscount =
      cart.subtotalPaise > 0
        ? Math.round((discountPaise * rawSubtotal) / cart.subtotalPaise)
        : 0;
    const pkgSubtotal = Math.max(0, rawSubtotal - allocatedDiscount);
    const commPaise = Math.round(pkgSubtotal * commissionRate);
    const netPaise = pkgSubtotal - commPaise;

    vendorPackages.push({
      vendorId: vId,
      vendorName: group.vendorName,
      items: group.items,
      subtotalPaise: pkgSubtotal,
      estimatedCommissionPaise: commPaise,
      estimatedVendorNetPaise: netPaise,
    });
  }

  const shippingPaise = 0; // Free delivery
  const taxPaise = 0; // Inclusive
  const totalPaise = Math.max(0, cart.subtotalPaise - discountPaise + shippingPaise + taxPaise);

  return {
    vendorPackages,
    itemSubtotalPaise: cart.subtotalPaise,
    discountPaise,
    shippingPaise,
    taxPaise,
    totalPaise,
    itemCount: cart.itemCount,
  };
};

/**
 * Creates atomic checkout session: reserves stock, creates Parent Order + SellerOrders.
 */
export const createCheckoutSession = async (
  userId: string,
  address: IAddressSnapshot,
  couponCode?: string
) => {
  const cart = await getCart(userId);

  if (cart.items.length === 0) {
    throw new AppError('Your cart is empty', 400);
  }

  let discountPaise = 0;
  let appliedCoupon: any = null;

  if (couponCode) {
    const couponRes = await validateCoupon(couponCode, cart.subtotalPaise);
    discountPaise = couponRes.discountPaise;
    appliedCoupon = couponRes.coupon;
  }

  // 1. Atomically reserve inventory for every item
  const reservedItems: { productId: string; quantity: number }[] = [];

  for (const item of cart.items) {
    const updateResult = await Product.updateOne(
      {
        _id: item.productId,
        stock: { $gte: item.quantity },
      },
      {
        $inc: { stock: -item.quantity },
      }
    );

    if (updateResult.modifiedCount === 0) {
      // Rollback previous reservations
      for (const resItem of reservedItems) {
        await Product.updateOne(
          { _id: resItem.productId },
          { $inc: { stock: resItem.quantity } }
        );
      }
      throw new AppError(
        `Insufficient stock for "${item.product.title}". Another customer may have just purchased the remaining units.`,
        400
      );
    }

    reservedItems.push({
      productId: item.productId,
      quantity: item.quantity,
    });
  }

  try {
    const shippingPaise = 0;
    const taxPaise = 0;
    const totalPaise = Math.max(
      0,
      cart.subtotalPaise - discountPaise + shippingPaise + taxPaise
    );

    // 2. Create Parent Order
    const parentOrder = await Order.create({
      customerId: new mongoose.Types.ObjectId(userId),
      addressSnapshot: address,
      itemSubtotalPaise: cart.subtotalPaise,
      discountPaise,
      shippingPaise,
      taxPaise,
      totalPaise,
      couponId: appliedCoupon?._id,
      couponSnapshot: appliedCoupon
        ? {
            code: appliedCoupon.code,
            type: appliedCoupon.type,
            value: appliedCoupon.valuePaise || appliedCoupon.percentage || 0,
          }
        : undefined,
      paymentStatus: PaymentStatus.PENDING,
    });

    // Create payment gateway order and Payment document
    const gatewayOrder = await createGatewayOrder(
      parentOrder._id.toString(),
      totalPaise,
      parentOrder.orderNumber
    );
    parentOrder.razorpayOrderId = gatewayOrder.razorpayOrderId;
    await parentOrder.save();

    // 3. Create Inventory Reservation records (expires in 15 minutes)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const reservations = reservedItems.map((r) => ({
      orderId: parentOrder._id,
      productId: new mongoose.Types.ObjectId(r.productId),
      quantity: r.quantity,
      status: 'HELD',
      expiresAt,
    }));
    await InventoryReservation.insertMany(reservations);

    // 4. Group items by vendor and create SellerOrder records
    const vendorMap = new Map<string, HydratedCartItem[]>();
    for (const item of cart.items) {
      const vId = item.product.vendor?._id;
      if (!vId) continue;
      if (!vendorMap.has(vId)) {
        vendorMap.set(vId, []);
      }
      vendorMap.get(vId)!.push(item);
    }

    const commissionRate = env.DEFAULT_COMMISSION_RATE;
    const sellerOrdersToCreate = [];

    for (const [vendorId, vItems] of vendorMap.entries()) {
      const rawSubtotal = vItems.reduce(
        (sum, item) => sum + item.lineTotalPaise,
        0
      );
      const allocatedDiscount =
        cart.subtotalPaise > 0
          ? Math.round((discountPaise * rawSubtotal) / cart.subtotalPaise)
          : 0;
      const vendorSubtotalPaise = Math.max(0, rawSubtotal - allocatedDiscount);
      const commissionPaise = Math.round(vendorSubtotalPaise * commissionRate);
      const vendorNetPaise = vendorSubtotalPaise - commissionPaise;

      const orderItems = vItems.map((item) => ({
        productId: new mongoose.Types.ObjectId(item.productId),
        productSnapshot: {
          title: item.product.title,
          pricePaise: item.product.pricePaise,
          image: item.product.images?.[0]?.url,
        },
        quantity: item.quantity,
        lineTotalPaise: item.lineTotalPaise,
      }));

      sellerOrdersToCreate.push({
        orderId: parentOrder._id,
        vendorId: new mongoose.Types.ObjectId(vendorId),
        items: orderItems,
        vendorSubtotalPaise,
        commissionRate,
        commissionPaise,
        vendorNetPaise,
        fulfillmentStatus: FulfillmentStatus.PLACED,
        transferStatus: TransferStatus.PENDING,
      });
    }

    const createdSellerOrders = await SellerOrder.insertMany(sellerOrdersToCreate);

    // 5. Increment coupon usage if applied
    if (appliedCoupon) {
      await incrementCouponUsage(appliedCoupon._id.toString());
    }

    // 6. Clear cart in Redis upon checkout session creation
    await clearCart(userId);

    return {
      order: parentOrder,
      sellerOrders: createdSellerOrders,
      razorpayOrderId: parentOrder.razorpayOrderId,
      amountPaise: parentOrder.totalPaise,
      keyId: gatewayOrder.keyId,
    };
  } catch (error) {
    // If order creation failed, rollback inventory
    for (const resItem of reservedItems) {
      await Product.updateOne(
        { _id: resItem.productId },
        { $inc: { stock: resItem.quantity } }
      );
    }
    throw error;
  }
};

/**
 * Returns paginated customer order history.
 */
export const getCustomerOrders = async (
  userId: string,
  page = 1,
  limit = 10
) => {
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find({ customerId: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments({ customerId: userId }),
  ]);

  const orderIds = orders.map((o) => o._id);
  const sellerOrders = await SellerOrder.find({ orderId: { $in: orderIds } })
    .populate('vendorId', 'storeName slug')
    .lean();

  const sellerOrdersByOrderId = new Map<string, any[]>();
  sellerOrders.forEach((so) => {
    const key = so.orderId.toString();
    if (!sellerOrdersByOrderId.has(key)) {
      sellerOrdersByOrderId.set(key, []);
    }
    sellerOrdersByOrderId.get(key)!.push(so);
  });

  const enrichedOrders = orders.map((o) => ({
    ...o,
    sellerOrders: sellerOrdersByOrderId.get(o._id.toString()) || [],
  }));

  return {
    orders: enrichedOrders,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  };
};

/**
 * Returns single customer order detail with seller orders.
 */
export const getCustomerOrderById = async (userId: string, orderId: string) => {
  const order = await Order.findOne({
    _id: orderId,
    customerId: userId,
  }).lean();

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  const sellerOrders = await SellerOrder.find({ orderId: order._id })
    .populate('vendorId', 'storeName slug logo')
    .lean();

  return {
    ...order,
    sellerOrders,
  };
};

/**
 * Returns seller orders belonging to a specific vendor.
 */
export const getVendorOrders = async (
  vendorId: string,
  status?: string,
  page = 1,
  limit = 10
) => {
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = { vendorId };
  if (status) {
    filter.fulfillmentStatus = status;
  }

  const [sellerOrders, total] = await Promise.all([
    SellerOrder.find(filter)
      .populate('orderId', 'orderNumber addressSnapshot paymentStatus createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    SellerOrder.countDocuments(filter),
  ]);

  return {
    sellerOrders,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  };
};

/**
 * Updates fulfillment status with strict state machine verification.
 */
export const updateSellerOrderStatus = async (
  vendorId: string,
  sellerOrderId: string,
  newStatus: FulfillmentStatus,
  trackingNumber?: string,
  trackingUrl?: string
) => {
  const sellerOrder = await SellerOrder.findById(sellerOrderId);

  if (!sellerOrder) {
    throw new AppError('Seller order not found', 404);
  }

  if (sellerOrder.vendorId.toString() !== vendorId.toString()) {
    throw new AppError('You do not have permission to manage this shipment', 403);
  }

  const currentStatus = sellerOrder.fulfillmentStatus;
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];

  if (!allowed.includes(newStatus)) {
    throw new AppError(
      `Invalid fulfillment status transition from ${currentStatus} to ${newStatus}. Permitted next states: [${allowed.join(
        ', '
      )}]`,
      400
    );
  }

  sellerOrder.fulfillmentStatus = newStatus;
  if (trackingNumber) sellerOrder.trackingNumber = trackingNumber;
  if (trackingUrl) sellerOrder.trackingUrl = trackingUrl;

  await sellerOrder.save();
  return sellerOrder;
};
