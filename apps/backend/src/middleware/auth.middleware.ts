// src/middleware/auth.middleware.ts

/**
 * Authentication Middleware
 * 
 * Protects routes by verifying JWT tokens and checking user roles
 * Middleware functions run BEFORE route controllers
 */

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JWTPayload, UserRole } from '../types';
import User from '../models/User.model';

/**
 * Protect Middleware
 * 
 * Verifies JWT token and attaches user to request
 * Use this on any route that requires authentication
 * 
 * Usage in routes:
 * router.get('/profile', protect, getUserProfile);
 */
export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    /**
     * Extract token from Authorization header
     * 
     * Format: "Bearer <token>"
     * Example: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
     */
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      // Split "Bearer <token>" and get the token part
      token = req.headers.authorization.split(' ')[1];
    }

    // If no token found, user is not authenticated
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
        error: 'No token provided',
      });
      return;
    }

    // Verify token
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }

    /**
     * jwt.verify() checks:
     * 1. Token signature is valid (not tampered with)
     * 2. Token hasn't expired
     * 3. Returns decoded payload
     */
    const decoded = jwt.verify(token, secret) as JWTPayload;

    /**
     * Fetch user from database
     * 
     * We don't include password in the result (select: '-password')
     * This user object is attached to req and available in controllers
     */
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found',
        error: 'Invalid token',
      });
      return;
    }

    // Attach user to request object
    // Now controllers can access req.user
    req.user = user;

    // Continue to next middleware/controller
    next();
  } catch (error) {
    // Token verification failed
    const err = error as Error;
    
    // Handle specific JWT errors
    if (err.name === 'JsonWebTokenError') {
      res.status(401).json({
        success: false,
        message: 'Invalid token',
        error: err.message,
      });
      return;
    }

    if (err.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        message: 'Token expired',
        error: 'Please login again',
      });
      return;
    }

    // Generic error
    res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: err.message,
    });
  }
};

/**
 * Authorize Middleware Factory
 * 
 * Restricts access to routes based on user role
 * Must be used AFTER protect middleware
 * 
 * Usage:
 * router.post('/products', protect, authorize(UserRole.ADMIN, UserRole.STAFF), createProduct);
 * 
 * @param roles - Allowed roles (pass multiple roles as arguments)
 * @returns Middleware function
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    // Check if user exists on request (should be added by protect middleware)
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Not authorized',
        error: 'User not authenticated',
      });
      return;
    }

    // Check if user's role is in the allowed roles
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Access forbidden',
        error: `This route requires one of the following roles: ${roles.join(', ')}`,
      });
      return;
    }

    // User has required role, continue
    next();
  };
};

/**
 * Optional Auth Middleware
 * 
 * Attaches user to request if token is present, but doesn't require it
 * Useful for routes that work differently for authenticated vs guest users
 * 
 * Example: Product listings might show personalized recommendations for logged-in users
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // If no token, continue without authentication
    if (!token) {
      return next();
    }

    // Try to verify token
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return next(); // Continue without auth if secret is missing
    }

    const decoded = jwt.verify(token, secret) as JWTPayload;
    const user = await User.findById(decoded.userId).select('-password');

    // Attach user if found
    if (user) {
      req.user = user;
    }

    next();
  } catch (error) {
    // If token verification fails, continue without authentication
    // Don't send error response
    next();
  }
};

/**
 * Check User Ownership Middleware
 * 
 * Ensures user can only access/modify their own resources
 * Admins bypass this check
 * 
 * Usage:
 * router.put('/orders/:orderId', protect, checkOwnership('orderId', 'Order'), updateOrder);
 * 
 * @param resourceIdParam - Name of route parameter (e.g., 'orderId')
 * @param model - Mongoose model name (e.g., 'Order')
 * @returns Middleware function
 */
export const checkOwnership = (resourceIdParam: string, model: string) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Not authorized',
        });
        return;
      }

      // Admins can access any resource
      if (req.user.role === UserRole.ADMIN) {
        return next();
      }

      // Get resource ID from route parameters
      const resourceId = req.params[resourceIdParam];

      if (!resourceId) {
        res.status(400).json({
          success: false,
          message: 'Resource ID not provided',
        });
        return;
      }

      // Import model dynamically
      const Model = require(`../models/${model}.model`).default;

      // Find resource
      const resource = await Model.findById(resourceId);

      if (!resource) {
        res.status(404).json({
          success: false,
          message: `${model} not found`,
        });
        return;
      }

      // Check if user owns this resource
      // Compare resource's user field with current user's ID
      if (resource.user?.toString() !== req.user._id.toString()) {
        res.status(403).json({
          success: false,
          message: 'Access forbidden',
          error: 'You do not own this resource',
        });
        return;
      }

      next();
    } catch (error) {
      const err = error as Error;
      res.status(500).json({
        success: false,
        message: 'Error checking ownership',
        error: err.message,
      });
    }
  };
};