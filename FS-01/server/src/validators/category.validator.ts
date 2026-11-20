import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(2, 'Category name must be at least 2 characters')
    .max(100, 'Category name cannot exceed 100 characters')
    .trim(),
  parentId: z.string().nullable().optional(),
  isActive: z.boolean().optional().default(true),
});

export const updateCategorySchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  parentId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
