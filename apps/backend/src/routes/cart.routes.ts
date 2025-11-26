// src/routes/cart.routes.ts

import express from 'express';
import { addToCart, getCart, checkoutCart } from '../controllers/cart.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.use(protect); // All cart routes are protected

router.route('/')
  .get(getCart)
  .post(addToCart);

// Checkout route to start the payment process and order creation
router.post('/checkout', checkoutCart);

export default router;