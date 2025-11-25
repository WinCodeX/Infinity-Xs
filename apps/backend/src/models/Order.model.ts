// src/models/Order.model.ts

/**
 * Order Model
 * 
 * Represents completed purchases
 * Orders are created when payment is confirmed
 */

import mongoose, { Schema, Model } from 'mongoose';
import { IOrder, OrderStatus, PaymentMethod, ICartItem } from '../types';

/**
 * Order Schema Definition
 */
const OrderSchema = new Schema<IOrder>(
  {
    // Unique order identifier
    // Format: INF-2024-00001
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
    // We store items directly instead of referencing cart
    // because cart contents can change after order is placed
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
    status: {
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
OrderSchema.index({ status: 1 });

// Index for payment status
OrderSchema.index({ paymentStatus: 1 });

// Index for transaction ID lookup
OrderSchema.index({ transactionId: 1 });

/**
 * Pre-save Middleware: Generate Order Number
 * 
 * Automatically generates a unique order number
 * Only runs when creating a new order (not on updates)
 */
OrderSchema.pre('save', async function (next) {
  // Only generate order number for new documents
  if (!this.isNew) {
    return next();
  }

  try {
    // Get current year
    const year = new Date().getFullYear();

    // Find the last order created this year
    const lastOrder = await mongoose.model('Order').findOne({
      orderNumber: new RegExp(`^INF-${year}-`),
    })
    .sort({ createdAt: -1 })
    .limit(1);

    let orderCount = 1;

    if (lastOrder) {
      // Extract the count from last order number
      // Example: "INF-2024-00042" -> 42
      const lastNumber = parseInt(lastOrder.orderNumber.split('-')[2]);
      orderCount = lastNumber + 1;
    }

    // Generate new order number with padding
    // Example: "INF-2024-00001"
    this.orderNumber = `INF-${year}-${orderCount.toString().padStart(5, '0')}`;

    next();
  } catch (error) {
    next(error as Error);
  }
});

/**
 * Instance Method: Update Status
 * 
 * Updates order status and sets deliveredAt date when delivered
 * 
 * @param newStatus - The new status to set
 */
OrderSchema.methods.updateStatus = async function (
  this: IOrder,
  newStatus: OrderStatus
): Promise<void> {
  this.status = newStatus;

  // If status is delivered, record the delivery date
  if (newStatus === OrderStatus.DELIVERED) {
    this.deliveredAt = new Date();
  }

  await this.save();
};

/**
 * Instance Method: Mark as Paid
 * 
 * Updates payment status to completed
 * 
 * @param transactionId - Payment transaction ID
 */
OrderSchema.methods.markAsPaid = async function (
  this: IOrder,
  transactionId: string
): Promise<void> {
  this.paymentStatus = 'completed';
  this.transactionId = transactionId;
  this.status = OrderStatus.PAID;
  await this.save();
};

/**
 * Instance Method: Cancel Order
 * 
 * Cancels the order and restores product stock
 */
OrderSchema.methods.cancelOrder = async function (this: IOrder): Promise<void> {
  // Only allow cancellation for certain statuses
  const cancellableStatuses = [
    OrderStatus.PENDING,
    OrderStatus.PAID,
    OrderStatus.PROCESSING,
  ];

  if (!cancellableStatuses.includes(this.status)) {
    throw new Error('Order cannot be cancelled at this stage');
  }

  // Restore stock for each item
  const Product = mongoose.model('Product');
  
  for (const item of this.items) {
    const product = await Product.findById(item.product);
    if (product && product.stock !== -1) {
      // Only restore stock for physical products
      product.stock += item.quantity;
      await product.save();
    }
  }

  // Update order status
  this.status = OrderStatus.CANCELLED;
  await this.save();
};

/**
 * Static Method: Get User Orders
 * 
 * Retrieves all orders for a specific user
 * 
 * @param userId - ID of the user
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
 * Static Method: Get Orders by Status
 * 
 * Retrieves orders filtered by status (for staff/admin)
 * 
 * @param status - Order status to filter by
 * @param page - Page number
 * @param limit - Items per page
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
 * Static Method: Get Order Statistics
 * 
 * Returns statistics for admin dashboard
 * 
 * @returns Order statistics object
 */
OrderSchema.statics.getOrderStats = async function () {
  const totalOrders = await this.countDocuments();
  const pendingOrders = await this.countDocuments({ status: OrderStatus.PENDING });
  const completedOrders = await this.countDocuments({ status: OrderStatus.DELIVERED });
  
  // Calculate total revenue from completed orders
  const revenueResult = await this.aggregate([
    { $match: { status: OrderStatus.DELIVERED } },
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