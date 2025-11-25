// src/server.ts

/**
 * Server Entry Point
 * 
 * This is where everything starts!
 * 
 * What happens here:
 * 1. Load environment variables
 * 2. Connect to MongoDB
 * 3. Set up Express app with middleware
 * 4. Define routes
 * 5. Start listening for requests
 */

import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import { connectDB } from './config/database';
import { notFound, errorHandler } from './middleware/error.middleware';

// Load environment variables from .env file
// Must be called BEFORE using process.env
dotenv.config();

// Connect to MongoDB
connectDB();

/**
 * Initialize Express Application
 * 
 * Express is like a waiter that handles requests and responses
 */
const app: Application = express();

/**
 * MIDDLEWARE SETUP
 * 
 * Middleware runs BEFORE your routes
 * Think of it as security checks and data processing before entering a building
 */

// 1. Helmet - Security headers
// Protects against common web vulnerabilities
app.use(helmet());

// 2. CORS - Cross-Origin Resource Sharing
// Allows frontend (different domain) to make requests
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000', // Frontend URL
    credentials: true, // Allow cookies
  })
);

// 3. Body Parsers
// Convert incoming request body to JSON and URL-encoded data
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

/**
 * ROUTES
 * 
 * Routes define the API endpoints
 * We'll add these as we create the route files
 */

// Health check route - Test if server is running
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
  });
});

// Root route
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Infinity API',
    version: '1.0.0',
    documentation: '/api/docs', // We'll add this later
  });
});

// Import route files
import authRoutes from './routes/auth.routes';

// Use routes
app.use('/api/auth', authRoutes);
// app.use('/api/products', productRoutes); // We'll add these next
// app.use('/api/cart', cartRoutes);
// app.use('/api/orders', orderRoutes);

/**
 * ERROR HANDLING
 * 
 * These MUST come after all routes
 */

// 404 Handler - Route not found
app.use(notFound);

// Global error handler - Catches all errors
app.use(errorHandler);

/**
 * START SERVER
 * 
 * Listen for incoming requests on specified port
 */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║                                        ║
  ║   🚀 INFINITY BACKEND SERVER          ║
  ║                                        ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}              ║
  ║   Port: ${PORT}                           ║
  ║   URL: http://localhost:${PORT}         ║
  ║                                        ║
  ╚════════════════════════════════════════╝
  `);
});

/**
 * GRACEFUL SHUTDOWN
 * 
 * Handle server shutdown properly
 * Closes database connections before exiting
 */
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Export app for testing
export default app;