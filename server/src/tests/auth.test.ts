import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
} from '../services/auth.service';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import { UserRole } from '../types';
import bcrypt from 'bcryptjs';

describe('Auth Service - Passwords & Tokens', () => {
  it('should securely hash password with bcrypt', async () => {
    const rawPassword = 'SecretPassword123';
    const hash = await hashPassword(rawPassword);

    expect(hash).not.toBe(rawPassword);
    expect(hash).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash prefix

    const isMatch = await bcrypt.compare(rawPassword, hash);
    expect(isMatch).toBe(true);

    const isWrongMatch = await bcrypt.compare('WrongPassword', hash);
    expect(isWrongMatch).toBe(false);
  }, 15000);

  it('should generate valid access and refresh tokens', () => {
    const user = {
      _id: '67339794bf3214567890abcd',
      email: 'vendor@example.com',
      roles: [UserRole.VENDOR, UserRole.CUSTOMER],
    };

    const { accessToken, refreshToken, jti } = generateTokens(user);

    expect(accessToken).toBeDefined();
    expect(refreshToken).toBeDefined();
    expect(jti).toContain('67339794bf3214567890abcd');

    // Verify Access Token payload
    const decodedAccess = verifyAccessToken(accessToken);
    expect(decodedAccess.userId).toBe(user._id);
    expect(decodedAccess.email).toBe(user.email);
    expect(decodedAccess.roles).toContain(UserRole.VENDOR);

    // Verify Refresh Token payload
    const decodedRefresh = verifyRefreshToken(refreshToken);
    expect(decodedRefresh.userId).toBe(user._id);
    expect(decodedRefresh.jti).toBe(jti);
  });
});

describe('Auth Validation Schemas (Zod)', () => {
  it('should validate valid registration input', () => {
    const validData = {
      name: 'Ramesh Sharma',
      email: 'ramesh@example.com',
      password: 'Password123',
      role: 'VENDOR',
    };

    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject invalid email in registration', () => {
    const invalidData = {
      name: 'Ramesh Sharma',
      email: 'not-an-email',
      password: 'Password123',
    };

    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject passwords shorter than 8 characters', () => {
    const invalidData = {
      name: 'Ramesh Sharma',
      email: 'ramesh@example.com',
      password: 'Pass1', // only 5 chars
    };

    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject passwords without numbers', () => {
    const invalidData = {
      name: 'Ramesh Sharma',
      email: 'ramesh@example.com',
      password: 'PasswordOnly',
    };

    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should validate valid login input', () => {
    const validData = {
      email: 'ramesh@example.com',
      password: 'Password123',
    };

    const result = loginSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
});
