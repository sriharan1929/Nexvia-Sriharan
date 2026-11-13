import mongoose, { Document, Model, Schema } from 'mongoose';
import slugify from 'slugify';
import { ProductStatus } from '../types';

export interface IProductImage {
  key: string;
  url: string;
  order: number;
}

export interface IProduct extends Document {
  vendorId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  pricePaise: number;
  compareAtPricePaise?: number;
  stock: number;
  images: IProductImage[];
  status: ProductStatus;
  ratingSummary: {
    average: number;
    count: number;
  };
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const productImageSchema = new Schema<IProductImage>(
  {
    key: { type: String, required: true },
    url: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const productSchema = new Schema<IProduct>(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'VendorProfile',
      required: true,
      index: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
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
      required: [true, 'Description is required'],
    },
    pricePaise: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be a positive number in paise'],
    },
    compareAtPricePaise: {
      type: Number,
      min: [0, 'Compare at price must be positive'],
    },
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    images: {
      type: [productImageSchema],
      default: [],
    },
    status: {
      type: String,
      enum: Object.values(ProductStatus),
      default: ProductStatus.ACTIVE,
      index: true,
    },
    ratingSummary: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 },
    },
    tags: [{ type: String, trim: true }],
  },
  {
    timestamps: true,
  }
);

productSchema.index({ vendorId: 1, status: 1 });
productSchema.index({ categoryId: 1, status: 1 });
productSchema.index({ status: 1, createdAt: -1 });

productSchema.pre('validate', function () {
  if (this.title && !this.slug) {
    const uniqueSuffix = Date.now().toString(36);
    this.slug = `${slugify(this.title, { lower: true, strict: true })}-${uniqueSuffix}`;
  }
});

export const Product: Model<IProduct> = mongoose.model<IProduct>(
  'Product',
  productSchema
);
export default Product;
