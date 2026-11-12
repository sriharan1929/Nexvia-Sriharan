import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Response } from 'express';
import { env } from '../config';
import { getRedis } from '../config/redis';
import { UserRole } from '../types';

export interface TokenPayload {
  userId: string;
  email: string;
  roles: UserRole[];
  jti?: string;
}

const SALT_ROUNDS = 12;

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const generateTokens = (user: {
  _id: { toString(): string } | string;
  email: string;
  roles: UserRole[];
}) => {
  const userId = typeof user._id === 'string' ? user._id : user._id.toString();
  const jti = `${userId}-${Date.now()}`;

  const payload: TokenPayload = {
    userId,
    email: user.email,
    roles: user.roles,
  };

  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });

  const refreshToken = jwt.sign(
    { ...payload, jti },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    }
  );

  return { accessToken, refreshToken, jti };
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
};

export const setRefreshTokenCookie = (
  res: Response,
  refreshToken: string
): void => {
  const isProduction = env.NODE_ENV === 'production';
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/api/v1/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });
};

export const clearRefreshTokenCookie = (res: Response): void => {
  const isProduction = env.NODE_ENV === 'production';
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/api/v1/auth',
  });
};

export const blacklistToken = async (
  jti: string,
  expiresInSeconds = 7 * 24 * 60 * 60
): Promise<void> => {
  try {
    const redis = getRedis();
    await redis.setex(`bl:${jti}`, expiresInSeconds, 'revoked');
  } catch (error) {
    console.warn('[Redis] Token blacklisting bypassed (Redis offline)');
  }
};

export const isTokenBlacklisted = async (jti: string): Promise<boolean> => {
  try {
    const redis = getRedis();
    const result = await redis.get(`bl:${jti}`);
    return result !== null;
  } catch (error) {
    // If Redis is temporarily unreachable, fallback to signature validity
    return false;
  }
};
