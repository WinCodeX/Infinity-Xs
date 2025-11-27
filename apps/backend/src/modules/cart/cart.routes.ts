// src/routes/cart.routes.ts

/**
 * Cart Routes
 * 
 * Handles shopping cart and checkout operations
 */

import { Router } from 'express';
import {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  checkoutCart,
} from '../controllers/cart.controller';
import { protect } from '../middleware/auth.middleware';
import { validateAddToCart } from '../middleware/validate.middleware';

const router = Router();

/**
 * ALL CART ROUTES REQUIRE AUTHENTICATION
 * 
 * Users must be logged in to manage their cart
 */

// GET /api/cart
// Get user's cart
router.get('/', protect, getCart);

// POST /api/cart
// Add item to cart
router.post('/', protect, validateAddToCart, addToCart);

// PUT /api/cart/update
// Update cart item quantity
router.put('/update', protect, updateCartItem);

// DELETE /api/cart/clear
// Clear entire cart
router.delete('/clear', protect, clearCart);

// DELETE /api/cart/:productId
// Remove specific item from cart
router.delete('/:productId', protect, removeFromCart);

// POST /api/cart/checkout
// Checkout and create order
router.post('/checkout', protect, checkoutCart);

export default router;