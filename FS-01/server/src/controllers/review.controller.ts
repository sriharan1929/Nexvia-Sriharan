import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import {
  createProductReview,
  getProductReviews,
} from '../services/review.service';

export const createProductReviewHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const productId = req.params.id as string;
    const userId = req.user!.id;
    const { rating, title, comment } = req.body;

    const review = await createProductReview({
      userId,
      productId,
      rating: Number(rating),
      title,
      comment,
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: { review },
    });
  } catch (error) {
    next(error);
  }
};

export const getProductReviewsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const productId = req.params.id as string;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;

    const result = await getProductReviews(productId, page, limit);

    res.status(200).json({
      success: true,
      data: result.reviews,
      pagination: {
        page: result.page,
        limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};
