import { Request, Response, NextFunction } from 'express';
import Product from '../models/Product';
import Category from '../models/Category';
import { ProductStatus } from '../types';
import { AppError } from '../middleware/errorHandler';

export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 12;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      status: ProductStatus.ACTIVE,
    };

    // Category filter (by id or slug)
    if (req.query.category) {
      const categoryParam = req.query.category as string;
      const category = await Category.findOne({
        $or: [{ _id: categoryParam.match(/^[0-9a-fA-F]{24}$/) ? categoryParam : null }, { slug: categoryParam }],
        isActive: true,
      });
      if (category) {
        filter.categoryId = category._id;
      }
    }

    // Price range filters (in paise or INR)
    if (req.query.minPrice || req.query.maxPrice) {
      filter.pricePaise = {};
      if (req.query.minPrice) {
        const min = parseInt(req.query.minPrice as string, 10);
        // If min < 1000, consider if sent as INR or paise; typically paise
        filter.pricePaise.$gte = min;
      }
      if (req.query.maxPrice) {
        const max = parseInt(req.query.maxPrice as string, 10);
        filter.pricePaise.$lte = max;
      }
    }

    // Text search query fallback (before Elasticsearch in Phase 3)
    if (req.query.q) {
      const queryText = (req.query.q as string).trim();
      filter.$or = [
        { title: { $regex: queryText, $options: 'i' } },
        { description: { $regex: queryText, $options: 'i' } },
        { tags: { $in: [new RegExp(queryText, 'i')] } },
      ];
    }

    // Sort order
    let sortOptions: Record<string, any> = { createdAt: -1 };
    if (req.query.sort === 'price_asc') {
      sortOptions = { pricePaise: 1 };
    } else if (req.query.sort === 'price_desc') {
      sortOptions = { pricePaise: -1 };
    } else if (req.query.sort === 'rating') {
      sortOptions = { 'ratingSummary.average': -1, createdAt: -1 };
    } else if (req.query.sort === 'newest') {
      sortOptions = { createdAt: -1 };
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('vendorId', 'storeName slug logo')
        .populate('categoryId', 'name slug')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProductBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { slug } = req.params;

    const product = await Product.findOne({
      slug,
      status: ProductStatus.ACTIVE,
    })
      .populate('vendorId', 'storeName slug description logo')
      .populate('categoryId', 'name slug');

    if (!product) {
      throw new AppError('Product not found or is currently unavailable', 404);
    }

    res.status(200).json({
      success: true,
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

export const getCategories = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};
