import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, ApprovalStatus, ProductStatus, UserRole } from '../types';
import VendorProfile from '../models/VendorProfile';
import Product from '../models/Product';
import User from '../models/User';
import { AppError } from '../middleware/errorHandler';
import { indexProduct, deleteProductFromIndex } from '../services/search.service';
import slugify from 'slugify';

export const applyVendor = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { storeName, description, contactEmail, contactPhone, logo } = req.body;

    const existingProfile = await VendorProfile.findOne({ userId });
    if (existingProfile) {
      throw new AppError(
        'You have already submitted a seller application. Current status: ' +
          existingProfile.approvalStatus,
        400
      );
    }

    // Generate unique slug
    let slug = slugify(storeName, { lower: true, strict: true });
    const slugExists = await VendorProfile.findOne({ slug });
    if (slugExists) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const vendorProfile = await VendorProfile.create({
      userId,
      storeName,
      slug,
      description,
      contactEmail,
      contactPhone,
      logo,
      approvalStatus: ApprovalStatus.PENDING,
    });

    // Add VENDOR role to User
    await User.findByIdAndUpdate(userId, {
      $addToSet: { roles: UserRole.VENDOR },
    });

    res.status(201).json({
      success: true,
      message: 'Seller application submitted successfully and is pending review',
      data: { vendorProfile },
    });
  } catch (error) {
    next(error);
  }
};

export const getVendorProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const vendorProfile = await VendorProfile.findOne({ userId: req.user!.id });
    if (!vendorProfile) {
      throw new AppError('Vendor profile not found', 404);
    }

    res.status(200).json({
      success: true,
      data: { vendorProfile },
    });
  } catch (error) {
    next(error);
  }
};

export const updateVendorProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { storeName, description, contactEmail, contactPhone, logo } = req.body;

    const vendorProfile = await VendorProfile.findOne({ userId: req.user!.id });
    if (!vendorProfile) {
      throw new AppError('Vendor profile not found', 404);
    }

    if (storeName && storeName !== vendorProfile.storeName) {
      let slug = slugify(storeName, { lower: true, strict: true });
      const slugExists = await VendorProfile.findOne({ slug, _id: { $ne: vendorProfile._id } });
      if (slugExists) {
        slug = `${slug}-${Date.now().toString(36)}`;
      }
      vendorProfile.storeName = storeName;
      vendorProfile.slug = slug;
    }

    if (description !== undefined) vendorProfile.description = description;
    if (contactEmail) vendorProfile.contactEmail = contactEmail;
    if (contactPhone) vendorProfile.contactPhone = contactPhone;
    if (logo !== undefined) vendorProfile.logo = logo;

    await vendorProfile.save();

    res.status(200).json({
      success: true,
      message: 'Vendor profile updated successfully',
      data: { vendorProfile },
    });
  } catch (error) {
    next(error);
  }
};

export const getVendorProducts = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      vendorId: req.vendor._id,
      status: { $ne: ProductStatus.ARCHIVED },
    };

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('categoryId', 'name slug')
        .sort({ createdAt: -1 })
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

export const createVendorProduct = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      title,
      description,
      pricePaise,
      compareAtPricePaise,
      stock,
      categoryId,
      images,
      status,
      tags,
    } = req.body;

    const product = await Product.create({
      vendorId: req.vendor._id,
      categoryId,
      title,
      description,
      pricePaise,
      compareAtPricePaise,
      stock,
      images,
      status: status || ProductStatus.ACTIVE,
      tags,
    });

    // Synchronize to Elasticsearch index if active
    if (product.status === ProductStatus.ACTIVE) {
      indexProduct(product).catch((err) =>
        console.warn('[Elasticsearch] Index error on create:', err.message)
      );
    }

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

export const updateVendorProduct = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Strict ownership verification:
    if (product.vendorId.toString() !== req.vendor._id.toString()) {
      throw new AppError('You do not have permission to edit this product', 403);
    }

    const allowedUpdates = [
      'title',
      'description',
      'pricePaise',
      'compareAtPricePaise',
      'stock',
      'categoryId',
      'images',
      'status',
      'tags',
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        (product as any)[field] = req.body[field];
      }
    });

    await product.save();

    // Synchronize to Elasticsearch index
    if (product.status === ProductStatus.ACTIVE) {
      indexProduct(product).catch((err) =>
        console.warn('[Elasticsearch] Index error on update:', err.message)
      );
    } else {
      deleteProductFromIndex(product._id.toString()).catch((err) =>
        console.warn('[Elasticsearch] Delete error on update:', err.message)
      );
    }

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteVendorProduct = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Strict ownership verification:
    if (product.vendorId.toString() !== req.vendor._id.toString()) {
      throw new AppError('You do not have permission to delete this product', 403);
    }

    // Soft delete: set status to ARCHIVED
    product.status = ProductStatus.ARCHIVED;
    await product.save();

    // Remove from Elasticsearch index
    deleteProductFromIndex(product._id.toString()).catch((err) =>
      console.warn('[Elasticsearch] Delete error on archive:', err.message)
    );

    res.status(200).json({
      success: true,
      message: 'Product archived successfully',
    });
  } catch (error) {
    next(error);
  }
};

