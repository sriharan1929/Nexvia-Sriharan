import mongoose, { Document, Model, Schema } from 'mongoose';
import { PaymentStatus } from '../types';
import { nanoid } from 'nanoid';

export interface IAddressSnapshot {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  customerId: mongoose.Types.ObjectId;
  addressSnapshot: IAddressSnapshot;
  itemSubtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  taxPaise: number;
  totalPaise: number;
  couponId?: mongoose.Types.ObjectId;
  couponSnapshot?: {
    code: string;
    type: string;
    value: number;
  };
  paymentStatus: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IAddressSnapshot>(
  {
    name: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    addressSnapshot: {
      type: addressSchema,
      required: true,
    },
    itemSubtotalPaise: {
      type: Number,
      required: true,
      min: 0,
    },
    discountPaise: {
      type: Number,
      default: 0,
      min: 0,
    },
    shippingPaise: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxPaise: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPaise: {
      type: Number,
      required: true,
      min: 0,
    },
    couponId: {
      type: Schema.Types.ObjectId,
      ref: 'Coupon',
      default: null,
    },
    couponSnapshot: {
      code: String,
      type: { type: String },
      value: Number,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
      index: true,
    },
    razorpayOrderId: {
      type: String,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ customerId: 1, createdAt: -1 });

orderSchema.pre('validate', function () {
  if (!this.orderNumber) {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = nanoid(6).toUpperCase();
    this.orderNumber = `BV-${dateStr}-${randomSuffix}`;
  }
});

export const Order: Model<IOrder> = mongoose.model<IOrder>('Order', orderSchema);
export default Order;

