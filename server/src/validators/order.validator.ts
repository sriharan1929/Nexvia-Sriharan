import { z } from 'zod';
import { FulfillmentStatus } from '../types';

export const addressSchema = z.object({
  name: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100)
    .trim(),
  line1: z
    .string()
    .min(5, 'Address line 1 must be at least 5 characters')
    .max(200)
    .trim(),
  line2: z.string().max(200).trim().optional().or(z.literal('')),
  city: z.string().min(2, 'City is required').max(100).trim(),
  state: z.string().min(2, 'State is required').max(100).trim(),
  pincode: z
    .string()
    .regex(/^[1-9][0-9]{5}$/, 'Please enter a valid 6-digit Indian PIN code')
    .trim(),
  phone: z
    .string()
    .min(10, 'Phone must have at least 10 digits')
    .max(15)
    .trim(),
});

export const checkoutPreviewSchema = z.object({
  address: addressSchema,
  couponCode: z.string().trim().optional(),
});

export const checkoutSessionSchema = z.object({
  address: addressSchema,
  couponCode: z.string().trim().optional(),
});

export const updateFulfillmentStatusSchema = z.object({
  status: z.enum([
    FulfillmentStatus.PACKED,
    FulfillmentStatus.SHIPPED,
    FulfillmentStatus.DELIVERED,
    FulfillmentStatus.CANCELLED,
  ]),
  trackingNumber: z.string().trim().optional(),
  trackingUrl: z.string().url('Must be a valid tracking URL').optional().or(z.literal('')),
});

export type AddressInput = z.infer<typeof addressSchema>;
export type CheckoutPreviewInput = z.infer<typeof checkoutPreviewSchema>;
export type CheckoutSessionInput = z.infer<typeof checkoutSessionSchema>;
export type UpdateFulfillmentStatusInput = z.infer<
  typeof updateFulfillmentStatusSchema
>;
