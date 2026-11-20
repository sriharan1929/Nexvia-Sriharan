import mongoose, { Document, Model, Schema } from 'mongoose';
import { TransferStatus } from '../types';

export interface IVendorTransfer extends Document {
  sellerOrderId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  razorpayPaymentId: string;
  razorpayTransferId?: string;
  vendorAccountId: string;
  amountPaise: number;
  currency: string;
  status: TransferStatus;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const vendorTransferSchema = new Schema<IVendorTransfer>(
  {
    sellerOrderId: {
      type: Schema.Types.ObjectId,
      ref: 'SellerOrder',
      required: true,
      index: true,
    },
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
    razorpayPaymentId: {
      type: String,
      required: true,
      index: true,
    },
    razorpayTransferId: {
      type: String,
      index: true,
    },
    vendorAccountId: {
      type: String,
      required: true,
    },
    amountPaise: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: Object.values(TransferStatus),
      default: TransferStatus.PENDING,
      index: true,
    },
    failureReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const VendorTransfer: Model<IVendorTransfer> = mongoose.model<IVendorTransfer>(
  'VendorTransfer',
  vendorTransferSchema
);

