// src/models/User.model.ts
import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IUser, UserRole, JWTPayload } from '../types';

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.CUSTOMER,
    },
    googleId: { type: String, unique: true, sparse: true },
    avatar: { type: String, default: '' },
    phone: { type: String },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zipCode: { type: String },
      country: { type: String, default: 'Kenya' },
    },
    isEmailVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

/**
 * FIXED MIDDLEWARE
 * Removed 'next' parameter because we are using async/await
 */
UserSchema.pre('save', async function () {
  // Only hash the password if it's new or modified
  if (!this.isModified('password') || !this.password) {
    return;
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw new Error(error as string);
  }
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.generateAuthToken = function (): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not defined');

  const payload: JWTPayload = {
    userId: this._id.toString(),
    email: this.email,
    role: this.role,
  };

  return jwt.sign(payload, secret, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);
export default User;
