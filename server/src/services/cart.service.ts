import { getRedis, isRedisOnline } from '../config/redis';
import Product from '../models/Product';
import { ProductStatus } from '../types';
import { AppError } from '../middleware/errorHandler';

export interface StoredCartItem {
  productId: string;
  quantity: number;
}

export interface HydratedCartItem {
  productId: string;
  quantity: number;
  product: {
    _id: string;
    title: string;
    slug: string;
    pricePaise: number;
    compareAtPricePaise?: number;
    stock: number;
    images: { key: string; url: string; order: number }[];
    status: string;
    vendor?: {
      _id: string;
      storeName: string;
      slug: string;
    };
  };
  lineTotalPaise: number;
}

export interface CartResponse {
  items: HydratedCartItem[];
  subtotalPaise: number;
  itemCount: number;
  vendorCount: number;
}

const CART_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

// In-memory fallback if Redis is offline (e.g. unit tests or local setup without Redis)
const memoryCartStore = new Map<string, { items: StoredCartItem[]; updatedAt: string }>();

const getCartKey = (userId: string): string => `cart:v1:${userId}`;

/**
 * Raw read of cart items from Redis or memory fallback.
 */
export const getRawCartItems = async (userId: string): Promise<StoredCartItem[]> => {
  if (!isRedisOnline()) {
    const fallback = memoryCartStore.get(userId);
    return fallback ? fallback.items : [];
  }

  try {
    const redis = getRedis();
    const data = await redis.get(getCartKey(userId));
    if (data) {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed.items) ? parsed.items : [];
    }
    return [];
  } catch (error) {
    const fallback = memoryCartStore.get(userId);
    return fallback ? fallback.items : [];
  }
};

/**
 * Raw write of cart items to Redis with 7-day TTL.
 */
export const saveRawCartItems = async (
  userId: string,
  items: StoredCartItem[]
): Promise<void> => {
  if (!isRedisOnline()) {
    if (items.length === 0) {
      memoryCartStore.delete(userId);
    } else {
      memoryCartStore.set(userId, {
        items,
        updatedAt: new Date().toISOString(),
      });
    }
    return;
  }

  const payload = JSON.stringify({
    items,
    updatedAt: new Date().toISOString(),
  });

  try {
    const redis = getRedis();
    if (items.length === 0) {
      await redis.del(getCartKey(userId));
    } else {
      await redis.setex(getCartKey(userId), CART_TTL_SECONDS, payload);
    }
  } catch (error) {
    if (items.length === 0) {
      memoryCartStore.delete(userId);
    } else {
      memoryCartStore.set(userId, {
        items,
        updatedAt: new Date().toISOString(),
      });
    }
  }
};

/**
 * Returns the fully hydrated customer cart with authoritative MongoDB prices and stock.
 */
export const getCart = async (userId: string): Promise<CartResponse> => {
  const storedItems = await getRawCartItems(userId);

  if (storedItems.length === 0) {
    return {
      items: [],
      subtotalPaise: 0,
      itemCount: 0,
      vendorCount: 0,
    };
  }

  const productIds = storedItems.map((item) => item.productId);

  // Authoritative fetch from MongoDB (Never trust client or cached prices)
  const products = await Product.find({
    _id: { $in: productIds },
    status: ProductStatus.ACTIVE,
  })
    .populate('vendorId', 'storeName slug')
    .lean();

  const productMap = new Map<string, any>();
  products.forEach((p) => {
    productMap.set(p._id.toString(), p);
  });

  const hydratedItems: HydratedCartItem[] = [];
  let subtotalPaise = 0;
  let totalCount = 0;
  const vendorIds = new Set<string>();
  const sanitizedStoredItems: StoredCartItem[] = [];

  for (const item of storedItems) {
    const product = productMap.get(item.productId);
    // Ignore products that were deleted or deactivated
    if (!product || product.stock <= 0) {
      continue;
    }

    // Clamp quantity to available stock if needed
    const validQuantity = Math.min(item.quantity, product.stock);
    const lineTotalPaise = product.pricePaise * validQuantity;

    subtotalPaise += lineTotalPaise;
    totalCount += validQuantity;

    if (product.vendorId) {
      vendorIds.add(product.vendorId._id?.toString() || product.vendorId.toString());
    }

    sanitizedStoredItems.push({
      productId: item.productId,
      quantity: validQuantity,
    });

    hydratedItems.push({
      productId: item.productId,
      quantity: validQuantity,
      product: {
        _id: product._id.toString(),
        title: product.title,
        slug: product.slug,
        pricePaise: product.pricePaise,
        compareAtPricePaise: product.compareAtPricePaise,
        stock: product.stock,
        images: product.images || [],
        status: product.status,
        vendor: product.vendorId
          ? {
              _id: product.vendorId._id?.toString() || product.vendorId.toString(),
              storeName: product.vendorId.storeName || 'Verified Merchant',
              slug: product.vendorId.slug || '',
            }
          : undefined,
      },
      lineTotalPaise,
    });
  }

  // If any inactive or clamped items were removed, sync back to Redis
  if (sanitizedStoredItems.length !== storedItems.length) {
    await saveRawCartItems(userId, sanitizedStoredItems);
  }

  return {
    items: hydratedItems,
    subtotalPaise,
    itemCount: totalCount,
    vendorCount: vendorIds.size,
  };
};

/**
 * Adds an item or increments its quantity in the cart.
 */
export const addItemToCart = async (
  userId: string,
  productId: string,
  quantityToAdd: number
): Promise<CartResponse> => {
  // Validate product in MongoDB
  const product = await Product.findById(productId);
  if (!product || product.status !== ProductStatus.ACTIVE) {
    throw new AppError('Product is no longer available', 404);
  }

  if (product.stock <= 0) {
    throw new AppError('This product is currently out of stock', 400);
  }

  const storedItems = await getRawCartItems(userId);
  const existingIndex = storedItems.findIndex((i) => i.productId === productId);

  if (existingIndex > -1) {
    const newQty = storedItems[existingIndex].quantity + quantityToAdd;
    if (newQty > product.stock) {
      throw new AppError(`Cannot add more. Only ${product.stock} units available in stock.`, 400);
    }
    storedItems[existingIndex].quantity = newQty;
  } else {
    if (quantityToAdd > product.stock) {
      throw new AppError(`Cannot add ${quantityToAdd}. Only ${product.stock} units in stock.`, 400);
    }
    storedItems.push({ productId, quantity: quantityToAdd });
  }

  await saveRawCartItems(userId, storedItems);
  return getCart(userId);
};

/**
 * Sets the exact quantity for an item in the cart.
 */
export const updateItemQuantity = async (
  userId: string,
  productId: string,
  quantity: number
): Promise<CartResponse> => {
  if (quantity <= 0) {
    return removeItemFromCart(userId, productId);
  }

  const product = await Product.findById(productId);
  if (!product || product.status !== ProductStatus.ACTIVE) {
    throw new AppError('Product is no longer available', 404);
  }

  if (quantity > product.stock) {
    throw new AppError(`Only ${product.stock} units available in stock`, 400);
  }

  const storedItems = await getRawCartItems(userId);
  const existingIndex = storedItems.findIndex((i) => i.productId === productId);

  if (existingIndex > -1) {
    storedItems[existingIndex].quantity = quantity;
  } else {
    storedItems.push({ productId, quantity });
  }

  await saveRawCartItems(userId, storedItems);
  return getCart(userId);
};

/**
 * Removes an item from the cart.
 */
export const removeItemFromCart = async (
  userId: string,
  productId: string
): Promise<CartResponse> => {
  const storedItems = await getRawCartItems(userId);
  const filtered = storedItems.filter((i) => i.productId !== productId);
  await saveRawCartItems(userId, filtered);
  return getCart(userId);
};

/**
 * Empties the customer's cart.
 */
export const clearCart = async (userId: string): Promise<void> => {
  await saveRawCartItems(userId, []);
};

/**
 * Quick item count query for the navigation bar badge.
 */
export const getCartCount = async (userId: string): Promise<number> => {
  const storedItems = await getRawCartItems(userId);
  return storedItems.reduce((acc, item) => acc + item.quantity, 0);
};

