import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import { AppError } from '../middleware/errorHandler';
import {
  hashPassword,
  generateTokens,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  verifyRefreshToken,
  blacklistToken,
  isTokenBlacklisted,
} from '../services/auth.service';
import { AuthenticatedRequest, UserRole } from '../types';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('An account with this email already exists', 409);
    }

    const passwordHash = await hashPassword(password);

    const roles: UserRole[] = [UserRole.CUSTOMER];
    if (role === UserRole.VENDOR) {
      roles.push(UserRole.VENDOR);
    }

    const user = await User.create({
      name,
      email,
      passwordHash,
      roles,
      accountStatus: 'ACTIVE',
    });

    const { accessToken, refreshToken } = generateTokens(user);

    setRefreshTokenCookie(res, refreshToken);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          roles: user.roles,
          accountStatus: user.accountStatus,
          createdAt: user.createdAt,
        },
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (user.accountStatus === 'SUSPENDED') {
      throw new AppError('Your account has been suspended. Please contact support.', 403);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    const { accessToken, refreshToken } = generateTokens(user);

    setRefreshTokenCookie(res, refreshToken);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          roles: user.roles,
          accountStatus: user.accountStatus,
          createdAt: user.createdAt,
        },
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new AppError('Refresh token not found. Please log in.', 401);
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err: any) {
      clearRefreshTokenCookie(res);
      throw new AppError('Invalid or expired refresh token. Please log in again.', 401);
    }

    if (decoded.jti && (await isTokenBlacklisted(decoded.jti))) {
      clearRefreshTokenCookie(res);
      throw new AppError('Token has been revoked. Please log in again.', 401);
    }

    const user = await User.findById(decoded.userId);
    if (!user || user.accountStatus === 'SUSPENDED') {
      clearRefreshTokenCookie(res);
      throw new AppError('User session is invalid', 401);
    }

    if (decoded.jti) {
      await blacklistToken(decoded.jti);
    }

    const tokens = generateTokens(user);
    setRefreshTokenCookie(res, tokens.refreshToken);

    res.status(200).json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      try {
        const decoded = verifyRefreshToken(refreshToken);
        if (decoded.jti) {
          await blacklistToken(decoded.jti);
        }
      } catch {

      }
    }

    clearRefreshTokenCookie(res);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          roles: user.roles,
          accountStatus: user.accountStatus,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
