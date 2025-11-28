import { Response } from 'express';
import { AuthRequest, ProductCategory, ServiceType } from '../../types';
import Product from './Product.model';
import { asyncHandler } from '../../middleware/error.middleware';

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Admin/Staff)
export const createProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
  // For testing, we assume image URLs are strings. 
  // Later we integrate Multer+R2 for real file uploads.
  
  const product = await Product.create({
    ...req.body,
    createdBy: req.user?._id
  });

  res.status(201).json({
    success: true,
    data: product
  });
});

// @desc    Get all products
// @route   GET /api/products
// @access  Public
export const getProducts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const products = await Product.find({ isActive: true });
  res.status(200).json({ success: true, count: products.length, data: products });
});
