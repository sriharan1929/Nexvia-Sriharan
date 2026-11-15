import mongoose, { Document, Model, Schema } from 'mongoose';

export type GatewayPaymentStatus = 'CREATED' | 'CAPTURED' | 'FAILED' | 'REFUNDED';

export interface IWebhookEvent {
  eventId: string;
  event: string;
  receivedAt: Date;
}

export interface IPayment extends Document {
  orderId: mongoose.Types.ObjectId;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  amountPaise: number;
  currency: string;
  status: GatewayPaymentStatus;
  webhookEvents: IWebhookEvent[];
  createdAt: Date;
  updatedAt: Date;
}

const webhookEventSchema = new Schema<IWebhookEvent>(
  {
    eventId: { type: String, required: true },
    event: { type: String, required: true },
    receivedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const paymentSchema = new Schema<IPayment>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    razorpayOrderId: {
      type: String,
      required: true,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      index: true,
    },
    razorpaySignature: {
      type: String,
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
      enum: ['CREATED', 'CAPTURED', 'FAILED', 'REFUNDED'],
      default: 'CREATED',
      index: true,
    },
    webhookEvents: [webhookEventSchema],
  },
  {
    timestamps: true,
  }
);

export const Payment: Model<IPayment> = mongoose.model<IPayment>('Payment', paymentSchema);

