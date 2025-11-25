// src/controllers/auth.controller.ts

/**
 * Authentication Controllers
 * 
 * Handles user registration, login, and profile management
 * Controllers contain the business logic for each route
 */

import { Response } from 'express';
import { AuthRequest } from '../types';
import User from '../models/User.model';
import { asyncHandler } from '../middleware/error.middleware';
import { AppError } from '../middleware/error.middleware';

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 * 
 * Flow:
 * 1. Check if user already exists
 * 2. Create new user (password auto-hashed by model)
 * 3. Generate JWT token
 * 4. Return user data and token
 */
export const register = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new AppError('User already exists with this email', 400);
    }

    // Create new user
    // Password will be automatically hashed by pre-save middleware
    const user = await User.create({
      email,
      password,
      name,
    });

    // Generate JWT token
    const token = user.generateAuthToken();

    // Send response
    // Don't send password back even though it's hashed
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
        },
        token,
      },
    });
  }
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 * 
 * Flow:
 * 1. Find user by email (include password this time)
 * 2. Verify password
 * 3. Generate token
 * 4. Return user and token
 */
export const login = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { email, password } = req.body;

    // Find user and include password field
    // select('+password') overrides the default select: false
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check if password matches
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate token
    const token = user.generateAuthToken();

    // Remove password from response
    user.password = undefined;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          phone: user.phone,
          address: user.address,
        },
        token,
      },
    });
  }
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private (requires authentication)
 * 
 * req.user is set by the protect middleware
 */
export const getMe = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    // User already attached by protect middleware
    if (!req.user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'User profile retrieved',
      data: {
        user: {
          _id: req.user._id,
          email: req.user.email,
          name: req.user.name,
          role: req.user.role,
          avatar: req.user.avatar,
          phone: req.user.phone,
          address: req.user.address,
          isEmailVerified: req.user.isEmailVerified,
          createdAt: req.user.createdAt,
        },
      },
    });
  }
);

/**
 * @route   PUT /api/auth/update
 * @desc    Update user profile
 * @access  Private
 * 
 * Allows users to update their name, phone, and address
 * Email and password require separate routes for security
 */
export const updateProfile = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('User not found', 404);
    }

    // Fields that can be updated
    const allowedUpdates = ['name', 'phone', 'address', 'avatar'];

    // Filter request body to only include allowed fields
    const updates: any = {};
    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      {
        new: true, // Return updated document
        runValidators: true, // Run schema validators
      }
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          phone: user.phone,
          address: user.address,
        },
      },
    });
  }
);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 * 
 * Requires current password for security
 */
export const changePassword = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { currentPassword, newPassword } = req.body;

    if (!req.user) {
      throw new AppError('User not found', 404);
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    if (!user || !user.password) {
      throw new AppError('User not found', 404);
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 401);
    }

    // Validate new password
    if (newPassword.length < 6) {
      throw new AppError('New password must be at least 6 characters', 400);
    }

    // Update password
    user.password = newPassword;
    await user.save(); // This triggers pre-save middleware to hash password

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  }
);

/**
 * @route   POST /api/auth/google
 * @desc    Google OAuth login/register
 * @access  Public
 * 
 * This will be implemented with Passport.js
 * For now, we'll create a placeholder
 */
export const googleAuth = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    // This will be implemented with passport-google-oauth20
    // For now, return a message
    res.status(501).json({
      success: false,
      message: 'Google OAuth not yet implemented',
    });
  }
);