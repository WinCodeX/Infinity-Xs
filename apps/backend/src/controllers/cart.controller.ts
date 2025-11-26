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
    shippingAddress: inputShippingAddress, // The incoming address object
    paymentMethod: inputPaymentMethod, // "Mpesa" or other
    notes, 
    phoneNumber // Required for M-Pesa
  } = req.body;

  const userId = req.user!._id;

  // 1. Validate Payment Method (FIX 2: Ensure uppercase MPESA is used)
  const paymentMethod = inputPaymentMethod === 'Mpesa' ? PaymentMethod.MPESA : inputPaymentMethod;
  if (!Object.values(PaymentMethod).includes(paymentMethod)) {
    throw new AppError(`Invalid payment method: ${inputPaymentMethod}.`, 400);
  }

  // 2. Validate and Map Shipping Address (FIX 1: Map fields to match Order Model schema)
  // NOTE: You must now provide 'name' and 'state' in your request body as they are required by the model.
  const requiredAddressFields = ['address', 'city', 'postalCode', 'name', 'state'];
  const missingFields = requiredAddressFields.filter(field => !inputShippingAddress[field]);
  
  if (missingFields.length > 0) {
      throw new AppError(`Missing required shipping address fields: ${missingFields.join(', ')}.`, 400);
  }

  // Transform the incoming address fields into the format required by the Order model
  const shippingAddress = {
    // You MUST provide name and state in your incoming request body now.
    name: inputShippingAddress.name, 
    state: inputShippingAddress.state,
    
    // Map your fields to the model's required fields
    street: inputShippingAddress.address, // maps 'address' to 'street'
    zipCode: inputShippingAddress.postalCode, // maps 'postalCode' to 'zipCode'
    
    // Use the phoneNumber from the root body for the shipping address phone
    phone: phoneNumber, 
    city: inputShippingAddress.city,
    country: inputShippingAddress.country || 'Kenya',
  };


  // 3. Get user's cart and validate
  const cart = await Cart.findOne({ user: userId });
  if (!cart || cart.items.length === 0) {
    throw new AppError('Cart is empty. Cannot checkout.', 400);
  }

  // 4. Data Validation specific to M-Pesa
  const totalAmount = cart.totalAmount;

  if (paymentMethod === PaymentMethod.MPESA) {
    // Note: We already checked phoneNumber is available in step 2 (mapping to shippingAddress.phone)
    if (totalAmount <= 1) {
        throw new AppError('Minimum checkout amount for M-Pesa is KES 1.', 400);
    }
  }

  // 5. Create Order Document (Snapshot of cart and set initial status)
  const order = await Order.create({
    user: userId,
    items: cart.items,
    totalAmount,
    shippingAddress, // Use the mapped object
    paymentMethod, // Use the validated/mapped method
    notes,
    orderNumber: 'TEMP', 
    orderStatus: paymentMethod === PaymentMethod.MPESA ? OrderStatus.PENDING_PAYMENT : OrderStatus.PLACED,
  });

  let paymentDetails = null;

  // 6. Initiate M-Pesa Payment
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
        CustomerMessage: paymentResult.ResponseCode === '0' ? 'Success. Check your phone for the M-Pesa prompt.' : paymentResult.CustomerMessage
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

  // 7. Respond
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