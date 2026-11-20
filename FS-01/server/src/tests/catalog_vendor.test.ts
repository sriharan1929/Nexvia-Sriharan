import { describe, it, expect } from 'vitest';
import { applyVendorSchema } from '../validators/vendor.validator';
import { createProductSchema } from '../validators/product.validator';
import { createCategorySchema } from '../validators/category.validator';
import { ProductStatus } from '../types';
import slugify from 'slugify';

describe('Vendor Application Validation (Zod)', () => {
  it('should accept valid vendor application data', () => {
    const validData = {
      storeName: 'Royal Electronics',
      description: 'Authorized retailer for mechanical keyboards and mice',
      contactEmail: 'contact@royalelectronics.com',
      contactPhone: '9876543210',
    };

    const result = applyVendorSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject application with phone less than 10 digits', () => {
    const invalidData = {
      storeName: 'Royal Electronics',
      contactEmail: 'contact@royalelectronics.com',
      contactPhone: '12345',
    };

    const result = applyVendorSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject application with invalid contact email', () => {
    const invalidData = {
      storeName: 'Royal Electronics',
      contactEmail: 'not-an-email',
      contactPhone: '9876543210',
    };

    const result = applyVendorSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

describe('Product Validation (Zod)', () => {
  it('should validate valid product creation in integer paise', () => {
    const validProduct = {
      title: 'Mechanical Gaming Keyboard RGB',
      description: 'Tenkeyless RGB backlit mechanical keyboard with blue tactile switches.',
      pricePaise: 249900, // ₹2,499.00
      compareAtPricePaise: 299900, // ₹2,999.00
      stock: 45,
      categoryId: '67339794bf3214567890abcd',
      status: ProductStatus.ACTIVE,
      tags: ['electronics', 'gaming', 'keyboard'],
    };

    const result = createProductSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
  });

  it('should reject negative stock count', () => {
    const invalidProduct = {
      title: 'Mechanical Gaming Keyboard RGB',
      description: 'Tenkeyless RGB backlit mechanical keyboard.',
      pricePaise: 249900,
      stock: -5,
      categoryId: '67339794bf3214567890abcd',
    };

    const result = createProductSchema.safeParse(invalidProduct);
    expect(result.success).toBe(false);
  });

  it('should reject floating point prices for strict integer paise', () => {
    const floatProduct = {
      title: 'Mechanical Gaming Keyboard RGB',
      description: 'Tenkeyless RGB backlit mechanical keyboard.',
      pricePaise: 2499.50, // Not an integer paise!
      stock: 10,
      categoryId: '67339794bf3214567890abcd',
    };

    const result = createProductSchema.safeParse(floatProduct);
    expect(result.success).toBe(false);
  });
});

describe('Category Validation & Slug Generation', () => {
  it('should validate category creation', () => {
    const validCategory = {
      name: 'Computer Accessories',
      isActive: true,
    };

    const result = createCategorySchema.safeParse(validCategory);
    expect(result.success).toBe(true);
  });

  it('should generate URL-friendly slug from title', () => {
    const title = 'Wireless RGB Mouse & Gaming Mat';
    const slug = slugify(title, { lower: true, strict: true });

    expect(slug).toBe('wireless-rgb-mouse-and-gaming-mat');
    expect(slug).not.toContain(' ');
    expect(slug).not.toContain('&');
  });
});
