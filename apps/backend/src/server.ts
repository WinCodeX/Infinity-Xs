// src/server.ts

/**
 * Infinity Backend Server
 * 
 * Main entry point for the application.
 * Sets up Express server with middleware, routes, and error handling.
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';

// Load environment variables FIRST
dotenv.config();

// Config imports
import { connectDB, disconnectDB } from './config/database';

// Middleware imports
import { notFound, errorHandler } from './middleware/error.middleware';

// Route imports
import authRoutes from './modules/auth/auth.route';
import cartRoutes from './modules/cart/cart.routes';
import mpesaRoutes from './modules/mpesa/mpesa.routes';
import productRoutes from './modules/product/product.routes';
import orderRoutes from './modules/order/order.routes';

/**
 * Initialize Express Application
 */
const app: Application = express();

/**
 * MIDDLEWARE SETUP
 * Order matters! Middleware runs in registration order.
 */

// 1. Security Headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
  crossOriginEmbedderPolicy: false,
}));

// 2. CORS Configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// 3. Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. Request Logging (Development Only)
if (process.env.NODE_ENV === 'development') {
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

/**
 * ROUTES
 */

// Health Check
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    // Verify database connection with a simple query
    await require('./config/database').prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      success: true,
      message: 'Infinity Backend is running!',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: 'Connected',
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Service Unavailable',
      database: 'Disconnected',
    });
  }
});

// Root Route
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
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

/**
 * ERROR HANDLING
 * Must come AFTER all routes
 */

// 404 Handler
app.use(notFound);

// Global Error Handler
app.use(errorHandler);

/**
 * START SERVER
 */
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

let server: ReturnType<typeof app.listen>;

// Async function to start server (ensures DB connects first)
const startServer = async () => {
  try {
    // 1. Connect to database FIRST
    await connectDB();
    
    // 2. Then start HTTP server
    server = app.listen(PORT, () => {
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
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

/**
 * GRACEFUL SHUTDOWN
 */
const gracefulShutdown = async (signal: string) => {
  console.log(`\n⚠️  ${signal} received. Starting graceful shutdown...`);

  // 1. Close HTTP server (stop accepting new requests)
  if (server) {
    server.close((err) => {
      if (err) {
        console.error('❌ Error during HTTP server shutdown:', err);
        process.exit(1);
      }
      console.log('✅ HTTP server closed');
    });
  }

  // 2. Close database connection
  try {
    await disconnectDB();
  } catch (dbError) {
    console.error('❌ Error closing database:', dbError);
  }

  // 3. Exit process
  process.exit(0);
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
process.on('unhandledRejection', (reason: any) => {
  console.error('💥 UNHANDLED REJECTION! Shutting down...');
  console.error('Reason:', reason);
  
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Export for testing
export default app;