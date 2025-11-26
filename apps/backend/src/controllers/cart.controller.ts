// src/controllers/cart.controller.ts

import { Response, Request } from 'express';
import { AuthRequest, OrderStatus, PaymentMethod } from '../types'; 
import Cart from '../models/Cart.model';
import Product from '../models/Product.model';
import Order from '../models/Order.model';
import { asyncHandler, AppError } from '../middleware/error.middleware';

import { initiateMpesaStkPush } from '../services/mpesa.service'; 

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

// @desc    Checkout the cart, create order, and initiate payment (M-Pesa)
// @route   POST /api/cart/checkout
// @access  Private
export const checkoutCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { 
    shippingAddress, 
    paymentMethod, 
    notes, 
    phoneNumber // Required for M-Pesa
  } = req.body;

  const userId = req.user!._id;

  // 1. Get user's cart and validate
  const cart = await Cart.findOne({ user: userId });
  if (!cart || cart.items.length === 0) {
    throw new AppError('Cart is empty. Cannot checkout.', 400);
  }

  // 2. Data Validation specific to M-Pesa
  const totalAmount = cart.totalAmount;

  if (paymentMethod === PaymentMethod.MPESA) {
    if (!phoneNumber && !req.user!.phone) {
      throw new AppError('M-Pesa payment requires a registered phone number in the request body or user profile.', 400);
    }
    if (totalAmount <= 1) {
        throw new AppError('Minimum checkout amount for M-Pesa is KES 1.', 400);
    }
  }

  // 3. Create Order Document (Snapshot of cart and set initial status)
  const order = await Order.create({
    user: userId,
    items: cart.items,
    totalAmount,
    shippingAddress,
    paymentMethod,
    notes,
    orderNumber: 'TEMP', 
    orderStatus: paymentMethod === PaymentMethod.MPESA ? OrderStatus.PENDING_PAYMENT : OrderStatus.PLACED,
  });

  let paymentDetails = null;

  // 4. Initiate M-Pesa Payment
  if (paymentMethod === PaymentMethod.MPESA) {
    try {
      const phoneForStk = phoneNumber || req.user!.phone;
      
      const paymentResult = await initiateMpesaStkPush(
        totalAmount, 
        phoneForStk, 
        order._id.toString() 
      );
      
      // Save the M-Pesa Checkout Request ID for tracking callbacks
      order.mpesaCheckoutId = paymentResult.CheckoutRequestID; 
      await order.save();
      
      paymentDetails = { 
        CheckoutRequestID: paymentResult.CheckoutRequestID,
        MerchantRequestID: paymentResult.MerchantRequestID,
        ResponseCode: paymentResult.ResponseCode,
        CustomerMessage: paymentResult.CustomerMessage
      };

      console.log(`📲 M-Pesa STK Push initiated successfully for Order ${order._id}`);

    } catch (error) {
      // If payment initiation fails, clean up the failed order document
      await Order.findByIdAndDelete(order._id); 
      console.error('M-Pesa STK Initiation Failed:', error);
      throw new AppError('Failed to initiate M-Pesa payment. Please check logs for details.', 500);
    }
  } else {
    // For other methods (e.g., Cash on Delivery), we clear the cart immediately
    await cart.clearCart();
  }

  // 5. Respond
  res.status(201).json({ 
    success: true, 
    message: paymentMethod === PaymentMethod.MPESA 
        ? 'Checkout successful. Please check phone for payment prompt.' 
        : 'Checkout successful. Order placed.', 
    data: {
        order,
        paymentDetails
    }
  });
});