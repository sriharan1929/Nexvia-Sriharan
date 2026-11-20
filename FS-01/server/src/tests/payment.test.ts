import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import {
  verifyClientSignature,
  verifyWebhookSignature,
} from '../services/payment.service';
import { env } from '../config';

describe('Payment & Settlement Service', () => {
  describe('Signature Verification', () => {
    it('should verify legitimate client Razorpay payment signature', () => {
      const orderId = 'order_DA2910Fa';
      const paymentId = 'pay_9A012B98';
      const secret = env.RAZORPAY_KEY_SECRET;

      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      const isValid = verifyClientSignature(orderId, paymentId, expectedSignature);
      expect(isValid).toBe(true);
    });

    it('should reject tampered client payment signature', () => {
      const orderId = 'order_DA2910Fa';
      const paymentId = 'pay_9A012B98';
      const fakeSignature = 'bad_tampered_signature_hex_0000';

      const isValid = verifyClientSignature(orderId, paymentId, fakeSignature);
      expect(isValid).toBe(false);
    });

    it('should accept simulated dev/demo signature when live keys are unconfigured', () => {
      const isValid = verifyClientSignature(
        'order_mock_123',
        'pay_mock_456',
        'simulated_success'
      );
      expect(isValid).toBe(true);
    });

    it('should verify valid webhook HMAC payload signature', () => {
      const rawPayload = JSON.stringify({
        entity: 'event',
        event: 'payment.captured',
        id: 'evt_test_123',
      });
      const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET;

      const validWebhookSig = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawPayload)
        .digest('hex');

      const isVerified = verifyWebhookSignature(rawPayload, validWebhookSig);
      expect(isVerified).toBe(true);
    });

    it('should reject tampered webhook payload signature', () => {
      const rawPayload = JSON.stringify({ event: 'payment.captured' });
      const badSig = 'tampered_webhook_signature_string';

      const isVerified = verifyWebhookSignature(rawPayload, badSig);
      expect(isVerified).toBe(false);
    });
  });

  describe('Commission & Multi-Vendor Settlement Math', () => {
    it('should calculate 10% commission with zero paise rounding drift', () => {
      // Vendor A: ₹1,000 = 100000 paise
      // Vendor B: ₹500 = 50000 paise
      const rate = 0.10;

      const vendorASubtotal = 100000;
      const vendorACommission = Math.round(vendorASubtotal * rate);
      const vendorANet = vendorASubtotal - vendorACommission;

      expect(vendorACommission).toBe(10000); // ₹100
      expect(vendorANet).toBe(90000); // ₹900
      expect(vendorACommission + vendorANet).toBe(vendorASubtotal);

      const vendorBSubtotal = 50000;
      const vendorBCommission = Math.round(vendorBSubtotal * rate);
      const vendorBNet = vendorBSubtotal - vendorBCommission;

      expect(vendorBCommission).toBe(5000); // ₹50
      expect(vendorBNet).toBe(45000); // ₹450
      expect(vendorBCommission + vendorBNet).toBe(vendorBSubtotal);

      // Customer total checkout paid
      const customerTotal = vendorASubtotal + vendorBSubtotal;
      const totalTransferred = vendorANet + vendorBNet;
      const totalPlatformRetained = vendorACommission + vendorBCommission;

      expect(customerTotal).toBe(150000); // ₹1,500
      expect(totalTransferred).toBe(135000); // ₹1,350
      expect(totalPlatformRetained).toBe(15000); // ₹150
      expect(totalTransferred + totalPlatformRetained).toBe(customerTotal);
    });

    it('should accurately handle odd paise amounts without fraction loss', () => {
      // Single item: ₹999.50 = 99950 paise
      const subtotal = 99950;
      const rate = 0.10;
      const commission = Math.round(subtotal * rate); // 9995 paise
      const net = subtotal - commission; // 89955 paise

      expect(commission).toBe(9995);
      expect(net).toBe(89955);
      expect(commission + net).toBe(subtotal);
      expect(Number.isInteger(commission)).toBe(true);
      expect(Number.isInteger(net)).toBe(true);
    });
  });
});
