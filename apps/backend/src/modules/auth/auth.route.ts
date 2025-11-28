// src/modules/auth/auth.route.ts

import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../../config/database'; // Use the Prisma Client
import { UserRole } from '../../types'; // Re-use types
import { AuthRequest } from '../../types'; // Extended request
import { generateAuthToken, comparePassword, hashPassword } from './auth.utils'; // New utils for JWT/Bcrypt
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const authRouter = Router();

// --- 1. Utility Functions (Replaces Mongoose Methods) ---

/**
 * NOTE: In a clean structure, these utils would be in a separate auth.service.ts
 * But for the single-file concept, we define them here or import from local utils.
 */
const hashPassword = async (password: string): Promise<string> => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

const comparePassword = async (candidate: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(candidate, hash);
};

const generateAuthToken = (userId: string, email: string, role: UserRole): string => {
    const payload = { userId, email, role };
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not defined');
    
    return jwt.sign(payload, secret, {
        expiresIn: process.env.JWT_EXPIRE || '7d',
    });
};


// --- 2. Controller/Route Logic (Consolidated) ---

// POST /api/auth/register
authRouter.post(
  '/register',
  [
    // Validation (Replaces validate.middleware.ts)
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').notEmpty().withMessage('Name is required'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name } = req.body;

    try {
      // 1. Check if user already exists (Prisma Query)
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ message: 'User already exists' });
      }

      // 2. Hash Password and Create User (Prisma Mutation)
      const hashedPassword = await hashPassword(password);

      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: UserRole.CUSTOMER,
          isEmailVerified: false,
        },
      });

      // 3. Generate Token
      const token = generateAuthToken(newUser.id, newUser.email, newUser.role as UserRole);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: { id: newUser.id, name: newUser.name, email: newUser.email },
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Server error during registration' });
    }
  }
);


// POST /api/auth/login
authRouter.post(
    '/login',
    [
        // Validation
        body('email').isEmail().withMessage('Invalid email'),
        body('password').notEmpty().withMessage('Password is required'),
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        try {
            // 1. Find user by email (select password field)
            const user = await prisma.user.findUnique({
                where: { email },
                select: { id: true, email: true, name: true, role: true, password: true },
            });

            if (!user || !user.password) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            // 2. Compare Password
            const isMatch = await comparePassword(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            // 3. Generate Token
            const token = generateAuthToken(user.id, user.email, user.role as UserRole);

            res.json({
                success: true,
                message: 'Login successful',
                token,
                user: { id: user.id, name: user.name, email: user.email, role: user.role },
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ message: 'Server error during login' });
        }
    }
);


// GET /api/auth/me (Requires Auth Middleware)
authRouter.get('/me', (req: AuthRequest, res: Response) => {
    // AuthRequest already has the user from middleware
    if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // The user object here is the result of the token verification
    // You might want to fetch the latest user data from DB here if needed
    res.json({ success: true, user: req.user });
});

export default authRouter;