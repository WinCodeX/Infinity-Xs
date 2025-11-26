// src/routes/order.routes.ts

import express from 'express';
// NOTE: We need to import the new controller function for checkout
import { createOrder, checkoutOrder } from '../controllers/order.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

// 1. STANDARD ROUTE: Creates the order (typically without payment info or just initiates it)
// Maps: POST /api/orders
router.post('/', protect, createOrder);

// 2. CHECKOUT ROUTE: Handles the specific payment finalization (e.g., M-Pesa STK Push)
// Maps: POST /api/orders/checkout
router.post('/checkout', protect, checkoutOrder);

export default router;
