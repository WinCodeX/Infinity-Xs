// src/routes/auth.routes.ts

/**
 * Authentication Routes
 * 
 * Defines all authentication-related endpoints
 * Routes connect URLs to controller functions
 */

import { Router } from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  googleAuth,
} from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import { validateRegister, validateLogin } from '../middleware/validate.middleware';

/**
 * Create Router Instance
 * 
 * Router is like a mini-app that handles a group of routes
 */
const router = Router();

/**
 * PUBLIC ROUTES
 * 
 * Anyone can access these without authentication
 */

// POST /api/auth/register
// Register a new user
router.post('/register', validateRegister, register);

// POST /api/auth/login
// Login existing user
router.post('/login', validateLogin, login);

// POST /api/auth/google
// Google OAuth (placeholder for now)
router.post('/google', googleAuth);

/**
 * PROTECTED ROUTES
 * 
 * Require authentication (JWT token)
 * All routes below this line use protect middleware
 */

// GET /api/auth/me
// Get current user profile
router.get('/me', protect, getMe);

// PUT /api/auth/update
// Update user profile
router.put('/update', protect, updateProfile);

// PUT /api/auth/change-password
// Change user password
router.put('/change-password', protect, changePassword);

/**
 * ROUTE EXPLANATION:
 * 
 * router.METHOD(PATH, [MIDDLEWARE...], CONTROLLER)
 * 
 * METHOD: get, post, put, delete, patch
 * PATH: The URL endpoint (e.g., '/register')
 * MIDDLEWARE: Functions that run before controller (optional)
 * CONTROLLER: The function that handles the request
 * 
 * Example:
 * router.post('/register', validateRegister, register);
 *           ↓         ↓            ↓              ↓
 *        Method     Path      Validation      Controller
 * 
 * Flow: Request → Validation → Controller → Response
 */

export default router;