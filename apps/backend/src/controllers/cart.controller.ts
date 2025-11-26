import { Response } from 'express';
import { AuthRequest } from '../types';
import Cart from '../models/Cart.model';
import Product from '../models/Product.model';
import { asyncHandler, AppError } from '../middleware/error.middleware';

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
export const addToCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { productId, quantity, size, color } = req.body;

  const product = await Product.findById(productId);
  if (!product) throw new AppError('Product not found', 404);

  // Get user's cart or create one
  const cart = await Cart.getOrCreateCart(req.user!._id);

  // Add item
  await cart.addItem(productId, quantity, product.price, size, color);

  res.status(200).json({ success: true, data: cart });
});

// @desc    Get my cart
// @route   GET /api/cart
// @access  Private
export const getCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const cart = await Cart.findOne({ user: req.user!._id }).populate('items.product');
  res.status(200).json({ success: true, data: cart });
});
