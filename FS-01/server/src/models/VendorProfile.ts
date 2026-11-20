import mongoose, { Document, Model, Schema } from 'mongoose';
import slugify from 'slugify';
import { ApprovalStatus } from '../types';

export interface IVendorProfile extends Document {
  userId: mongoose.Types.ObjectId;
  storeName: string;
  slug: string;
  description?: string;
  logo?: string;
  contactEmail: string;
  contactPhone: string;
  approvalStatus: ApprovalStatus;
  rejectionReason?: string;
  razorpayLinkedAccountId?: string;
  paymentProviderAccountId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const vendorProfileSchema = new Schema<IVendorProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    storeName: {
      type: String,
      required: [true, 'Store name is required'],
      trim: true,
      maxlength: [100, 'Store name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    logo: {
      type: String,
    },
    contactEmail: {
      type: String,
      required: [true, 'Contact email is required'],
      lowercase: true,
      trim: true,
    },
    contactPhone: {
      type: String,
      required: [true, 'Contact phone is required'],
      trim: true,
    },
    approvalStatus: {
      type: String,
      enum: Object.values(ApprovalStatus),
      default: ApprovalStatus.PENDING,
      index: true,
    },
    rejectionReason: {
      type: String,
    },
    razorpayLinkedAccountId: {
      type: String,
    },
    paymentProviderAccountId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

vendorProfileSchema.pre('validate', function () {
  if (this.storeName && !this.slug) {
    this.slug = slugify(this.storeName, { lower: true, strict: true });
  }
});

export const VendorProfile: Model<IVendorProfile> =
  mongoose.model<IVendorProfile>('VendorProfile', vendorProfileSchema);
export default VendorProfile;
