// src/models/Product.model.ts

/**
 * Product Model
 * 
 * Handles both physical products (clothes) and services (web development)
 * Flexible schema allows for different product types with optional fields
 */

import mongoose, { Schema, Model } from 'mongoose';
import { IProduct, ProductCategory, ServiceType } from '../../types';

/**
 * Product Schema Definition
 */
const ProductSchema = new Schema<IProduct>(
  {
    // Product name
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    // Detailed description
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },

    // Category: clads, services, etc.
    category: {
      type: String,
      enum: Object.values(ProductCategory),
      required: [true, 'Category is required'],
    },

    // Service type - only for service category
    serviceType: {
      type: String,
      enum: Object.values(ServiceType),
      required: function (this: IProduct) {
        // Make required only if category is 'services'
        return this.category === ProductCategory.SERVICES;
      },
    },

    // Price in KES (Kenyan Shillings)
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },

    // Array of image URLs from Cloudflare R2
    images: {
      type: [String],
      required: [true, 'At least one image is required'],
      validate: {
        validator: function (v: string[]) {
          return v.length > 0 && v.length <= 10; // Max 10 images
        },
        message: 'Product must have between 1 and 10 images',
      },
    },

    // Inventory count
    // Use -1 for unlimited (services don't have stock limits)
    stock: {
      type: Number,
      required: [true, 'Stock count is required'],
      default: 0,
      min: [-1, 'Invalid stock value'],
    },

    // Available sizes - for clothing
    sizes: {
      type: [String],
      default: [],
      validate: {
        validator: function (this: IProduct, v: string[]) {
          // Sizes required for clothing, optional for services
          if (this.category === ProductCategory.CLADS) {
            return v.length > 0;
          }
          return true;
        },
        message: 'Sizes are required for clothing items',
      },
    },

    // Available colors - for clothing
    colors: {
      type: [String],
      default: [],
    },

    // Active status - can disable without deleting
    isActive: {
      type: Boolean,
      default: true,
    },

    // Featured status - show on homepage/top of lists
    featured: {
      type: Boolean,
      default: false,
    },

    // Flexible metadata field for additional properties
    metadata: {
      type: Schema.Types.Mixed, // Allows any structure
      default: {},
    },

    // Reference to user who created this product
    // Populated with staff/admin user data when queried
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User', // Reference to User model
      required: true,
    },
  },
  {
    timestamps: true, // Auto-add createdAt and updatedAt
  }
);

/**
 * Indexes for Performance
 * 
 * Indexes speed up queries on specific fields
 * We create indexes on fields we frequently search/filter by
 */

// Index for text search on name and description
ProductSchema.index({ name: 'text', description: 'text' });

// Index for filtering by category
ProductSchema.index({ category: 1 });

// Index for filtering active products
ProductSchema.index({ isActive: 1 });

// Compound index for category + active status + featured
// Useful for queries like "get all active featured clads"
ProductSchema.index({ category: 1, isActive: 1, featured: -1 });

// Index for price range queries
ProductSchema.index({ price: 1 });

/**
 * Virtual Property: Is In Stock
 * 
 * Virtual properties are fields that don't exist in the database
 * but are computed from other fields
 * 
 * This checks if product is available for purchase
 */
ProductSchema.virtual('isInStock').get(function (this: IProduct) {
  // Services (stock: -1) are always in stock
  if (this.stock === -1) {
    return true;
  }
  // Physical products must have stock > 0
  return this.stock != null && this.stock > 0;
});

/**
 * Virtual Property: Discount Price
 * 
 * If metadata has discount percentage, calculate discounted price
 */
ProductSchema.virtual('discountPrice').get(function (this: IProduct) {
  if (this.metadata?.discount) {
    const discountPercent = this.metadata.discount;
    return this.price - (this.price * discountPercent) / 100;
  }
  return this.price;
});

/**
 * Instance Method: Decrease Stock
 * 
 * Reduces stock count when an order is placed
 * Validates that enough stock is available
 * 
 * @param quantity - Amount to decrease stock by
 * @returns Boolean - success status
 */
ProductSchema.methods.decreaseStock = async function (
  this: IProduct,
  quantity: number
): Promise<boolean> {
  // Don't decrease stock for services (unlimited)
  if (this.stock === -1) {
    return true;
  }

  // Check if enough stock is available
  if (this.stock == null || this.stock < quantity) {
    return false;
  }

  // Decrease stock and save
  this.stock -= quantity;
  await this.save();
  return true;
};

/**
 * Instance Method: Increase Stock
 * 
 * Used when restocking or when orders are cancelled
 * 
 * @param quantity - Amount to increase stock by
 */
ProductSchema.methods.increaseStock = async function (
  this: IProduct,
  quantity: number
): Promise<void> {
  // Don't modify stock for services
  if (this.stock === -1) {
    return;
  }

  if (this.stock != null) {
    this.stock += quantity;
    await this.save();
  }
};

/**
 * Static Method: Get Featured Products
 * 
 * Static methods are called on the Model, not instances
 * Retrieves all featured products for homepage display
 * 
 * @param limit - Maximum number of products to return
 * @returns Array of featured products
 */
ProductSchema.statics.getFeaturedProducts = async function (
  limit: number = 10
): Promise<IProduct[]> {
  return this.find({ featured: true, isActive: true })
    .limit(limit)
    .populate('createdBy', 'name email') // Include creator info
    .sort({ createdAt: -1 }); // Newest first
};

/**
 * Pre-save Middleware
 * 
 * Validates business rules before saving
 */
ProductSchema.pre('save', function () {
  // Services should have stock set to -1 (unlimited)
  if (this.category === ProductCategory.SERVICES && this.stock !== -1) {
    this.stock = -1;
  }
  // No need to call next() if not using it
});

/**
 * Configure toJSON to include virtuals
 * 
 * When we convert a document to JSON (res.json(product)),
 * include virtual properties
 */
ProductSchema.set('toJSON', { virtuals: true });
ProductSchema.set('toObject', { virtuals: true });

/**
 * Create and export the Product model
 */
const Product: Model<IProduct> = mongoose.model<IProduct>(
  'Product',
  ProductSchema
);

export default Product;