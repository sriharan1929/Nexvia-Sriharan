import { describe, it, expect } from 'vitest';

describe('Marketplace Extras — Coupons & Reviews Policy', () => {
  describe('Coupon Calculations', () => {
    it('should correctly calculate percentage discount capped at maxDiscountPaise', () => {

      const subtotalPaise = 200000;
      const percentage = 20;
      const maxDiscountPaise = 15000;

      const rawDiscount = Math.round((subtotalPaise * percentage) / 100);
      expect(rawDiscount).toBe(40000);

      const finalDiscount = Math.min(rawDiscount, maxDiscountPaise);
      expect(finalDiscount).toBe(15000);

      const finalSubtotal = subtotalPaise - finalDiscount;
      expect(finalSubtotal).toBe(185000);
    });

    it('should correctly calculate fixed amount discount without exceeding order subtotal', () => {

      const subtotalPaise = 30000;
      const fixedValuePaise = 50000;

      const discount = Math.min(fixedValuePaise, subtotalPaise);
      expect(discount).toBe(30000);

      const finalSubtotal = subtotalPaise - discount;
      expect(finalSubtotal).toBe(0);
    });

    it('should apportion coupon discounts across multiple vendors without losing 1 paise', () => {

      const totalRaw = 150000;
      const totalDiscount = 15000;

      const vARaw = 100000;
      const vBRaw = 50000;

      const vADiscount = Math.round((totalDiscount * vARaw) / totalRaw);
      const vBDiscount = Math.round((totalDiscount * vBRaw) / totalRaw);

      expect(vADiscount).toBe(10000);
      expect(vBDiscount).toBe(5000);
      expect(vADiscount + vBDiscount).toBe(totalDiscount);

      const vANetSubtotal = vARaw - vADiscount;
      const vBNetSubtotal = vBRaw - vBDiscount;

      const vAComm = Math.round(vANetSubtotal * 0.10);
      const vBComm = Math.round(vBNetSubtotal * 0.10);

      const vANet = vANetSubtotal - vAComm;
      const vBNet = vBNetSubtotal - vBComm;

      expect(vANet).toBe(81000);
      expect(vBNet).toBe(40500);

      expect(vANet + vBNet + vAComm + vBComm).toBe(totalRaw - totalDiscount);
    });
  });

  describe('Review Aggregation Math', () => {
    it('should calculate arithmetic mean and round to 1 decimal place', () => {
      const ratings = [5, 4, 5, 3, 5];
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
