// src/controllers/order.controller.ts

import { Response, Request } from 'express';
import { OrderStatus } from '../types';
import Order from '../models/Order.model';
import Cart from '../models/Cart.model'; // Need Cart to clear it upon successful payment
import { asyncHandler } from '../middleware/error.middleware'; 

// @desc    Receives the final payment status from M-Pesa API (Callback)
// @route   POST /api/orders/callback
// @access  Public (Called by M-Pesa servers, MUST be public)
export const mpesaCallback = asyncHandler(async (req: Request, res: Response) => {
    // NOTE: This endpoint MUST respond with a 200 OK fast, or Safaricom will retry the call.

    // 1. Extract M-Pesa data
    const mpesaBody = req.body;
    
    // Check if the body structure is correct
    if (!mpesaBody || !mpesaBody.Body || !mpesaBody.Body.stkCallback) {
        console.error('Invalid M-Pesa Callback Body Received:', mpesaBody);
        return res.status(200).json({ message: 'Invalid callback data acknowledged.' });
    }

    const callbackData = mpesaBody.Body.stkCallback;
    const resultCode = callbackData.ResultCode;
    const checkoutRequestId = callbackData.CheckoutRequestID;
    
    // 2. Find the pending order using the CheckoutRequestID
    const order = await Order.findOne({ mpesaCheckoutId: checkoutRequestId });

    if (!order) {
        console.error(`M-Pesa Callback: Order not found for Checkout ID: ${checkoutRequestId}`);
        return res.status(200).json({ message: 'Order reference processed (not found, acknowledged).' });
    }

    // 3. Process Result
    if (resultCode === 0) {
        // SUCCESS: Payment was successful
        const transactionMetadata = callbackData.CallbackMetadata.Item;
        const transactionId = transactionMetadata.find((item: any) => item.Name === 'MpesaReceiptNumber')?.Value;
        
        // Update order status and payment details
        order.orderStatus = OrderStatus.PAID;
        order.paymentStatus = 'completed';
        order.transactionId = transactionId;
        order.paidAt = new Date();
        
        // Optionally save full transaction details for audit
        order.paymentResult = { status: 'COMPLETED', message: 'Payment successful', transactionId: transactionId }; 

        // CRITICAL: Clear the user's cart only after payment is successful
        const cart = await Cart.findOne({ user: order.user });
        if (cart) {
            await cart.clearCart();
        }

        await order.save();
        console.log(`✅ M-Pesa Payment Success for Order ${order._id}. Transaction ID: ${transactionId}`);

    } else {
        // FAILURE: Payment failed (user cancelled, insufficient funds, timeout, etc.)
        const failureReason = callbackData.ResultDesc || 'Payment failed/cancelled by user.';
        
        order.orderStatus = OrderStatus.PAYMENT_FAILED;
        order.paymentStatus = 'failed';
        order.paymentResult = { status: 'FAILED', message: failureReason };
        await order.save();
        console.warn(`❌ M-Pesa Payment Failed for Order ${order._id}. Reason: ${failureReason}`);
    }

    // 4. Send Acknowledgment (CRITICAL)
    res.status(200).send('Callback received successfully.');
});