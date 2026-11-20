import { z } from 'zod';
import { ProductStatus } from '../types';

const productImageSchema = z.object({
  key: z.string().min(1, 'Image key is required'),
  url: z.string().url('Image url must be valid'),
  order: z.number().int().nonnegative().optional().default(0),
});

export const createProductSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title cannot exceed 200 characters')
    .trim(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  pricePaise: z
    .number()
    .int('Price must be an integer in paise')
    .positive('Price must be positive'),
  compareAtPricePaise: z
    .number()
    .int('Compare price must be an integer in paise')
    .positive()
    .optional(),
  stock: z
    .number()
    .int('Stock must be an integer')
    .nonnegative('Stock cannot be negative'),
  categoryId: z.string().min(1, 'Category is required'),
  images: z.array(productImageSchema).optional().default([]),
  status: z
    .enum([
      ProductStatus.DRAFT,
      ProductStatus.PENDING,
      ProductStatus.ACTIVE,
      ProductStatus.ARCHIVED,
    ])
    .optional()
    .default(ProductStatus.ACTIVE),
  tags: z.array(z.string().trim()).optional().default([]),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
