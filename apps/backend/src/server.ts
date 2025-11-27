// src/server.ts

/**
 * Infinity Backend Server (Refactored for Prisma and Single-File Modules)
 * * Main entry point for the application
 * Sets up Express server with all middleware and routes
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';

// Load environment variables FIRST (before anything else)
dotenv.config();

// Config imports - IMPORTING PRISMA CONNECTION LOGIC
import { connectDB, disconnectDB } from './config/database'; // Now handles Prisma connect/disconnect

// Middleware imports
import { AppError, notFound, errorHandler } from './middleware/error.middleware';

// Route imports - IMPORTING FROM NEW MODULE STRUCTURE
import authRoutes from './modules/auth/auth.route';
import cartRoutes from './modules/cart/cart.routes';
import mpesaRoutes from './modules/mpesa/mpesa.routes'; 
import productRoutes from './modules/product/product.routes'; // Now using the new path
import orderRoutes from './modules/order/order.routes';     // Now using the new path

/**
 * Initialize Express Application
 */
const app: Application = express();

/**
 * Connect to Database (Prisma Client)
 * This connects the Prisma client to MongoDB.
 * The connection is generally lazy, but connectDB() ensures logging/verification.
 */
connectDB(); // Now runs the Prisma connection check

/**
 * MIDDLEWARE SETUP
 * * Order matters! Middleware runs in the order it's registered
 */

// 1. Security Headers - Must be first
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
  crossOriginEmbedderPolicy: false,
}));

// 2. CORS - Cross-Origin Resource Sharing
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true, // Allow cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// 3. Body Parsers - Parse JSON and URL-encoded data
app.use(express.json({ limit: '10mb' })); // Limit payload size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. Request Logging (simple version)
app.use((req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`${req.method} ${req.path}`);
  }
  next();
});

/**
 * ROUTES
 * * All API endpoints are registered here
 * Base path: /api
 */

// Health Check - Test if server is running
app.get('/api/health', (req: Request, res: Response) => {
  // In a real application, you would check prisma.$queryRaw('SELECT 1') here
  res.status(200).json({
    success: true,
    message: 'Infinity Backend is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: 'Prisma/MongoDB Initialized',
  });
});

// Root Route - API Information
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    name: 'Infinity API',
    version: '1.0.0',
    message: 'Welcome to Infinity Backend API',
    documentation: '/api/docs',
    endpoints: {
      health: 'GET /api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/me',
      },
      cart: {
        view: 'GET /api/cart',
        add: 'POST /api/cart',
        update: 'PUT /api/cart/update',
        remove: 'DELETE /api/cart/:productId',
        checkout: 'POST /api/cart/checkout',
      },
      products: {
        list: 'GET /api/products',
        create: 'POST /api/products',
      },
      orders: {
        view: 'GET /api/orders/:id',
        list: 'GET /api/orders',
      },
      payments: {
        mpesaCallback: 'POST /api/payments/mpesa/callback',
        orderStatus: 'GET /api/payments/order/:orderId/status',
      },
    },
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payments/mpesa', mpesaRoutes);
app.use('/api/products', productRoutes); // Now active
app.use('/api/orders', orderRoutes);     // Now active

/**
 * ERROR HANDLING
 * * These MUST come AFTER all routes
 */

// 404 Handler - Route Not Found
app.use(notFound);

// Global Error Handler - Catches all errors
app.use(errorHandler);

/**
 * START SERVER
 */
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const server = app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║                                        ║
  ║   🚀 INFINITY BACKEND SERVER          ║
  ║                                        ║
  ║   Environment: ${NODE_ENV.padEnd(24)} ║
  ║   Port: ${String(PORT).padEnd(31)} ║
  ║   URL: http://localhost:${PORT}${' '.repeat(18 - String(PORT).length)}║
  ║                                        ║
  ║   📋 Active Routes:                    ║
  ║   ✓ Auth     /api/auth                 ║
  ║   ✓ Cart     /api/cart                 ║
  ║   ✓ M-Pesa   /api/payments/mpesa       ║
  ║   ✓ Products /api/products             ║
  ║   ✓ Orders   /api/orders               ║
  ║                                        ║
  ╚════════════════════════════════════════╝
  `);
  
  console.log('📝 Quick Test:');
  console.log(`   curl http://localhost:${PORT}/api/health`);
  console.log('');
});

/**
 * GRACEFUL SHUTDOWN
 */
const gracefulShutdown = async (signal: string) => {
  console.log(`\n⚠️  ${signal} received. Starting graceful shutdown...`);

  // 1. Close HTTP server
  server.close((err) => {
    if (err) {
      console.error('❌ Error during HTTP server shutdown:', err);
      process.exit(1);
    }
    console.log('✅ HTTP server closed');
  });

  // 2. Close database connection (Prisma)
  try {
    await disconnectDB();
    console.log('✅ Prisma connection closed');
  } catch (dbError) {
    console.error('❌ Error closing Prisma connection:', dbError);
  }

  // 3. Exit process
  process.exit(0);

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('⚠️  Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('💥 UNCAUGHT EXCEPTION! Shutting down...');
  console.error('Error:', error.name, error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('💥 UNHANDLED REJECTION! Shutting down...');
  console.error('Promise:', promise);
  console.error('Reason:', reason);
  
  server.close(() => {
    process.exit(1);
  });
});

// Export for testing
export default app;