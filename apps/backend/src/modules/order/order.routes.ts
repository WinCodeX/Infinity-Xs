// src/routes/order.routes.ts

import express from 'express';
import { mpesaCallback } from './order.controller';

const router = express.Router();

// 1. MPESA CALLBACK ROUTE (Public endpoint called by Daraja API)
// Maps: POST /api/orders/callback
router.post('/callback', mpesaCallback);

export default router;