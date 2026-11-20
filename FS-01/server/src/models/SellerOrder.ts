import mongoose, { Document, Model, Schema } from 'mongoose';
import { FulfillmentStatus, TransferStatus } from '../types';

export interface ISellerOrderItem {
  productId: mongoose.Types.ObjectId;
  productSnapshot: {
    title: string;
    pricePaise: number;
    image?: string;
  };
  quantity: number;
  lineTotalPaise: number;
}

export interface ISellerOrder extends Document {
  orderId: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  items: ISellerOrderItem[];
  vendorSubtotalPaise: number;
  commissionRate: number;
  commissionPaise: number;
  vendorNetPaise: number;
  fulfillmentStatus: FulfillmentStatus;
  trackingNumber?: string;
  trackingUrl?: string;
  transferStatus: TransferStatus;
  razorpayTransferId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const sellerOrderItemSchema = new Schema<ISellerOrderItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productSnapshot: {
      title: { type: String, required: true },
      pricePaise: { type: Number, required: true },
      image: { type: String },
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    lineTotalPaise: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const sellerOrderSchema = new Schema<ISellerOrder>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'VendorProfile',
      required: true,
      index: true,
    },
    items: {
      type: [sellerOrderItemSchema],
      required: true,
    },
    vendorSubtotalPaise: {
      type: Number,
      required: true,
      min: 0,
    },
    commissionRate: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    commissionPaise: {
      type: Number,
      required: true,
      min: 0,
    },
    vendorNetPaise: {
      type: Number,
      required: true,
      min: 0,
    },
    fulfillmentStatus: {
      type: String,
      enum: Object.values(FulfillmentStatus),
      default: FulfillmentStatus.PLACED,
      index: true,
    },
    trackingNumber: {
      type: String,
      trim: true,
    },
    trackingUrl: {
      type: String,
      trim: true,
    },
    transferStatus: {
      type: String,
      enum: Object.values(TransferStatus),
      default: TransferStatus.PENDING,
      index: true,
    },
    razorpayTransferId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

sellerOrderSchema.index({ orderId: 1, vendorId: 1 });
sellerOrderSchema.index({ vendorId: 1, fulfillmentStatus: 1, createdAt: -1 });

export const SellerOrder: Model<ISellerOrder> = mongoose.model<ISellerOrder>(
  'SellerOrder',
  sellerOrderSchema
);
export default SellerOrder;
