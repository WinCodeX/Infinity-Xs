// src/controllers/auth.controller.ts

/**
 * Authentication Controllers
 * * Handles user registration, login, and profile management
 * Controllers contain the business logic for each route
 */

import { Response } from 'express';
// Assuming AuthRequest and AppError are defined in '../types' or similar
// Assuming IUserDocument is defined to include custom methods (comparePassword, generateAuthToken)
import { AuthRequest, IUserDocument } from '../types'; 
// We cast the imported default model to our custom UserModel type for type safety
import User from '../models/User.model'; 
import { asyncHandler, AppError } from '../middleware/error.middleware';
import { Model } from 'mongoose'; 

// Cast the imported model to a type that includes the custom instance methods
const UserModel = User as unknown as Model<IUserDocument>;

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
export const register = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });

    if (existingUser) {
      throw new AppError('User already exists with this email', 400);
    }

    // Create new user (password auto-hashed by pre-save middleware)
    const user = await UserModel.create({
      email,
      password,
      name,
    });

    // Generate JWT token
    const token = user.generateAuthToken();

    // Send response
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

---

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
export const login = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { email, password } = req.body;

    // Find user and explicitly include password field
    const user = await UserModel.findOne({ email }).select('+password');

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check if password matches (comparePassword is a custom instance method)
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate token
    const token = user.generateAuthToken();

    // Remove password from response (user.password is safely defined as optional in IUserDocument)
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

---

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private (requires authentication)
 */
export const getMe = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    // req.user is correctly set by the protect middleware as IUserDocument
    const user = req.user as IUserDocument;
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'User profile retrieved',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          phone: user.phone,
          address: user.address,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt,
        },
      },
    });
  }
);

---

/**
 * @route   PUT /api/auth/update
 * @desc    Update user profile
 * @access  Private
 */
export const updateProfile = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const currentUser = req.user as IUserDocument;
    
    if (!currentUser) {
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
    const user = await UserModel.findByIdAndUpdate(
      currentUser._id,
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

---

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
export const changePassword = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { currentPassword, newPassword } = req.body;
    const currentUser = req.user as IUserDocument;

    if (!currentUser) {
      throw new AppError('User not found', 404);
    }

    // Get user with password explicitly selected
    const user = await UserModel.findById(currentUser._id).select('+password');

    if (!user || !user.password) {
      // User must have a password to change it (i.e., not an OAuth user)
      throw new AppError('Password not set for this account', 404);
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 401);
    }

    // Validate new password
    if (!newPassword || newPassword.length < 6) {
      throw new AppError('New password must be at least 6 characters', 400);
    }

    // Update password
    user.password = newPassword;
    await user.save(); // This triggers pre-save middleware to hash the new password

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  }
);

---

/**
 * @route   POST /api/auth/google
 * @desc    Google OAuth login/register
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
