import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, ApprovalStatus } from '../types';
import { AppError } from './errorHandler';
import VendorProfile from '../models/VendorProfile';

export const ensureApprovedVendor = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const vendorProfile = await VendorProfile.findOne({ userId: req.user.id });
    if (!vendorProfile) {
      throw new AppError(
        'No seller profile found. Please submit a seller application first.',
        403
      );
    }

    if (vendorProfile.approvalStatus === ApprovalStatus.PENDING) {
      throw new AppError(
        'Your seller application is pending review by marketplace administrators.',
        403
      );
    }

    if (vendorProfile.approvalStatus === ApprovalStatus.REJECTED) {
      throw new AppError(
        `Your seller application was rejected: ${
          vendorProfile.rejectionReason || 'Contact support for details'
        }`,
        403
      );
    }

    req.vendor = vendorProfile;
    next();
  } catch (error) {
    next(error);
  }
};
