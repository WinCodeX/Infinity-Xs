// src/middleware/validate.middleware.ts

/**
 * Validation Middleware
 * 
 * Validates incoming request data using express-validator
 * Runs BEFORE controllers to ensure data is clean and valid
 */

import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

/**
 * Handle Validation Errors
 * 
 * Checks if there are any validation errors
 * If yes, sends 400 response with error details
 * If no, continues to next middleware/controller
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
    return;
  }

  next();
};

/**
 * User Registration Validation
 * 
 * Validates:
 * - Email format
 * - Password length (min 6 chars)
 * - Name is not empty
 */
export const validateRegister = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(), // Convert to lowercase
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 50 })
    .withMessage('Name cannot exceed 50 characters'),
  
  handleValidationErrors,
];

/**
 * User Login Validation
 * 
 * Validates:
 * - Email format
 * - Password is provided
 */
export const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors,
];

/**
 * Product Creation/Update Validation
 */
export const validateProduct = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['clads', 'services', 'accessories'])
    .withMessage('Invalid category'),
  
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('stock')
    .isInt({ min: -1 })
    .withMessage('Stock must be -1 or a positive integer'),
  
  handleValidationErrors,
];

/**
 * Add to Cart Validation
 */
export const validateAddToCart = [
  body('productId')
    .notEmpty()
    .withMessage('Product ID is required')
    .isMongoId()
    .withMessage('Invalid product ID format'),
  
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  
  body('size')
    .optional()
    .trim(),
  
  body('color')
    .optional()
    .trim(),
  
  handleValidationErrors,
];

/**
 * Order Creation Validation
 */
export const validateOrder = [
  body('paymentMethod')
    .notEmpty()
    .withMessage('Payment method is required')
    .isIn(['mpesa', 'card', 'cash'])
    .withMessage('Invalid payment method'),
  
  body('shippingAddress.name')
    .trim()
    .notEmpty()
    .withMessage('Recipient name is required'),
  
  body('shippingAddress.phone')
    .matches(/^[0-9]{10,15}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('shippingAddress.street')
    .trim()
    .notEmpty()
    .withMessage('Street address is required'),
  
  body('shippingAddress.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  
  body('shippingAddress.state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),
  
  body('shippingAddress.zipCode')
    .trim()
    .notEmpty()
    .withMessage('Zip code is required'),
  
  handleValidationErrors,
];

/**
 * MongoDB ID Parameter Validation
 * 
 * Validates route parameters like /api/products/:productId
 */
export const validateMongoId = (paramName: string) => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName} format`),
  
  handleValidationErrors,
];

/**
 * Pagination Query Validation
 * 
 * Validates ?page=1&limit=10 query parameters
 */
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors,
];