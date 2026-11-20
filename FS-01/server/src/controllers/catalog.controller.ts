import { Request, Response, NextFunction } from 'express';
import Product from '../models/Product';
import Category from '../models/Category';
import { ProductStatus } from '../types';
import { AppError } from '../middleware/errorHandler';
import { searchProducts } from '../services/search.service';

export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 12;
    const minPrice = req.query.minPrice
      ? parseInt(req.query.minPrice as string, 10)
      : undefined;
    const maxPrice = req.query.maxPrice
      ? parseInt(req.query.maxPrice as string, 10)
      : undefined;

    const result = await searchProducts({
      q: req.query.q as string,
      category: req.query.category as string,
      minPrice,
      maxPrice,
      sort: req.query.sort as string,
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      source: result.source,
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
