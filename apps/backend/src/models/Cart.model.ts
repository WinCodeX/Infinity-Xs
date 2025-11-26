// src/models/Cart.model.ts

/**
 * Cart Model
 * 
 * Manages shopping cart functionality
 * Each user has one cart that persists across sessions
 */

import mongoose, { Schema, Model } from 'mongoose';
import { ICart, ICartItem } from '../types';

/**
 * Cart Item Sub-Schema
 * 
 * Defines structure of individual items in the cart
 * This is embedded within the Cart schema
 */
const CartItemSchema = new Schema<ICartItem>(
  {
    // Reference to the product
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product', // Links to Product model
      required: true,
    },

    // Quantity of this item
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },

    // Selected size (for clothing)
    size: {
      type: String,
    },

    // Selected color (for clothing)
    color: {
      type: String,
    },

    // Price at time of adding to cart
    // Important: Store price to handle price changes
    // If product price changes later, cart price remains consistent
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative'],
    },
  },
  {
    _id: false, // Don't create _id for sub-documents
  }
);

/**
 * Cart Schema Definition
 */
const CartSchema = new Schema<ICart>(
  {
    // Reference to the user who owns this cart
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // Each user can have only one cart
    },

    // Array of cart items
    items: {
      type: [CartItemSchema],
      default: [],
    },

    // Total amount calculated from all items
    totalAmount: {
      type: Number,
      default: 0,
      min: [0, 'Total amount cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Index for quick cart lookup by user
 */
CartSchema.index({ user: 1 });

/**
 * Pre-save Middleware: Calculate Total Amount
 * 
 * Automatically recalculates totalAmount before saving
 * This ensures totalAmount always matches the sum of items
 */
CartSchema.pre('save', function (next) {
  // Calculate total by summing (price * quantity) for each item
  this.totalAmount = this.items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);
});

/**
 * Instance Method: Add Item to Cart
 * 
 * Adds a product to the cart or increases quantity if already exists
 * 
 * @param productId - ID of the product to add
 * @param quantity - Amount to add
 * @param price - Current price of the product
 * @param size - Selected size (optional)
 * @param color - Selected color (optional)
 */
CartSchema.methods.addItem = async function (
  this: ICart,
  productId: string,
  quantity: number,
  price: number,
  size?: string,
  color?: string
): Promise<void> {
  // Check if item already exists in cart
  // For clothing, must match product, size, AND color
  const existingItemIndex = this.items.findIndex((item) => {
    const isSameProduct = item.product.toString() === productId;
    const isSameSize = size ? item.size === size : !item.size;
    const isSameColor = color ? item.color === color : !item.color;
    return isSameProduct && isSameSize && isSameColor;
  });

  if (existingItemIndex > -1) {
    // Item exists - increase quantity
    this.items[existingItemIndex].quantity += quantity;
  } else {
    // Item doesn't exist - add new item
    this.items.push({
      product: productId as any, // Cast to avoid TypeScript error
      quantity,
      price,
      size,
      color,
    });
  }

  // Save will trigger pre-save middleware to recalculate total
  await this.save();
};

/**
 * Instance Method: Remove Item from Cart
 * 
 * Removes an item completely from the cart
 * 
 * @param productId - ID of the product to remove
 * @param size - Size of the item (for clothing)
 * @param color - Color of the item (for clothing)
 */
CartSchema.methods.removeItem = async function (
  this: ICart,
  productId: string,
  size?: string,
  color?: string
): Promise<void> {
  // Filter out the matching item
  this.items = this.items.filter((item) => {
    const isSameProduct = item.product.toString() === productId;
    const isSameSize = size ? item.size === size : !item.size;
    const isSameColor = color ? item.color === color : !item.color;
    
    // Keep item if it doesn't match (inverse logic)
    return !(isSameProduct && isSameSize && isSameColor);
  });

  await this.save();
};

/**
 * Instance Method: Update Item Quantity
 * 
 * Changes the quantity of a specific item
 * 
 * @param productId - ID of the product
 * @param quantity - New quantity
 * @param size - Size (for clothing)
 * @param color - Color (for clothing)
 */
CartSchema.methods.updateQuantity = async function (
  this: ICart,
  productId: string,
  quantity: number,
  size?: string,
  color?: string
): Promise<boolean> {
  // Find the item
  const item = this.items.find((item) => {
    const isSameProduct = item.product.toString() === productId;
    const isSameSize = size ? item.size === size : !item.size;
    const isSameColor = color ? item.color === color : !item.color;
    return isSameProduct && isSameSize && isSameColor;
  });

  if (!item) {
    return false; // Item not found
  }

  if (quantity <= 0) {
    // If quantity is 0 or negative, remove the item
    await this.removeItem(productId, size, color);
  } else {
    // Update quantity
    item.quantity = quantity;
    await this.save();
  }

  return true;
};

/**
 * Instance Method: Clear Cart
 * 
 * Removes all items from cart (used after order is placed)
 */
CartSchema.methods.clearCart = async function (this: ICart): Promise<void> {
  this.items = [];
  this.totalAmount = 0;
  await this.save();
};

/**
 * Instance Method: Get Item Count
 * 
 * Returns total number of individual items in cart
 */
CartSchema.methods.getItemCount = function (this: ICart): number {
  return this.items.reduce((total, item) => total + item.quantity, 0);
};

/**
 * Static Method: Get or Create Cart
 * 
 * Retrieves user's cart or creates a new one if it doesn't exist
 * 
 * @param userId - ID of the user
 * @returns User's cart
 */
CartSchema.statics.getOrCreateCart = async function (
  userId: string
): Promise<ICart> {
  // Try to find existing cart
  let cart = await this.findOne({ user: userId }).populate({
    path: 'items.product', // Populate product details for each item
    select: 'name price images isActive stock', // Only get needed fields
  });

  // If cart doesn't exist, create new one
  if (!cart) {
    cart = await this.create({ user: userId, items: [] });
  }

  return cart;
};

/**
 * Create and export the Cart model
 */
const Cart: Model<ICart> = mongoose.model<ICart>('Cart', CartSchema);

export default Cart;