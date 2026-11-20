import mongoose from 'mongoose';
import Review, { IReview } from '../models/Review';
import Order from '../models/Order';
import SellerOrder from '../models/SellerOrder';
import Product from '../models/Product';
import User from '../models/User';
import { AppError } from '../middleware/errorHandler';
import { FulfillmentStatus, PaymentStatus } from '../types';

export const createProductReview = async (params: {
  userId: string;
  productId: string;
  rating: number;
  title: string;
  comment: string;
}) => {
  const { userId, productId, rating, title, comment } = params;

  if (!rating || rating < 1 || rating > 5) {
    throw new AppError('Rating must be an integer between 1 and 5', 400);
  }

  const existingReview = await Review.findOne({
    customerId: new mongoose.Types.ObjectId(userId),
    productId: new mongoose.Types.ObjectId(productId),
  });

  if (existingReview) {
    throw new AppError('You have already submitted a review for this product', 400);
  }

  const customerOrders = await Order.find({
    customerId: new mongoose.Types.ObjectId(userId),
    paymentStatus: PaymentStatus.PAID,
  }).select('_id');

  const orderIds = customerOrders.map((o) => o._id);

  if (orderIds.length === 0) {
    throw new AppError(
      'Verified purchase required: You can only review products you have purchased and received',
      403
    );
  }

  const matchingSellerOrder = await SellerOrder.findOne({
    orderId: { $in: orderIds },
    'items.productId': new mongoose.Types.ObjectId(productId),
    fulfillmentStatus: FulfillmentStatus.DELIVERED,
  });

  if (!matchingSellerOrder) {
    throw new AppError(
      'Only delivered purchases can be reviewed. Your order may still be in transit or unpaid.',
      403
    );
  }

  const user = await User.findById(userId);
  const customerName = user ? user.name : 'Verified Customer';

  const review = await Review.create({
    productId: new mongoose.Types.ObjectId(productId),
    customerId: new mongoose.Types.ObjectId(userId),
    orderId: matchingSellerOrder.orderId,
    sellerOrderId: matchingSellerOrder._id,
    customerName,
    rating,
    title,
    comment,
    isVerifiedPurchase: true,
  });

  const stats = await Review.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: '$productId',
        avgRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    const avg = Math.round(stats[0].avgRating * 10) / 10;
    const count = stats[0].reviewCount;

    await Product.findByIdAndUpdate(productId, {
      ratingSummary: {
        average: avg,
        count,
      },
    });
  }

  return review;
};

export const getProductReviews = async (
  productId: string,
  page: number = 1,
  limit: number = 10
) => {
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    Review.find({ productId: new mongoose.Types.ObjectId(productId) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments({ productId: new mongoose.Types.ObjectId(productId) }),
  ]);

  return {
    reviews,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};
