import { z } from 'zod';
import { ApprovalStatus } from '../types';

export const applyVendorSchema = z.object({
  storeName: z
    .string()
    .min(2, 'Store name must be at least 2 characters')
    .max(100, 'Store name cannot exceed 100 characters')
    .trim(),
  description: z
    .string()
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional(),
  contactEmail: z
    .string()
    .email('Please enter a valid contact email')
    .toLowerCase()
    .trim(),
  contactPhone: z
    .string()
    .min(10, 'Contact phone must have at least 10 digits')
    .max(15, 'Contact phone cannot exceed 15 characters')
    .trim(),
  logo: z.string().url('Logo must be a valid URL').optional().or(z.literal('')),
});

export const updateVendorProfileSchema = z.object({
  storeName: z
    .string()
    .min(2)
    .max(100)
    .trim()
    .optional(),
  description: z.string().max(1000).optional(),
  contactEmail: z.string().email().toLowerCase().trim().optional(),
  contactPhone: z.string().min(10).max(15).trim().optional(),
  logo: z.string().url().optional().or(z.literal('')),
});

export const updateVendorStatusSchema = z.object({
  status: z.enum([ApprovalStatus.APPROVED, ApprovalStatus.REJECTED]),
  rejectionReason: z
    .string()
    .max(500, 'Rejection reason cannot exceed 500 characters')
    .optional(),
});

export type ApplyVendorInput = z.infer<typeof applyVendorSchema>;
export type UpdateVendorProfileInput = z.infer<typeof updateVendorProfileSchema>;
export type UpdateVendorStatusInput = z.infer<typeof updateVendorStatusSchema>;
