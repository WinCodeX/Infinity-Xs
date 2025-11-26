// src/models/User.model.ts

/**
 * User Model
 * * Defines the User schema for MongoDB and includes methods for:
 * - Password hashing
 * - Password comparison
 * - JWT token generation
 */

import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
// Assuming '../types' exports IUser, UserRole, and JWTPayload
import { IUser, UserRole, JWTPayload } from '../types'; 

/**
 * User Schema Definition
 * * Schema defines the structure of documents in the 'users' collection
 */
const UserSchema = new Schema<IUser>(
  {
    // Email - required and unique
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },

    // Password - optional for OAuth users
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },

    // Full name
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },

    // User role - determines permissions
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.CUSTOMER,
    },

    // Google OAuth ID
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    // Profile picture URL
    avatar: {
      type: String,
      default: '',
    },

    // Phone number
    phone: {
      type: String,
      match: [/^[0-9]{10,15}$/, 'Please provide a valid phone number'],
    },

    // Address object
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zipCode: { type: String },
      country: { type: String, default: 'Kenya' },
    },

    // Email verification status
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    // Automatically add createdAt and updatedAt timestamps
    timestamps: true,
  }
);

/**
 * Pre-save Middleware: Password Hashing
 * * NOTE: Using function() {} is necessary to access 'this' context.
 */
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

/**
 * Instance Method: Compare Password
 */
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  // If user doesn't have a password (e.g., OAuth user), comparing is moot.
  if (!this.password) {
    return false;
  }
  
  // bcrypt.compare handles hashing the candidate and comparing to the stored hash
  return bcrypt.compare(candidatePassword, this.password).catch(() => false);
};

/**
 * Instance Method: Generate Auth Token
 */
UserSchema.methods.generateAuthToken = function (): string {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    // Better practice: Log and throw a specific internal error
    console.error('FATAL: JWT_SECRET environment variable is missing.');
    throw new Error('Server configuration error: JWT secret not defined.');
  }

  const payload: JWTPayload = {
    userId: this._id.toString(),
    email: this.email,
    role: this.role,
  };

  const token = jwt.sign(
    payload,
    secret,
    {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    }
  );

  return token;
};

/**
 * Create and export the User model
 * * This model is what you must import in your controllers to use methods 
 * like User.create() or new User().save().
 */
const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);

export default User;
