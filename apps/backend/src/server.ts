// src/server.ts

import express, { Application, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';

// --- CONFIG & UTILITIES ---
import { connectDB } from './config/database'; 
import { AppError } from './middleware/error.middleware'; 

// --- ROUTE IMPORTS (MUST BE AT THE TOP) ---
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import cartRoutes from './routes/cart.routes';
import orderRoutes from './routes/order.routes';

// Load environment variables FIRST
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express
const app: Application = express();

/**
 * MIDDLEWARE
 */

// Security headers
app.use(helmet());

// CORS - Allow frontend requests
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * ROUTES REGISTRATION
 * All route variables are now defined and ready to use
 */

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes); 
app.use('/api/cart', cartRoutes);        
app.use('/api/orders', orderRoutes);     

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Root route
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Infinity API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      products: '/api/products',
      cart: '/api/cart',
      orders: '/api/orders'
    },
  });
});

/**
 * ERROR HANDLING
 */

// 404 Handler - Catches requests to undefined routes
app.use((req: Request, res: Response, next: NextFunction) => {
  // Pass a structured error to the global handler
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// Global error handler - Centralized error processing
// Notice the signature: (err, req, res, next)
app.use((err: AppError, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Error:', err.message);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Server Error';

  res.status(statusCode).json({
    success: false,
    message: message,
    // Only send stack trace in development
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

/**
 * START SERVER
 */
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║                                        ║
  ║   🚀 INFINITY BACKEND SERVER          ║
  ║                                        ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}              ║
  ║   Port: ${PORT}                           ║
  ║   URL: http://localhost:${PORT}         ║
  ║                                        ║
  ║   Registered Routes:                   ║
  ║   /api/auth                            ║
  ║   /api/products                        ║
  ║   /api/cart                            ║
  ║   /api/orders                          ║
  ║                                        ║
  ╚════════════════════════════════════════╝
  `);
});

// Graceful shutdown logic
const shutdown = () => {
  server.close(() => {
    console.log('✅ HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default app;
