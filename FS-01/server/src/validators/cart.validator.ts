import { z } from 'zod';

export const updateCartItemSchema = z.object({
  quantity: z
    .number()
    .int('Quantity must be an integer')
    .min(1, 'Quantity must be at least 1')
    .max(100, 'Cannot add more than 100 items of a single product'),
});

export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;

