// src/controllers/mpesa.controller.ts

/**
 * M-Pesa Callback Controller
 * 
 * Handles callbacks from Safaricom Daraja API
 * This is called when user completes/cancels payment on their phone
 * 
 * IMPORTANT: This endpoint must be publicly accessible
 * Use ngrok for local testing
 */

import { Request, Response } from 'express';
import Order from '../order/Order.model';
import Cart from '../cart/Cart.model';
import Product from '../product/Product.model';
import { OrderStatus } from '../../types';
import { asyncHandler } from '../../middleware/error.middleware';

/**
 * M-Pesa Callback Data Interface
 */
interface MpesaCallbackData {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value: string | number;
        }>;
      };
    };
  };
}

/**
 * @route   POST /api/payments/mpesa/callback
 * @desc    Handle M-Pesa payment callback
 * @access  Public (called by Safaricom)
 * 
 * FLOW:
 * 1. Receive callback from M-Pesa
 * 2. Extract payment details
 * 3. Find order by CheckoutRequestID
 * 4. Update order status
 * 5. Clear cart if successful
 * 6. Update product stock
 * 7. Send confirmation to M-Pesa
 */
export const mpesaCallback = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    console.log('📲 M-Pesa callback received');
    console.log('Callback data:', JSON.stringify(req.body, null, 2));

    try {
      // Extract callback data
      const callbackData: MpesaCallbackData = req.body;

      if (!callbackData.Body || !callbackData.Body.stkCallback) {
        console.error('❌ Invalid callback data structure');
        res.status(200).json({
          ResultCode: 1,
          ResultDesc: 'Invalid callback data',
        });
        return;
      }

      const {
        MerchantRequestID,
        CheckoutRequestID,
        ResultCode,
        ResultDesc,
        CallbackMetadata,
      } = callbackData.Body.stkCallback;

      console.log('Merchant Request ID:', MerchantRequestID);
      console.log('Checkout Request ID:', CheckoutRequestID);
      console.log('Result Code:', ResultCode);
      console.log('Result Description:', ResultDesc);

      // Find order by CheckoutRequestID
      const order = await Order.findOne({ mpesaCheckoutId: CheckoutRequestID });

      if (!order) {
        console.error('❌ Order not found for CheckoutRequestID:', CheckoutRequestID);
        
        // Still send success to M-Pesa to avoid retries
        res.status(200).json({
          ResultCode: 0,
          ResultDesc: 'Accepted',
        });
        return;
      }

      console.log('📦 Order found:', order._id);
      console.log('Order Number:', order.orderNumber);

      // ResultCode 0 = Success
      if (ResultCode === 0) {
        console.log('✅ Payment successful');

        // Extract payment details from metadata
        let amount = 0;
        let mpesaReceiptNumber = '';
        let phoneNumber = '';
        let transactionDate = '';

        if (CallbackMetadata && CallbackMetadata.Item) {
          for (const item of CallbackMetadata.Item) {
            switch (item.Name) {
              case 'Amount':
                amount = Number(item.Value);
                break;
              case 'MpesaReceiptNumber':
                mpesaReceiptNumber = String(item.Value);
                break;
              case 'PhoneNumber':
                phoneNumber = String(item.Value);
                break;
              case 'TransactionDate':
                transactionDate = String(item.Value);
                break;
            }
          }
        }

        console.log('Payment Details:');
        console.log('- Amount:', amount);
        console.log('- Receipt:', mpesaReceiptNumber);
        console.log('- Phone:', phoneNumber);
        console.log('- Date:', transactionDate);

        // Update order status
        await order.markAsPaid(CheckoutRequestID, mpesaReceiptNumber);
        console.log('💾 Order marked as paid');

        // Update product stock
        for (const item of order.items) {
          const product = await Product.findById(item.product);
          if (product) {
            const stockDecreased = await product.decreaseStock(item.quantity);
            if (stockDecreased) {
              console.log(`📦 Stock decreased for ${product.name}: -${item.quantity}`);
            } else {
              console.warn(`⚠️  Could not decrease stock for ${product.name}`);
            }
          }
        }

        // Clear user's cart
        const cart = await Cart.findOne({ user: order.user });
        if (cart) {
          await cart.clearCart();
          console.log('🛒 Cart cleared for user');
        }

        console.log('✅ Payment processing completed successfully');

        // TODO: Send email/SMS notification to customer
        // TODO: Notify admin of new order

      } else {
        // Payment failed or cancelled
        console.log('❌ Payment failed or cancelled');
        console.log('Reason:', ResultDesc);

        // Mark payment as failed
        await order.markPaymentFailed();
        console.log('💾 Order marked as payment failed');

        // User can retry checkout
      }

      // Send success response to M-Pesa
      // IMPORTANT: Always return 200 with ResultCode 0
      // Otherwise M-Pesa will retry the callback
      res.status(200).json({
        ResultCode: 0,
        ResultDesc: 'Accepted',
      });

    } catch (error) {
      console.error('❌ Error processing M-Pesa callback:', error);

      // Still send success to M-Pesa to avoid retries
      res.status(200).json({
        ResultCode: 0,
        ResultDesc: 'Accepted',
      });
    }
  }
);

/**
 * @route   GET /api/payments/mpesa/callback
 * @desc    Test endpoint (M-Pesa validation)
 * @access  Public
 */
export const mpesaValidation = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    console.log('M-Pesa validation endpoint called');

    res.status(200).json({
      ResultCode: 0,
      ResultDesc: 'Accepted',
    });
  }
);

/**
 * @route   POST /api/payments/mpesa/timeout
 * @desc    Handle M-Pesa timeout callback
 * @access  Public
 * 
 * Called when user doesn't respond to STK push within timeout period
 */
export const mpesaTimeout = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    console.log('⏱️  M-Pesa timeout callback received');
    console.log('Timeout data:', JSON.stringify(req.body, null, 2));

    // Extract data
    const { CheckoutRequestID } = req.body;

    if (CheckoutRequestID) {
      // Find and mark order as failed
      const order = await Order.findOne({ mpesaCheckoutId: CheckoutRequestID });

      if (order) {
        await order.markPaymentFailed();
        console.log('💾 Order marked as timeout');
      }
    }

    res.status(200).json({
      ResultCode: 0,
      ResultDesc: 'Accepted',
    });
  }
);

/**
 * @route   GET /api/payments/order/:orderId/status
 * @desc    Check order payment status
 * @access  Private
 * 
 * Allows frontend to poll for payment status
 */
export const checkOrderStatus = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { orderId } = req.params;

    const order = await Order.findById(orderId).select(
      'orderNumber status paymentStatus paymentMethod totalAmount'
    );

    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Order not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        totalAmount: order.totalAmount,
        isPaid: order.paymentStatus === 'completed',
      },
    });
  }
);