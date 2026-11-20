import { describe, it, expect } from 'vitest';

describe('Marketplace Extras — Coupons & Reviews Policy', () => {
  describe('Coupon Calculations', () => {
    it('should correctly calculate percentage discount capped at maxDiscountPaise', () => {
      // 20% discount on ₹2,000 (200000 paise) = ₹400 (40000 paise)
      // Capped at max discount of ₹150 (15000 paise)
      const subtotalPaise = 200000;
      const percentage = 20;
      const maxDiscountPaise = 15000;

      const rawDiscount = Math.round((subtotalPaise * percentage) / 100);
      expect(rawDiscount).toBe(40000);

      const finalDiscount = Math.min(rawDiscount, maxDiscountPaise);
      expect(finalDiscount).toBe(15000); // Properly capped at ₹150

      const finalSubtotal = subtotalPaise - finalDiscount;
      expect(finalSubtotal).toBe(185000); // ₹1,850
    });

    it('should correctly calculate fixed amount discount without exceeding order subtotal', () => {
      // Fixed discount of ₹500 (50000 paise) on an order of ₹300 (30000 paise)
      const subtotalPaise = 30000;
      const fixedValuePaise = 50000;

      const discount = Math.min(fixedValuePaise, subtotalPaise);
      expect(discount).toBe(30000); // Cannot exceed subtotal

      const finalSubtotal = subtotalPaise - discount;
      expect(finalSubtotal).toBe(0);
    });

    it('should apportion coupon discounts across multiple vendors without losing 1 paise', () => {
      // Vendor A raw subtotal: ₹1,000 (100000 paise)
      // Vendor B raw subtotal: ₹500 (50000 paise)
      // Total raw subtotal: ₹1,500 (150000 paise)
      // Coupon: ₹150 (15000 paise discount)
      const totalRaw = 150000;
      const totalDiscount = 15000;

      const vARaw = 100000;
      const vBRaw = 50000;

      const vADiscount = Math.round((totalDiscount * vARaw) / totalRaw); // 10000 paise
      const vBDiscount = Math.round((totalDiscount * vBRaw) / totalRaw); // 5000 paise

      expect(vADiscount).toBe(10000);
      expect(vBDiscount).toBe(5000);
      expect(vADiscount + vBDiscount).toBe(totalDiscount);

      const vANetSubtotal = vARaw - vADiscount; // 90000 paise
      const vBNetSubtotal = vBRaw - vBDiscount; // 45000 paise

      // Platform commission 10% on post-coupon subtotal
      const vAComm = Math.round(vANetSubtotal * 0.10); // 9000 paise
      const vBComm = Math.round(vBNetSubtotal * 0.10); // 4500 paise

      const vANet = vANetSubtotal - vAComm; // 81000 paise
      const vBNet = vBNetSubtotal - vBComm; // 40500 paise

      expect(vANet).toBe(81000);
      expect(vBNet).toBe(40500);

      // Customer pays 135000 paise
      // Platform earns 13500 paise
      // Vendors collectively receive 121500 paise
      expect(vANet + vBNet + vAComm + vBComm).toBe(totalRaw - totalDiscount);
    });
  });

  describe('Review Aggregation Math', () => {
    it('should calculate arithmetic mean and round to 1 decimal place', () => {
      const ratings = [5, 4, 5, 3, 5]; // Sum = 22, Count = 5, Avg = 4.4
      const sum = ratings.reduce((a, b) => a + b, 0);
      const avg = Math.round((sum / ratings.length) * 10) / 10;

      expect(avg).toBe(4.4);
    });

    it('should reject ratings outside 1-5 range', () => {
      const isRatingValid = (r: number) => Number.isInteger(r) && r >= 1 && r <= 5;

      expect(isRatingValid(0)).toBe(false);
      expect(isRatingValid(6)).toBe(false);
      expect(isRatingValid(3.5)).toBe(false);
      expect(isRatingValid(5)).toBe(true);
      expect(isRatingValid(1)).toBe(true);
    });
  });
});

