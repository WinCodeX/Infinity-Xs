// src/controllers/cart.controller.ts

/**
 * Cart Controller - FIXED VERSION
 * 
 * Handles shopping cart operations and checkout with M-Pesa
 */

import { Response } from 'express';
import { AuthRequest, OrderStatus, PaymentMethod } from '../types';
import Cart from '../models/Cart.model';
import Product from '../models/Product.model';
import Order from '../models/Order.model';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import { initiateMpesaStkPush } from '../services/mpesa.service';

/**
 * @route   POST /api/cart
 * @desc    Add item to cart
 * @access  Private
 */
export const addToCart = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { productId, quantity, size, color } = req.body;

    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Check if product is active
    if (!product.isActive) {
      throw new AppError('Product is not available', 400);
    }

    // Check stock for physical products
    if (product.stock !== -1 && product.stock < quantity) {
      throw new AppError(
        `Insufficient stock. Only ${product.stock} items available.`,
        400
      );
    }

    // Get or create cart
    const cart = await Cart.getOrCreateCart(req.user._id);

    // Add item to cart
    await cart.addItem(productId, quantity, product.price, size, color);

    // Populate cart items for response
    await cart.populate('items.product', 'name price images');

    res.status(200).json({
      success: true,
      message: 'Item added to cart',
      data: cart,
    });
  }
);

/**
 * @route   GET /api/cart
 * @desc    Get user's cart
 * @access  Private
 */
export const getCart = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const cart = await Cart.findOne({ user: req.user._id }).populate(
      'items.product',
      'name price images stock isActive'
    );

    if (!cart) {
      // Return empty cart if doesn't exist
      res.status(200).json({
        success: true,
        data: {
          items: [],
          totalAmount: 0,
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: cart,
    });
  }
);

/**
 * @route   PUT /api/cart/update
 * @desc    Update cart item quantity
 * @access  Private
 */
export const updateCartItem = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { productId, quantity, size, color } = req.body;

    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      throw new AppError('Cart not found', 404);
    }

    // Update quantity
    const updated = await cart.updateQuantity(productId, quantity, size, color);

    if (!updated) {
      throw new AppError('Item not found in cart', 404);
    }

    await cart.populate('items.product', 'name price images');

    res.status(200).json({
      success: true,
      message: 'Cart updated',
      data: cart,
    });
  }
);

/**
 * @route   DELETE /api/cart/:productId
 * @desc    Remove item from cart
 * @access  Private
 */
export const removeFromCart = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { productId } = req.params;
    const { size, color } = req.query;

    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      throw new AppError('Cart not found', 404);
    }

    await cart.removeItem(productId, size as string, color as string);
    await cart.populate('items.product', 'name price images');

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      data: cart,
    });
  }
);

/**
 * @route   DELETE /api/cart
 * @desc    Clear entire cart
 * @access  Private
 */
export const clearCart = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      throw new AppError('Cart not found', 404);
    }

    await cart.clearCart();

    res.status(200).json({
      success: true,
      message: 'Cart cleared',
      data: cart,
    });
  }
);

/**
 * @route   POST /api/cart/checkout
 * @desc    Checkout cart and create order (with M-Pesa payment)
 * @access  Private
 * 
 * IMPORTANT: This creates an order and initiates M-Pesa payment
 * The payment is completed via callback (see mpesa.controller.ts)
 */
export const checkoutCart = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const {
      shippingAddress: inputAddress,
      paymentMethod: inputPaymentMethod,
      notes,
      phoneNumber,
    } = req.body;

    console.log('🛒 Checkout initiated by user:', req.user.email);
    console.log('Payment method:', inputPaymentMethod);

    // 1. Validate payment method
    let paymentMethod = inputPaymentMethod;

    // Handle case variations (Mpesa, mpesa, MPESA)
    if (inputPaymentMethod?.toLowerCase() === 'mpesa') {
      paymentMethod = PaymentMethod.MPESA;
    }

    if (!Object.values(PaymentMethod).includes(paymentMethod)) {
      throw new AppError(
        `Invalid payment method: ${inputPaymentMethod}. Supported: mpesa, card, cash`,
        400
      );
    }

    // 2. Validate shipping address
    if (!inputAddress) {
      throw new AppError('Shipping address is required', 400);
    }

    const requiredFields = ['name', 'address', 'city', 'state', 'postalCode'];
    const missingFields = requiredFields.filter(
      (field) => !inputAddress[field]
    );

    if (missingFields.length > 0) {
      throw new AppError(
        `Missing shipping address fields: ${missingFields.join(', ')}`,
        400
      );
    }

    // Map to Order schema format
    const shippingAddress = {
      name: inputAddress.name,
      street: inputAddress.address, // Map 'address' to 'street'
      city: inputAddress.city,
      state: inputAddress.state,
      zipCode: inputAddress.postalCode, // Map 'postalCode' to 'zipCode'
      country: inputAddress.country || 'Kenya',
      phone: phoneNumber || req.user.phone || '',
    };

    // Validate phone for M-Pesa
    if (paymentMethod === PaymentMethod.MPESA) {
      if (!shippingAddress.phone) {
        throw new AppError(
          'Phone number is required for M-Pesa payment',
          400
        );
      }

      // Basic phone validation
      const cleanPhone = shippingAddress.phone.replace(/[\s\-\(\)]/g, '');
      if (cleanPhone.length < 10) {
        throw new AppError('Invalid phone number format', 400);
      }
    }

    // 3. Get and validate cart
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      'items.product'
    );

    if (!cart || cart.items.length === 0) {
      throw new AppError('Cart is empty', 400);
    }

    // Check stock availability
    for (const item of cart.items) {
      const product = item.product as any;
      
      if (!product.isActive) {
        throw new AppError(`Product ${product.name} is no longer available`, 400);
      }

      if (product.stock !== -1 && product.stock < item.quantity) {
        throw new AppError(
          `Insufficient stock for ${product.name}. Only ${product.stock} available.`,
          400
        );
      }
    }

    const totalAmount = cart.totalAmount;

    // Validate minimum amount for M-Pesa
    if (paymentMethod === PaymentMethod.MPESA && totalAmount < 1) {
      throw new AppError('Minimum checkout amount is KES 1', 400);
    }

    // 4. Create order
    // Note: Order number will be auto-generated by pre-save middleware
    const order = await Order.create({
      user: req.user._id,
      items: cart.items,
      totalAmount,
      shippingAddress,
      paymentMethod,
      notes: notes || '',
      status: OrderStatus.PENDING, // Will change to PAID after successful payment
      paymentStatus: 'pending',
    });

    console.log('📦 Order created:', order._id);

    let paymentDetails = null;

    // 5. Handle M-Pesa payment
    if (paymentMethod === PaymentMethod.MPESA) {
      try {
        console.log('💳 Initiating M-Pesa payment...');
        console.log('Amount:', totalAmount);
        console.log('Phone:', shippingAddress.phone);
        console.log('Order ID:', order._id);

        const mpesaResult = await initiateMpesaStkPush(
          totalAmount,
          shippingAddress.phone,
          order._id.toString()
        );

        console.log('✅ M-Pesa STK Push successful');

        // Save checkout request ID for callback matching
        order.transactionId = mpesaResult.CheckoutRequestID;
        await order.save();

        paymentDetails = {
          CheckoutRequestID: mpesaResult.CheckoutRequestID,
          MerchantRequestID: mpesaResult.MerchantRequestID,
          ResponseCode: mpesaResult.ResponseCode,
          CustomerMessage: mpesaResult.CustomerMessage,
        };

      } catch (error: any) {
        console.error('❌ M-Pesa initiation failed:', error);

        // Delete the order since payment failed
        await Order.findByIdAndDelete(order._id);

        // Rethrow with user-friendly message
        if (error instanceof AppError) {
          throw error;
        }

        throw new AppError(
          'Failed to initiate M-Pesa payment. Please check your phone number and try again.',
          500
        );
      }
    }

    // 6. For non-M-Pesa payments, clear cart immediately
    // For M-Pesa, cart is cleared after payment callback confirms success
    if (paymentMethod !== PaymentMethod.MPESA) {
      await cart.clearCart();
      
      // Update order status for cash payment
      if (paymentMethod === PaymentMethod.CASH) {
        order.status = OrderStatus.PROCESSING;
        await order.save();
      }
    }

    // 7. Populate order for response
    await order.populate('items.product', 'name price images');

    // 8. Send response
    const responseMessage =
      paymentMethod === PaymentMethod.MPESA
        ? 'Order created. Please check your phone for M-Pesa payment prompt.'
        : 'Order placed successfully.';

    res.status(201).json({
      success: true,
      message: responseMessage,
      data: {
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          status: order.status,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          shippingAddress: order.shippingAddress,
          items: order.items,
          createdAt: order.createdAt,
        },
        paymentDetails,
      },
    });
  }
);