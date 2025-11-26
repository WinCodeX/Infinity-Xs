// src/controllers/auth.controller.ts

import { Response } from 'express';
import { AuthRequest } from '../types';
import User from '../models/User.model';
import { asyncHandler } from '../middleware/error.middleware';
import { AppError } from '../middleware/error.middleware';

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
export const register = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { email, password, name } = req.body;

    // 1. Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new AppError('User already exists with this email', 400);
    }

    // 2. Create new user
    // The password hashing is handled by the model's pre-save middleware
    const user = await User.create({
      email,
      password,
      name,
    });

    // 3. Generate Token
    const token = user.generateAuthToken();

    // 4. Send Response
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
 */
export const login = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Please provide an email and password', 400);
    }

    // Explicitly select password since it's set to select: false in schema
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

    // Hide password in response
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
 * @access  Private
 */
export const getMe = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    // req.user is set by the protect middleware
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
 */
export const updateProfile = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('User not found', 404);
    }

    const allowedUpdates = ['name', 'phone', 'address', 'avatar'];
    const updates: any = {};

    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

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
 */
export const changePassword = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { currentPassword, newPassword } = req.body;

    if (!req.user) {
      throw new AppError('User not found', 404);
    }

    const user = await User.findById(req.user._id).select('+password');

    if (!user || !user.password) {
      throw new AppError('User not found or password not set', 404);
    }

    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 401);
    }

    if (!newPassword || newPassword.length < 6) {
      throw new AppError('New password must be at least 6 characters', 400);
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  }
);

/**
 * @route   POST /api/auth/google
 * @desc    Google OAuth placeholder
 * @access  Public
 */
export const googleAuth = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    res.status(501).json({
      success: false,
      message: 'Google OAuth not yet implemented',
    });
  }
);
