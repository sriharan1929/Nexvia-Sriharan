import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, ApprovalStatus } from '../types';
import VendorProfile from '../models/VendorProfile';
import Category from '../models/Category';
import { AppError } from '../middleware/errorHandler';
import slugify from 'slugify';

export const listVendors = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (req.query.status) {
      filter.approvalStatus = req.query.status;
    }

    const [vendors, total] = await Promise.all([
      VendorProfile.find(filter)
        .populate('userId', 'name email createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      VendorProfile.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: vendors,
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

export const updateVendorStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    const vendor = await VendorProfile.findById(id);
    if (!vendor) {
      throw new AppError('Vendor application not found', 404);
    }

    vendor.approvalStatus = status as ApprovalStatus;
    if (status === ApprovalStatus.REJECTED && rejectionReason) {
      vendor.rejectionReason = rejectionReason;
    } else if (status === ApprovalStatus.APPROVED) {
      vendor.rejectionReason = undefined;
    }

    await vendor.save();

    res.status(200).json({
      success: true,
      message: `Vendor application ${status.toLowerCase()} successfully`,
      data: { vendor },
    });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, parentId, isActive } = req.body;

    let slug = slugify(name, { lower: true, strict: true });
    const slugExists = await Category.findOne({ slug });
    if (slugExists) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const category = await Category.create({
      name,
      slug,
      parentId: parentId || null,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};

export const listCategories = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const categories = await Category.find()
      .populate('parentId', 'name slug')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, parentId, isActive } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      throw new AppError('Category not found', 404);
    }

    if (name && name !== category.name) {
      let slug = slugify(name, { lower: true, strict: true });
      const slugExists = await Category.findOne({ slug, _id: { $ne: category._id } });
      if (slugExists) {
        slug = `${slug}-${Date.now().toString(36)}`;
      }
      category.name = name;
      category.slug = slug;
    }

    if (parentId !== undefined) category.parentId = parentId;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};
