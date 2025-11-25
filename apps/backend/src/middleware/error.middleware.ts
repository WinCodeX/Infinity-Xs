// src/middleware/error.middleware.ts

/**
 * Error Handling Middleware
 * 
 * Centralized error handling for the entire application
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Custom Error Class
 * 
 * Extends built-in Error with HTTP status code
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    // Maintains proper stack trace for debugging
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not Found Middleware
 * 
 * Handles requests to non-existent routes
 * Should be placed AFTER all other routes
 */
export const notFound = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

/**
 * Global Error Handler
 * 
 * Catches all errors and sends appropriate response
 * MUST have 4 parameters (err, req, res, next) for Express to recognize it
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging (in production, use proper logging service)
  console.error('❌ Error:', err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new AppError(message, 404);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new AppError(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((val: any) => val.message)
      .join(', ');
    error = new AppError(message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new AppError(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new AppError(message, 401);
  }

  // Send error response
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    // Only show stack trace in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Async Handler Wrapper
 * 
 * Wraps async controller functions to automatically catch errors
 * Eliminates need for try-catch blocks in every controller
 * 
 * Usage:
 * export const getProducts = asyncHandler(async (req, res) => {
 *   // Your async code here
 *   // Any errors will be automatically caught and passed to error handler
 * });
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};