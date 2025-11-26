// src/models/Order.model.ts

/**
 * Order Model
 * * Represents completed purchases
 * Orders are created when payment is confirmed or initiated
 */

import mongoose, { Schema, Model } from 'mongoose';
import { NextFunction } from 'express';
import { IOrder, OrderStatus, PaymentMethod, ICartItem } from '../types';

/**
 * Order Schema Definition
 */
const OrderSchema = new Schema<IOrder>(
  {
    // Unique order identifier
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },

    // Reference to the customer
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Items purchased (snapshot from cart at time of order)
    items: {
      type: [
        {
          product: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
          },
          quantity: {
            type: Number,
            required: true,
            min: 1,
          },
          size: String,
          color: String,
          price: {
            type: Number,
            required: true,
            min: 0,
          },
        },
      ],
      required: true,
      validate: {
        validator: function (v: ICartItem[]) {
          return v.length > 0; // Must have at least one item
        },
        message: 'Order must contain at least one item',
      },
    },

    // Total amount paid
    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Total amount cannot be negative'],
    },

    // Order status tracking
    orderStatus: { // Renamed from 'status' to 'orderStatus' for consistency with types
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
    },

    // Payment method used
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true,
    },

    // Payment confirmation status
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },

    // Transaction ID from payment provider (M-Pesa, Stripe, etc.)
    transactionId: {
      type: String,
    },
    
    // --- M-Pesa Specific Fields ---
    mpesaCheckoutId: {
      type: String, // Stores the CheckoutRequestID for callback tracking
      unique: true,
      sparse: true, // Allow multiple documents with null/missing value
    },
    
    paidAt: {
        type: Date, // Timestamp for successful payment confirmation
    },

    paymentResult: {
        type: Schema.Types.Mixed, // Store the full payment response for debugging/audit
    },
    // -----------------------------


    // Shipping/delivery address
    shippingAddress: {
      name: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      street: { // Was 'address' in request, mapped to 'street' here
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      zipCode: { // Was 'postalCode' in request, mapped to 'zipCode' here
        type: String,
        required: true,
      },
      country: {
        type: String,
        default: 'Kenya',
      },
    },

    // Customer notes/instructions
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },

    // Shipping tracking number
    trackingNumber: {
      type: String,
    },

    // Delivery completion date
    deliveredAt: {
      type: Date,
    },
  },
  {
    timestamps: true, // createdAt = order date, updatedAt = last modification
  }
);

/**
 * Indexes for Performance
 */

// Index for user orders lookup
OrderSchema.index({ user: 1, createdAt: -1 });

// Index for order number lookup
OrderSchema.index({ orderNumber: 1 });

// Index for status filtering
OrderSchema.index({ orderStatus: 1 });

// Index for payment status
OrderSchema.index({ paymentStatus: 1 });

// Index for transaction ID lookup
OrderSchema.index({ transactionId: 1 });

// Index for M-Pesa tracking
OrderSchema.index({ mpesaCheckoutId: 1 });


/**
 * Pre-save Middleware: Generate Order Number (SIMPLIFIED)
 * * Automatically generates a unique, simple order number.
 * Only runs if the orderNumber is 'TEMP' (set by controller) or missing.
 */
OrderSchema.pre<IOrder>('save', async function (next: NextFunction) {
  try {
    // Generate order number if not already set or if it's the temporary placeholder
    if (this.orderNumber === 'TEMP' || !this.orderNumber) {
      // Use the last 6 digits of the timestamp
      const timestamp = Date.now().toString().slice(-6);
      // Generate a random number between 0 and 999
      const random = Math.floor(Math.random() * 1000);
      
      // Format: ORD-######-###
      this.orderNumber = `ORD-${timestamp}-${random.toString().padStart(3, '0')}`;
    }
    next();
  } catch (error) {
    next(error as Error);
  }
});


/**
 * Static Method: Get User Orders
 * * Retrieves all orders for a specific user
 * * @param userId - ID of the user
 * @param page - Page number for pagination
 * @param limit - Number of orders per page
 * @returns Paginated orders
 */
OrderSchema.statics.getUserOrders = async function (
  userId: string,
  page: number = 1,
  limit: number = 10
) {
  const skip = (page - 1) * limit;

  const orders = await this.find({ user: userId })
    .populate({
      path: 'items.product',
      select: 'name images price',
    })
    .sort({ createdAt: -1 }) // Newest first
    .skip(skip)
    .limit(limit);

  const total = await this.countDocuments({ user: userId });

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Create and export the Order model
 */
const Order: Model<IOrder> = mongoose.model<IOrder>('Order', OrderSchema);

export default Order;