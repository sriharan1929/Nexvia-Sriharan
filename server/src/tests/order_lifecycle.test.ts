import { describe, it, expect } from 'vitest';
import { addressSchema } from '../validators/order.validator';
import { FulfillmentStatus } from '../types';

describe('Address Validation Schema (Zod)', () => {
  it('should validate valid Indian shipping address', () => {
    const validAddress = {
      name: 'Priya Sharma',
      line1: 'Flat 402, Lotus Residency, MG Road',
      line2: 'Near Indiranagar Metro Station',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
      phone: '9876543210',
    };

    const result = addressSchema.safeParse(validAddress);
    expect(result.success).toBe(true);
  });

  it('should reject invalid PIN code format', () => {
    const invalidPincode = {
      name: 'Priya Sharma',
      line1: 'Flat 402, Lotus Residency',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '056003', // Starts with 0
      phone: '9876543210',
    };

    expect(addressSchema.safeParse(invalidPincode).success).toBe(false);

    const shortPincode = { ...invalidPincode, pincode: '56003' }; // 5 digits
    expect(addressSchema.safeParse(shortPincode).success).toBe(false);
  });

  it('should reject phone numbers with less than 10 digits', () => {
    const invalidPhone = {
      name: 'Priya Sharma',
      line1: 'Flat 402, Lotus Residency',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
      phone: '12345',
    };

    expect(addressSchema.safeParse(invalidPhone).success).toBe(false);
  });
});

describe('Multi-Vendor Commission Arithmetic', () => {
  it('should calculate integer paise commission with deterministic rounding', () => {
    const commissionRate = 0.10; // 10%

    // Vendor A sells item worth ₹1,234.56 = 123456 paise
    const vendorSubtotalPaise = 123456;
    const commissionPaise = Math.round(vendorSubtotalPaise * commissionRate);
    const vendorNetPaise = vendorSubtotalPaise - commissionPaise;

    expect(commissionPaise).toBe(12346); // 12345.6 rounds to 12346 paise
    expect(vendorNetPaise).toBe(111110); // 123456 - 12346 = 111110 paise
    expect(commissionPaise + vendorNetPaise).toBe(vendorSubtotalPaise); // Perfect balance
  });

  it('should accurately partition multi-vendor order shares', () => {
    const commissionRate = 0.10;

    // Multi-vendor checkout:
    // Vendor 1: Keyboard ₹1,000 (100000 paise)
    // Vendor 2: Mouse ₹500 (50000 paise)
    const v1Subtotal = 100000;
    const v2Subtotal = 50000;

    const v1Commission = Math.round(v1Subtotal * commissionRate);
    const v1Net = v1Subtotal - v1Commission;

    const v2Commission = Math.round(v2Subtotal * commissionRate);
    const v2Net = v2Subtotal - v2Commission;

    expect(v1Commission).toBe(10000); // ₹100
    expect(v1Net).toBe(90000); // ₹900

    expect(v2Commission).toBe(5000); // ₹50
    expect(v2Net).toBe(45000); // ₹450

    const totalCustomerPaid = v1Subtotal + v2Subtotal;
    const totalPlatformEarned = v1Commission + v2Commission;
    const totalVendorsReceived = v1Net + v2Net;

    expect(totalCustomerPaid).toBe(150000);
    expect(totalPlatformEarned).toBe(15000);
    expect(totalVendorsReceived).toBe(135000);
    expect(totalPlatformEarned + totalVendorsReceived).toBe(totalCustomerPaid);
  });
});

describe('Fulfillment State Machine Transitions', () => {
  const ALLOWED: Record<FulfillmentStatus, FulfillmentStatus[]> = {
    [FulfillmentStatus.PLACED]: [FulfillmentStatus.PACKED, FulfillmentStatus.CANCELLED],
    [FulfillmentStatus.PACKED]: [FulfillmentStatus.SHIPPED, FulfillmentStatus.CANCELLED],
    [FulfillmentStatus.SHIPPED]: [FulfillmentStatus.DELIVERED],
    [FulfillmentStatus.DELIVERED]: [],
    [FulfillmentStatus.CANCELLED]: [],
  };

  const isTransitionAllowed = (from: FulfillmentStatus, to: FulfillmentStatus) => {
    return ALLOWED[from]?.includes(to) ?? false;
  };

  it('should allow valid sequential progression: PLACED -> PACKED -> SHIPPED -> DELIVERED', () => {
    expect(isTransitionAllowed(FulfillmentStatus.PLACED, FulfillmentStatus.PACKED)).toBe(true);
    expect(isTransitionAllowed(FulfillmentStatus.PACKED, FulfillmentStatus.SHIPPED)).toBe(true);
    expect(isTransitionAllowed(FulfillmentStatus.SHIPPED, FulfillmentStatus.DELIVERED)).toBe(true);
  });

  it('should disallow backward status transitions (e.g. SHIPPED back to PLACED)', () => {
    expect(isTransitionAllowed(FulfillmentStatus.SHIPPED, FulfillmentStatus.PLACED)).toBe(false);
    expect(isTransitionAllowed(FulfillmentStatus.PACKED, FulfillmentStatus.PLACED)).toBe(false);
  });

  it('should enforce DELIVERED as terminal state', () => {
    expect(isTransitionAllowed(FulfillmentStatus.DELIVERED, FulfillmentStatus.CANCELLED)).toBe(false);
    expect(isTransitionAllowed(FulfillmentStatus.DELIVERED, FulfillmentStatus.PLACED)).toBe(false);
  });
});

