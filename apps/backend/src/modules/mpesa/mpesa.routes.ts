// src/routes/mpesa.routes.ts

/**
 * M-Pesa Payment Routes
 * 
 * Handles M-Pesa callbacks and payment status checks
 */

import { Router } from 'express';
import {
  mpesaCallback,
  mpesaValidation,
  mpesaTimeout,
  checkOrderStatus,
} from './mpesa.controller';
import { protect } from '../../middleware/auth.middleware';

const router = Router();

/**
 * PUBLIC ROUTES (called by Safaricom)
 * 
 * These must be publicly accessible without authentication
 * M-Pesa servers will call these endpoints
 */

// POST /api/payments/mpesa/callback
// Main callback - called when payment is completed/failed
router.post('/callback', mpesaCallback);

// GET /api/payments/mpesa/callback
// Validation endpoint - M-Pesa pings this to verify URL is working
router.get('/callback', mpesaValidation);

// POST /api/payments/mpesa/timeout
// Called when user doesn't respond to STK push
router.post('/timeout', mpesaTimeout);

/**
 * PROTECTED ROUTES
 * 
 * Require authentication
 */

// GET /api/payments/order/:orderId/status
// Check payment status of an order
router.get('/order/:orderId/status', protect, checkOrderStatus);

export default router;