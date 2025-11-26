// src/controllers/order.controller.ts

import { Response, Request } from 'express';
// Note: Assuming these types, models, and middleware exist and are correctly configured.
import { AuthRequest, OrderStatus, PaymentMethod } from '../types';
import Order from '../models/Order.model';
import Cart from '../models/Cart.model';
import { asyncHandler, AppError } from '../middleware/error.middleware';

// **NOTE:** Using .js extension for module resolution safety
import { initiateMpesaStkPush } from '../services/mpesa.service.js'; 

// @desc    Place a new order (Checkout from Cart)
// @route   POST /api/orders
// @access  Private
export const placeOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
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
    throw new AppError('Cart is empty. Cannot place an order.', 400);
  }

  // 2. Data Validation specific to M-Pesa
  const totalAmount = cart.totalAmount;

  if (paymentMethod === PaymentMethod.MPESA) {
    // If phone number is not provided in body, check the authenticated user object
    if (!phoneNumber && !req.user!.phone) {
      throw new AppError('M-Pesa payment requires a registered phone number in the request body or user profile.', 400);
    }
    // M-Pesa minimum amount check
    if (totalAmount <= 1) {
        throw new AppError('Minimum order amount for M-Pesa is KES 1.', 400);
    }
  }

  // 3. Create Order Document (Set initial status to Pending Payment)
  const order = await Order.create({
    user: userId,
    items: cart.items,
    totalAmount,
    shippingAddress,
    paymentMethod,
    notes,
    orderNumber: 'TEMP', // Assuming a pre-save hook generates the final number
    // Set initial status based on payment method
    orderStatus: paymentMethod === PaymentMethod.MPESA ? OrderStatus.PENDING_PAYMENT : OrderStatus.PLACED,
  });

  let paymentResult = null;

  // 4. Initiate M-Pesa Payment
  if (paymentMethod === PaymentMethod.MPESA) {
    try {
      // Use phone from body first, then fallback to user profile phone
      const phoneForStk = phoneNumber || req.user!.phone;
      
      paymentResult = await initiateMpesaStkPush(
        totalAmount, 
        phoneForStk, 
        order._id.toString()
      );
      
      // Save the M-Pesa Checkout Request ID for tracking callbacks
      order.mpesaCheckoutId = paymentResult.CheckoutRequestID; 
      await order.save();
      
      console.log(`📲 M-Pesa STK Push initiated successfully for Order ${order._id}`);

    } catch (error) {
      // If payment initiation fails, clean up the failed order document
      await Order.findByIdAndDelete(order._id); 
      console.error('M-Pesa STK Initiation Failed:', error);
      throw new AppError('Failed to initiate M-Pesa payment. Please check logs for details.', 500);
    }
  }

  // 5. Clear Cart (Only if payment initiation was successful or not required)
  await cart.clearCart();

  // 6. Respond
  res.status(201).json({ 
    success: true, 
    message: paymentMethod === PaymentMethod.MPESA ? 'Order placed. Please check phone for payment prompt.' : 'Order placed successfully.', 
    data: {
        order,
        paymentDetails: paymentResult
    }
  });
});


// @desc    Receives the final payment status from M-Pesa API (Callback)
// @route   POST /api/orders/callback
// @access  Public (Called by M-Pesa servers, MUST be public)
export const mpesaCallback = asyncHandler(async (req: Request, res: Response) => {
    // This is a minimal stub to ensure the route exists and returns 200 OK.
    // Full implementation requires parsing complex M-Pesa JSON and updating the Order.
    console.log('M-Pesa Callback received:', req.body);
    
    // CRITICAL: Must return 200 OK immediately to M-Pesa to prevent retries.
    res.status(200).send('Callback received and acknowledged.');
});

// NOTE: We no longer need 'createOrder' or 'checkoutOrder' as 'placeOrder' handles checkout.