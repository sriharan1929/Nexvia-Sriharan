import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole } from '../types';
import { verifyAccessToken } from '../services/auth.service';
import { AppError } from './errorHandler';
import User from '../models/User';

export const authenticate = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required. Please log in.', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AppError('Invalid authentication token format', 401);
    }

    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.userId).select('accountStatus roles email');
    if (!user) {
      throw new AppError('The user belonging to this token no longer exists', 401);
    }

    if (user.accountStatus === 'SUSPENDED') {
      throw new AppError('Your account has been suspended. Please contact support.', 403);
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      roles: user.roles as string[],
    };

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      next(new AppError('Your session has expired. Please refresh your token.', 401));
      return;
    }
    if (error.name === 'JsonWebTokenError') {
      next(new AppError('Invalid authentication token', 401));
      return;
    }
    next(error);
  }
};

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Authentication required', 401));
      return;
    }

    const hasRole = req.user.roles.some((role) =>
      allowedRoles.includes(role as UserRole)
    );

    if (!hasRole) {
      next(
        new AppError(
          'You do not have permission to perform this action',
          403
        )
      );
      return;
    }

    next();
  };
};
