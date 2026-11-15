import mongoose, { Document, Model, Schema } from 'mongoose';

export type ReservationStatus = 'HELD' | 'CONFIRMED' | 'RELEASED';

export interface IInventoryReservation extends Document {
  orderId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  quantity: number;
  status: ReservationStatus;
  expiresAt: Date;
  createdAt: Date;
}

const inventoryReservationSchema = new Schema<IInventoryReservation>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ['HELD', 'CONFIRMED', 'RELEASED'],
      default: 'HELD',
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

inventoryReservationSchema.index({ expiresAt: 1, status: 1 });

export const InventoryReservation: Model<IInventoryReservation> =
  mongoose.model<IInventoryReservation>(
    'InventoryReservation',
    inventoryReservationSchema
  );
export default InventoryReservation;

