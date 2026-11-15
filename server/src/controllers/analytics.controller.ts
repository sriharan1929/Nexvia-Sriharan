import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import Order from '../models/Order';
import SellerOrder from '../models/SellerOrder';
import Product from '../models/Product';
import VendorProfile from '../models/VendorProfile';
import { PaymentStatus, ProductStatus, ApprovalStatus } from '../types';

/**
 * Returns overall marketplace analytics and metrics for the Admin dashboard.
 * GET /api/v1/admin/analytics/overview
 */
export const getAdminOverviewHandler = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. GMV & Total Paid Orders
    const paidOrders = await Order.find({ paymentStatus: PaymentStatus.PAID });
    const gmvPaise = paidOrders.reduce((sum, o) => sum + o.totalPaise, 0);
    const totalOrdersCount = await Order.countDocuments();
    const paidOrdersCount = paidOrders.length;

    // 2. Platform Commission Earned
    const paidOrderIds = paidOrders.map((o) => o._id);
    const paidSellerOrders = await SellerOrder.find({
      orderId: { $in: paidOrderIds },
    });
    const platformCommissionPaise = paidSellerOrders.reduce(
      (sum, so) => sum + so.commissionPaise,
      0
    );
    const vendorNetPayoutsPaise = paidSellerOrders.reduce(
      (sum, so) => sum + so.vendorNetPaise,
      0
    );

    // 3. Catalog & Vendor Counts
    const activeProductsCount = await Product.countDocuments({
      status: ProductStatus.ACTIVE,
    });
    const approvedVendorsCount = await VendorProfile.countDocuments({
      approvalStatus: ApprovalStatus.APPROVED,
    });
    const pendingVendorsCount = await VendorProfile.countDocuments({
      approvalStatus: ApprovalStatus.PENDING,
    });

    // 4. Recent Orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('customerId', 'name email')
      .lean();

    res.status(200).json({
      success: true,
      data: {
        metrics: {
          gmvPaise,
          platformCommissionPaise,
          vendorNetPayoutsPaise,
          totalOrdersCount,
          paidOrdersCount,
          activeProductsCount,
          approvedVendorsCount,
          pendingVendorsCount,
        },
        recentOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

