// src/server.ts

/**
 * Server Entry Point - SIMPLIFIED WORKING VERSION
 * 
 * This version only includes what we have so far
 * We'll add more routes as we build them
 */

import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import { connectDB } from './config/database';

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
 * ROUTES
 */

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
    },
  });
});

// Import auth routes
import authRoutes from './routes/auth.routes';
app.use('/api/auth', authRoutes);

/**
 * ERROR HANDLING
 */

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('❌ Error:', err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

/**
 * START SERVER
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
  ║   Routes:                              ║
  ║   GET  /                               ║
  ║   GET  /api/health                     ║
  ║   POST /api/auth/register              ║
  ║   POST /api/auth/login                 ║
  ║   GET  /api/auth/me                    ║
  ║                                        ║
  ╚════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM signal received: closing server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT signal received: closing server');
  process.exit(0);
});

export default app;