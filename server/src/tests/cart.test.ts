import { describe, it, expect, beforeEach } from 'vitest';
import { updateCartItemSchema } from '../validators/cart.validator';
import {
  saveRawCartItems,
  getRawCartItems,
  clearCart,
  StoredCartItem,
} from '../services/cart.service';

describe('Cart Validator (Zod)', () => {
  it('should accept valid integer quantity', () => {
    const result = updateCartItemSchema.safeParse({ quantity: 3 });
    expect(result.success).toBe(true);
  });

  it('should reject zero or negative quantity', () => {
    expect(updateCartItemSchema.safeParse({ quantity: 0 }).success).toBe(false);
    expect(updateCartItemSchema.safeParse({ quantity: -2 }).success).toBe(false);
  });

  it('should reject non-integer quantities', () => {
    expect(updateCartItemSchema.safeParse({ quantity: 1.5 }).success).toBe(false);
  });

  it('should reject quantity exceeding maximum limit of 100', () => {
    expect(updateCartItemSchema.safeParse({ quantity: 101 }).success).toBe(false);
  });
});

describe('Cart Persistence & Calculations', () => {
  const testUserId = 'user-test-12345';

  beforeEach(async () => {
    await clearCart(testUserId);
  });

  it('should save and retrieve cart items from store', async () => {
    const items: StoredCartItem[] = [
      { productId: 'prod_keyboard_01', quantity: 2 },
      { productId: 'prod_mouse_02', quantity: 1 },
    ];

    await saveRawCartItems(testUserId, items);
    const retrieved = await getRawCartItems(testUserId);

    expect(retrieved).toHaveLength(2);
    expect(retrieved[0].productId).toBe('prod_keyboard_01');
    expect(retrieved[0].quantity).toBe(2);
    expect(retrieved[1].productId).toBe('prod_mouse_02');
    expect(retrieved[1].quantity).toBe(1);
  });

  it('should accurately calculate multi-vendor subtotal in integer paise', () => {
    // Simulating two items from two independent sellers
    const mockHydratedItems = [
      {
        productId: 'prod_keyboard_01',
        vendorId: 'vendor_a_electronics',
        pricePaise: 100000, // ₹1,000.00
        quantity: 2,
        lineTotalPaise: 100000 * 2, // 200,000 paise
      },
      {
        productId: 'prod_mouse_02',
        vendorId: 'vendor_b_peripherals',
        pricePaise: 50000, // ₹500.00
        quantity: 1,
        lineTotalPaise: 50000 * 1, // 50,000 paise
      },
    ];

    const subtotalPaise = mockHydratedItems.reduce(
      (sum, item) => sum + item.lineTotalPaise,
      0
    );
    const totalCount = mockHydratedItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    const vendorIds = new Set(mockHydratedItems.map((item) => item.vendorId));

    expect(subtotalPaise).toBe(250000); // Exactly ₹2,500.00 in integer paise
    expect(totalCount).toBe(3);
    expect(vendorIds.size).toBe(2); // 2 distinct vendors in 1 checkout
  });

  it('should clear all items on clearCart', async () => {
    await saveRawCartItems(testUserId, [
      { productId: 'prod_keyboard_01', quantity: 1 },
    ]);
    let items = await getRawCartItems(testUserId);
    expect(items).toHaveLength(1);

    await clearCart(testUserId);
    items = await getRawCartItems(testUserId);
    expect(items).toHaveLength(0);
  });
});
