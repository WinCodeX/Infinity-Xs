// src/controllers/order.controller.ts (New Function: placeOrder)

import { Response } from 'express';
import { AuthRequest, OrderStatus, PaymentMethod } from '../types';
import Order from '../models/Order.model';
import Cart from '../models/Cart.model';
import { asyncHandler, AppError } from '../middleware/error.middleware';

// **NOTE:** You will need to create and import this file later
import { initiateMpesaStkPush } from '../services/mpesa.service'; 

// @desc    Place a new order (Checkout)
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
    if (!phoneNumber || !req.user!.phone) {
      throw new AppError('M-Pesa payment requires a registered phone number.', 400);
    }
    // M-Pesa often requires amounts > 1 KES
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
    orderNumber: 'TEMP', // Let pre-save hook handle this
    // Set initial status based on payment method
    orderStatus: paymentMethod === PaymentMethod.MPESA ? OrderStatus.PENDING_PAYMENT : OrderStatus.PLACED,
  });

  let paymentResult = null;

  // 4. Initiate M-Pesa Payment
  if (paymentMethod === PaymentMethod.MPESA) {
    try {
      paymentResult = await initiateMpesaStkPush(
        totalAmount, 
        phoneNumber || req.user!.phone, // Use user phone or body phone
        order._id.toString()
      );
      
      // Update order with M-Pesa details (e.g., CheckoutRequestID)
      order.mpesaCheckoutId = paymentResult.CheckoutRequestID; 
      await order.save();
      
      console.log(`📲 M-Pesa STK Push initiated successfully for Order ${order._id}`);

    } catch (error) {
      // If payment initiation fails, log and throw error, or mark order as FAILED
      await Order.findByIdAndDelete(order._id); // Clean up the failed order
      throw new AppError('Failed to initiate M-Pesa payment. Please try again.', 500);
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
