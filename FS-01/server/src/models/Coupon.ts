import mongoose, { Document, Model, Schema } from 'mongoose';

export type CouponType = 'PERCENTAGE' | 'FIXED';

export interface ICoupon extends Document {
  code: string;
  type: CouponType;
  valuePaise?: number;
  percentage?: number;
  minOrderPaise: number;
  maxDiscountPaise?: number;
  usageLimit: number;
  usedCount: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['PERCENTAGE', 'FIXED'],
      required: true,
    },
    valuePaise: {
      type: Number,
      min: 0,
    },
    percentage: {
      type: Number,
      min: 1,
      max: 100,
    },
    minOrderPaise: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDiscountPaise: {
      type: Number,
      min: 0,
    },
    usageLimit: {
      type: Number,
      default: 1000,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    validFrom: {
      type: Date,
      required: true,
      default: Date.now,
    },
    validUntil: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

couponSchema.pre('validate', function () {
  if (this.code) {
    this.code = this.code.trim().toUpperCase();
  }
});

export const Coupon: Model<ICoupon> = mongoose.model<ICoupon>('Coupon', couponSchema);
export default Coupon;
