// src/routes/order.routes.ts

import express from 'express';
// **FIX: Explicitly use .js extension**
import { placeOrder, mpesaCallback } from '../controllers/order.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

// 1. PLACE ORDER ROUTE
// Maps: POST /api/orders
router.post('/', protect, placeOrder);

// 2. MPESA CALLBACK ROUTE
// Maps: POST /api/orders/callback
router.post('/callback', mpesaCallback);

export default router;