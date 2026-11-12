export interface User {
  _id: string;
  name: string;
  email: string;
  roles: string[];
  accountStatus: string;
  createdAt: string;
}

export interface VendorProfile {
  _id: string;
  userId: string;
  storeName: string;
  slug: string;
  description?: string;
  logo?: string;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  createdAt: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  parentId?: string;
  isActive: boolean;
}

export interface Product {
  _id: string;
  vendorId: string;
  categoryId: string;
  title: string;
  slug: string;
  description: string;
  pricePaise: number;
  compareAtPricePaise?: number;
  stock: number;
  images: { key: string; url: string; order: number }[];
  status: string;
  ratingSummary: { average: number; count: number };
  tags: string[];
  vendor?: { storeName: string; slug: string };
  category?: Category;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  product?: Product;
}

export interface Cart {
  items: CartItem[];
  subtotalPaise: number;
}

export interface Address {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

export interface OrderItem {
  productId: string;
  productSnapshot: {
    title: string;
    pricePaise: number;
    image: string;
  };
  quantity: number;
  lineTotalPaise: number;
}

export interface SellerOrder {
  _id: string;
  orderId: string;
  vendorId: string;
  items: OrderItem[];
  vendorSubtotalPaise: number;
  commissionRate: number;
  commissionPaise: number;
  vendorNetPaise: number;
  fulfillmentStatus: string;
  trackingNumber?: string;
  trackingUrl?: string;
  transferStatus: string;
  createdAt: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  customerId: string;
  addressSnapshot: Address;
  itemSubtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  taxPaise: number;
  totalPaise: number;
  paymentStatus: string;
  sellerOrders?: SellerOrder[];
  createdAt: string;
}

export interface Review {
  _id: string;
  productId: string;
  customerId: string;
  rating: number;
  title: string;
  comment: string;
  isVerifiedPurchase: boolean;
  customer?: { name: string };
  createdAt: string;
}

export interface Coupon {
  _id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  valuePaise?: number;
  percentage?: number;
  minOrderPaise: number;
  maxDiscountPaise?: number;
  usageLimit: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
