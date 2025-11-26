// src/routes/order.routes.ts

import express from 'express';
// --- FIX: Only import the correct functions and add .js extensions ---
import { placeOrder, mpesaCallback } from '../controllers/order.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// 1. PLACE ORDER ROUTE
// Handles the full checkout process (cart to order + payment initiation).
// Maps: POST /api/orders
router.post('/', protect, placeOrder);

// 2. MPESA CALLBACK ROUTE
// This is the route the Daraja API will POST to. It MUST NOT be protected.
// Maps: POST /api/orders/callback
router.post('/callback', mpesaCallback);

// NOTE: If you previously had router.post('/checkout', ...), we removed it,
// as the root route POST /api/orders now handles the checkout via 'placeOrder'.

export default router;