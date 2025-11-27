// src/models/Order.model.ts

/**
 * Order Model - UPDATED for M-Pesa Integration
 * 
 * Tracks customer orders from creation through delivery
 * Includes M-Pesa payment tracking fields
 */

import mongoose, { Schema, Model } from 'mongoose';
import { IOrder, OrderStatus, PaymentMethod, ICartItem } from '../types';

/**
 * Order Schema Definition
 */
const OrderSchema = new Schema<IOrder>(
  {
    // Unique order identifier (auto-generated)
    orderNumber: {
      type: String,
      unique: true,
    },

    // Customer reference
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Snapshot of items at time of purchase
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
          return v.length > 0;
        },
        message: 'Order must contain at least one item',
      },
    },

    // Total amount
    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Total amount cannot be negative'],
    },

    // Order status
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
    },

    // Payment method
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true,
    },

    // Payment status (separate from order status)
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },

    // Transaction ID (M-Pesa CheckoutRequestID or payment gateway ID)
    transactionId: {
      type: String,
    },

    // M-Pesa specific fields
    mpesaCheckoutId: {
      type: String,
    },

    mpesaReceiptNumber: {
      type: String,
    },

    // Shipping address
    shippingAddress: {
      name: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      street: {
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
      zipCode: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        default: 'Kenya',
      },
    },

    // Customer notes
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },

    // Shipping tracking
    trackingNumber: {
      type: String,
    },

    // Delivery date
    deliveredAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Indexes for Performance
 */
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ transactionId: 1 });
OrderSchema.index({ mpesaCheckoutId: 1 });

/**
 * Pre-save Middleware: Generate Order Number
 */
OrderSchema.pre('save', async function () {
  // If we are updating an existing document, do nothing.
  if (!this.isNew) {
    return;
  }

  try {
    const year = new Date().getFullYear();

    // Find the last order from the current year
    const lastOrder = await mongoose
      .model('Order')
      .findOne({
        // Use RegExp to find orders starting with 'INF-YYYY-'
        orderNumber: new RegExp(`^INF-${year}-`),
      })
      .sort({ createdAt: -1 })
      .limit(1);

    let orderCount = 1;

    if (lastOrder) {
      // Extract the sequential number (the 3rd part after splitting by '-')
      const lastNumber = parseInt(lastOrder.orderNumber.split('-')[2]);
      // Increment it for the new order
      orderCount = lastNumber + 1;
    }

    // Set the new order number: INF-YYYY-NNNNN (padded to 5 digits)
    this.orderNumber = `INF-${year}-${orderCount.toString().padStart(5, '0')}`;

    // No need to call 'next()' explicitly in an async pre-hook on success.
    // The hook resolves implicitly when the function completes.
  } catch (error) {
    // If an error occurs, throw it. Mongoose will catch the thrown error
    // and prevent the save operation from completing.
    throw new Error(`Failed to generate order number: ${error.message}`);
  }
});
/**
 * Instance Method: Update Status
 */
OrderSchema.methods.updateStatus = async function (
  this: IOrder,
  newStatus: OrderStatus
): Promise<void> {
  this.status = newStatus;

  if (newStatus === OrderStatus.DELIVERED) {
    this.deliveredAt = new Date();
  }

  await this.save();
};

/**
 * Instance Method: Mark as Paid
 * 
 * Called when M-Pesa callback confirms payment
 */
OrderSchema.methods.markAsPaid = async function (
  this: IOrder,
  transactionId: string,
  receiptNumber?: string
): Promise<void> {
  this.paymentStatus = 'completed';
  this.transactionId = transactionId;
  
  if (receiptNumber) {
    this.mpesaReceiptNumber = receiptNumber;
  }

  // Update order status to paid
  this.status = OrderStatus.PAID;

  await this.save();
};

/**
 * Instance Method: Mark Payment as Failed
 */
OrderSchema.methods.markPaymentFailed = async function (
  this: IOrder
): Promise<void> {
  this.paymentStatus = 'failed';
  // Keep status as PENDING so user can retry
  await this.save();
};

/**
 * Instance Method: Cancel Order
 */
OrderSchema.methods.cancelOrder = async function (this: IOrder): Promise<void> {
  const cancellableStatuses = [
    OrderStatus.PENDING,
    OrderStatus.PAID,
    OrderStatus.PROCESSING,
  ];

  if (!cancellableStatuses.includes(this.status)) {
    throw new Error('Order cannot be cancelled at this stage');
  }

  // Restore stock
  const Product = mongoose.model('Product');

  for (const item of this.items) {
    const product = await Product.findById(item.product);
    if (product && product.stock !== -1) {
      product.stock += item.quantity;
      await product.save();
    }
  }

  this.status = OrderStatus.CANCELLED;
  await this.save();
};

/**
 * Static Method: Get User Orders
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
    .sort({ createdAt: -1 })
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
 * Static Method: Get Orders by Status
 */
OrderSchema.statics.getOrdersByStatus = async function (
  status: OrderStatus,
  page: number = 1,
  limit: number = 20
) {
  const skip = (page - 1) * limit;

  const orders = await this.find({ status })
    .populate('user', 'name email phone')
    .populate({
      path: 'items.product',
      select: 'name images price',
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await this.countDocuments({ status });

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
 * Static Method: Find Order by M-Pesa Checkout ID
 * 
 * Used in callback handler to match payment to order
 */
OrderSchema.statics.findByMpesaCheckoutId = async function (
  checkoutId: string
): Promise<IOrder | null> {
  return this.findOne({ mpesaCheckoutId: checkoutId });
};

/**
 * Static Method: Get Order Statistics
 */
OrderSchema.statics.getOrderStats = async function () {
  const totalOrders = await this.countDocuments();
  const pendingOrders = await this.countDocuments({
    status: OrderStatus.PENDING,
  });
  const completedOrders = await this.countDocuments({
    status: OrderStatus.DELIVERED,
  });

  const revenueResult = await this.aggregate([
    { $match: { status: OrderStatus.DELIVERED, paymentStatus: 'completed' } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } },
  ]);

  const totalRevenue = revenueResult[0]?.total || 0;

  return {
    totalOrders,
    pendingOrders,
    completedOrders,
    totalRevenue,
  };
};

/**
 * Create and export the Order model
 */
const Order: Model<IOrder> = mongoose.model<IOrder>('Order', OrderSchema);

export default Order;