# 🚀 Infinity Backend Documentation

> **A comprehensive Node.js + TypeScript + MongoDB backend for e-commerce and service management**

This documentation is designed for developers at any level, with detailed explanations of every concept.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Prerequisites](#prerequisites)
3. [Project Structure](#project-structure)
4. [Initial Setup](#initial-setup)
5. [Understanding the Architecture](#understanding-the-architecture)
6. [Code Files](#code-files)
7. [API Endpoints](#api-endpoints)
8. [Testing](#testing)
9. [Deployment](#deployment)

---

## 🎯 Project Overview

**Infinity** is a full-stack application with three main components:

### What We're Building

1. **Web App (Browser)**: 
   - Showcase Infinity's services (website creation, fullstack development, M-Pesa integration)
   - E-commerce platform for selling clothes ("Clads")
   - Shopping cart and checkout functionality
   - Google OAuth and manual authentication

2. **Mobile App (Staff & Admins)**:
   - Upload product images
   - Track orders and manage inventory
   - Add/remove stock
   - Monitor web services (admin only)

3. **Backend (This Repository)**:
   - REST API built with Node.js and Express
   - MongoDB database for data storage
   - JWT authentication with Google OAuth
   - Cloudflare R2 for image storage
   - M-Pesa payment integration (Daraja API)

### Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript (JavaScript with types)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + Passport (Google OAuth)
- **File Storage**: Cloudflare R2 (S3-compatible)
- **Payments**: M-Pesa Daraja API
- **Package Manager**: pnpm

---

## 📚 Prerequisites

### Required Knowledge

Before starting, you should understand:

- **JavaScript basics**: variables, functions, objects, arrays
- **Promises & async/await**: handling asynchronous operations
- **HTTP/REST**: GET, POST, PUT, DELETE requests
- **JSON**: data format used for API communication

### Required Software

Install these tools:

1. **Node.js** (v18 or higher)
   ```bash
   # Check if installed
   node --version
   ```
   Download from: https://nodejs.org

2. **pnpm** (Package manager)
   ```bash
   npm install -g pnpm
   ```

3. **MongoDB**
   - **Option A**: Local installation from https://www.mongodb.com/try/download/community
   - **Option B**: Cloud database from https://www.mongodb.com/cloud/atlas (recommended)

4. **Git**
   ```bash
   git --version
   ```

5. **Code Editor**: VS Code (recommended)

### Accounts Needed

1. **Cloudflare Account** (for R2 storage)
   - Sign up at https://cloudflare.com
   - Create an R2 bucket

2. **Safaricom Daraja Account** (for M-Pesa)
   - Register at https://developer.safaricom.co.ke
   - Get sandbox credentials

3. **Google Cloud Console** (for OAuth)
   - Create project at https://console.cloud.google.com
   - Set up OAuth credentials

---

## 📁 Project Structure

```
apps/backend/
├── src/
│   ├── config/              # Configuration files
│   │   ├── database.ts      # MongoDB connection
│   │   └── r2Storage.ts     # Cloudflare R2 setup
│   │
│   ├── models/              # Database schemas (data structure)
│   │   ├── User.model.ts    # User accounts
│   │   ├── Product.model.ts # Products (clothes/services)
│   │   ├── Cart.model.ts    # Shopping carts
│   │   └── Order.model.ts   # Purchase orders
│   │
│   ├── controllers/         # Business logic (what happens)
│   │   ├── auth.controller.ts
│   │   ├── product.controller.ts
│   │   ├── cart.controller.ts
│   │   └── order.controller.ts
│   │
│   ├── middleware/          # Functions that run before controllers
│   │   ├── auth.middleware.ts    # Check if user is logged in
│   │   ├── validate.middleware.ts # Validate request data
│   │   ├── upload.middleware.ts  # Handle file uploads
│   │   └── error.middleware.ts   # Handle errors
│   │
│   ├── routes/              # API endpoints (URLs)
│   │   ├── auth.routes.ts
│   │   ├── product.routes.ts
│   │   ├── cart.routes.ts
│   │   └── order.routes.ts
│   │
│   ├── services/            # External integrations
│   │   ├── mpesa.service.ts      # M-Pesa payments
│   │   └── email.service.ts      # Send emails
│   │
│   ├── utils/               # Helper functions
│   │   ├── apiResponse.ts
│   │   └── generateToken.ts
│   │
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts
│   │
│   └── server.ts            # Entry point (starts the app)
│
├── .env                     # Environment variables (secrets)
├── .env.example             # Template for .env
├── .gitignore               # Files to ignore in git
├── package.json             # Project metadata & scripts
├── tsconfig.json            # TypeScript configuration
└── README.md                # This file
```

### Understanding the Structure

**Think of it like a restaurant:**

- **Models** = Menu (defines what dishes exist)
- **Controllers** = Kitchen (prepares the food)
- **Routes** = Waiters (take orders from customers)
- **Middleware** = Security/Quality Control (checks before cooking)
- **Services** = Delivery partners (external help)
- **Config** = Restaurant setup (ovens, refrigerators)

---

## 🚀 Initial Setup

### Step 1: Navigate to Backend Folder

```bash
cd apps/backend
```

### Step 2: Install Dependencies

```bash
pnpm install
```

**What this does**: Downloads all required packages listed in `package.json`

### Step 3: Install Additional Dependencies

We need to add packages one by one:

```bash
# Core dependencies
pnpm add express mongoose dotenv cors helmet

# Authentication & Security
pnpm add jsonwebtoken bcryptjs passport passport-google-oauth20

# Validation & File Upload
pnpm add express-validator multer

# AWS SDK for Cloudflare R2 (S3-compatible)
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# HTTP client for M-Pesa API
pnpm add axios

# Development dependencies (types for TypeScript)
pnpm add -D typescript @types/node @types/express @types/jsonwebtoken @types/bcryptjs @types/cors @types/multer @types/passport @types/passport-google-oauth20 ts-node nodemon @types/helmet
```

**Package Explanations:**

| Package | Purpose |
|---------|---------|
| `express` | Web framework for building APIs |
| `mongoose` | MongoDB object modeling (like an ORM) |
| `dotenv` | Load environment variables from `.env` file |
| `cors` | Allow requests from frontend (different domain) |
| `helmet` | Security headers for HTTP requests |
| `jsonwebtoken` | Create and verify JWT tokens for auth |
| `bcryptjs` | Hash passwords securely |
| `express-validator` | Validate incoming request data |
| `multer` | Handle file uploads |
| `@aws-sdk/client-s3` | Interact with Cloudflare R2 storage |
| `axios` | Make HTTP requests to external APIs |
| `typescript` | JavaScript with type checking |
| `ts-node` | Run TypeScript directly |
| `nodemon` | Auto-restart server on code changes |

### Step 4: Create Configuration Files

#### A. TypeScript Configuration (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "types": ["node"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**What this does:**
- Tells TypeScript how to compile `.ts` files to `.js`
- Sets up strict type checking for better code quality
- Configures output directory for compiled files

#### B. Package Scripts (`package.json`)

Add these scripts to your `package.json`:

```json
{
  "name": "@infinity/backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "nodemon src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "lint": "tsc --noEmit"
  }
}
```

**Script explanations:**
- `dev`: Run in development mode with auto-reload
- `build`: Compile TypeScript to JavaScript
- `start`: Run compiled production code
- `lint`: Check for TypeScript errors without compiling

### Step 5: Set Up Environment Variables

Create `.env` file in `apps/backend/`:

```bash
# Copy from example
cp .env.example .env
```

Then edit `.env` with your actual values:

```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/infinity-db

# JWT (generate with: openssl rand -base64 32)
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRE=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Cloudflare R2
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=infinity-storage
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev

# M-Pesa Daraja
MPESA_CONSUMER_KEY=your-consumer-key
MPESA_CONSUMER_SECRET=your-consumer-secret
MPESA_ENVIRONMENT=sandbox
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your-passkey
MPESA_CALLBACK_URL=https://yourdomain.com/api/payments/mpesa/callback

# Frontend
CLIENT_URL=http://localhost:3000
```

**⚠️ IMPORTANT**: Never commit `.env` to Git! It contains secrets.

---

## 🏗️ Understanding the Architecture

### How a Request Flows Through the Backend

```
1. Client (Web/Mobile) sends HTTP request
   ↓
2. Express receives request at Route
   ↓
3. Middleware runs (auth, validation, etc.)
   ↓
4. Controller executes business logic
   ↓
5. Model interacts with MongoDB
   ↓
6. Response sent back to Client
```

### Example: User Login Flow

```
POST /api/auth/login
   ↓
Route: auth.routes.ts
   ↓
Middleware: validateLogin (check email/password format)
   ↓
Controller: auth.controller.ts → login()
   ↓
Model: User.model.ts → comparePassword()
   ↓
Generate JWT token
   ↓
Response: { success: true, token: "...", user: {...} }
```

---

## 📄 Code Files

### 1. Database Configuration

**File**: `src/config/database.ts`

```typescript
// src/config/database.ts

/**
 * Database Configuration
 * 
 * This file handles the connection to MongoDB using Mongoose.
 * Mongoose is an ODM (Object Data Modeling) library that provides
 * a straightforward way to model your application data.
 */

import mongoose from 'mongoose';

/**
 * Connect to MongoDB Database
 * 
 * This function:
 * 1. Takes the MongoDB URI from environment variables
 * 2. Attempts to connect to the database
 * 3. Logs success or error messages
 * 4. Exits the process if connection fails
 */
export const connectDB = async (): Promise<void> => {
  try {
    // Get the MongoDB connection string from .env file
    const mongoURI = process.env.MONGODB_URI;

    // Check if URI exists, if not throw an error
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    // mongoose.connect() establishes connection to MongoDB
    // Returns a promise that resolves when connected
    const conn = await mongoose.connect(mongoURI);

    // Log successful connection with the host name
    // conn.connection.host gives us the MongoDB server address
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Listen for connection errors after initial connection
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    // Listen for disconnection events
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
    });

    // Listen for reconnection events
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

  } catch (error) {
    // Cast error to Error type to access message property
    const err = error as Error;
    
    // Log the error message
    console.error('❌ Error connecting to MongoDB:', err.message);
    
    // Exit the process with failure code
    // 1 indicates that the process failed
    process.exit(1);
  }
};

/**
 * Gracefully disconnect from MongoDB
 * 
 * This function should be called when shutting down the server
 * to ensure all database operations complete before disconnecting
 */
export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  } catch (error) {
    const err = error as Error;
    console.error('❌ Error closing MongoDB connection:', err.message);
  }
};
```

**Key Concepts:**

- **async/await**: Handles asynchronous operations (operations that take time)
- **Promise**: Represents a future value (like "I promise to return data")
- **try-catch**: Handles errors gracefully
- **process.exit(1)**: Stops the entire application with error code

### 2. Cloudflare R2 Storage Configuration

**File**: `src/config/r2Storage.ts`

```typescript
// src/config/r2Storage.ts

/**
 * Cloudflare R2 Storage Configuration
 * 
 * R2 is Cloudflare's S3-compatible object storage.
 * We use AWS SDK v3 to interact with it since R2 is S3-compatible.
 */

import { S3Client } from '@aws-sdk/client-s3';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Initialize S3 Client for Cloudflare R2
 * 
 * Configuration breakdown:
 * - region: R2 uses 'auto' but you can specify your region
 * - endpoint: Your R2 account endpoint (unique to your account)
 * - credentials: Your R2 API token credentials
 */
export const r2Client = new S3Client({
  region: 'auto', // R2 handles region automatically
  endpoint: process.env.R2_ENDPOINT, // Format: https://<account-id>.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '', // Your R2 Access Key ID
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '', // Your R2 Secret Access Key
  },
});

/**
 * Upload a file to R2 Storage
 * 
 * @param file - The file buffer from multer
 * @param filename - The name to save the file as
 * @param folder - Optional folder path (e.g., 'products', 'clads')
 * @returns The public URL of the uploaded file
 */
export const uploadToR2 = async (
  file: Buffer,
  filename: string,
  folder: string = 'uploads'
): Promise<string> => {
  try {
    // Get bucket name from environment variables
    const bucketName = process.env.R2_BUCKET_NAME;

    if (!bucketName) {
      throw new Error('R2_BUCKET_NAME is not defined');
    }

    // Construct the key (path) for the file in R2
    // Example: "clads/tshirt-001.jpg"
    const key = `${folder}/${filename}`;

    // Create the upload command
    // PutObjectCommand is used to upload objects to S3-compatible storage
    const command = new PutObjectCommand({
      Bucket: bucketName, // Your R2 bucket name
      Key: key, // File path in the bucket
      Body: file, // The actual file data
      ContentType: getContentType(filename), // MIME type of the file
    });

    // Execute the upload
    await r2Client.send(command);

    // Construct and return the public URL
    // Format: https://pub-xxxxx.r2.dev/folder/filename
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
    
    return publicUrl;
  } catch (error) {
    const err = error as Error;
    console.error('❌ Error uploading to R2:', err.message);
    throw new Error('Failed to upload file to R2 storage');
  }
};

/**
 * Delete a file from R2 Storage
 * 
 * @param fileUrl - The full URL of the file to delete
 * @returns Boolean indicating success
 */
export const deleteFromR2 = async (fileUrl: string): Promise<boolean> => {
  try {
    const bucketName = process.env.R2_BUCKET_NAME;

    if (!bucketName) {
      throw new Error('R2_BUCKET_NAME is not defined');
    }

    // Extract the key from the full URL
    // Example: "https://pub-xxxxx.r2.dev/clads/tshirt.jpg" -> "clads/tshirt.jpg"
    const publicUrl = process.env.R2_PUBLIC_URL || '';
    const key = fileUrl.replace(`${publicUrl}/`, '');

    // Create the delete command
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    // Execute the delete
    await r2Client.send(command);

    console.log(`✅ File deleted from R2: ${key}`);
    return true;
  } catch (error) {
    const err = error as Error;
    console.error('❌ Error deleting from R2:', err.message);
    return false;
  }
};

/**
 * Generate a presigned URL for temporary access
 * 
 * Useful for:
 * - Giving temporary download links
 * - Allowing direct uploads from frontend
 * 
 * @param key - The file key in R2
 * @param expiresIn - How long the URL is valid (in seconds)
 * @returns Presigned URL
 */
export const getPresignedUrl = async (
  key: string,
  expiresIn: number = 3600 // Default: 1 hour
): Promise<string> => {
  try {
    const bucketName = process.env.R2_BUCKET_NAME;

    if (!bucketName) {
      throw new Error('R2_BUCKET_NAME is not defined');
    }

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    // Generate a presigned URL that expires after the specified time
    const presignedUrl = await getSignedUrl(r2Client, command, { expiresIn });

    return presignedUrl;
  } catch (error) {
    const err = error as Error;
    console.error('❌ Error generating presigned URL:', err.message);
    throw new Error('Failed to generate presigned URL');
  }
};

/**
 * Helper function to determine content type from filename
 * 
 * This ensures proper MIME types are set for uploaded files
 * so browsers can handle them correctly
 */
const getContentType = (filename: string): string => {
  const extension = filename.split('.').pop()?.toLowerCase();

  const mimeTypes: { [key: string]: string } = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
    mp4: 'video/mp4',
    webm: 'video/webm',
  };

  return mimeTypes[extension || ''] || 'application/octet-stream';
};
```

**Key Concepts:**

- **Buffer**: Raw binary data (the actual file content)
- **MIME Type**: Tells browsers what type of file it is (image/jpeg, video/mp4, etc.)
- **Presigned URL**: Temporary link that expires (for security)

### 3. TypeScript Type Definitions

**File**: `src/types/index.ts`

```typescript
// src/types/index.ts

/**
 * TypeScript Type Definitions
 * 
 * This file contains all custom types and interfaces used throughout the backend.
 * Organizing types in one place makes them reusable and maintainable.
 */

import { Request } from 'express';
import { Document } from 'mongoose';

/**
 * User Roles Enum
 * 
 * Defines the three types of users in our system:
 * - CUSTOMER: Regular users who shop
 * - STAFF: Employees who manage inventory and orders
 * - ADMIN: Full access to all features
 */
export enum UserRole {
  CUSTOMER = 'customer',
  STAFF = 'staff',
  ADMIN = 'admin',
}

/**
 * User Interface
 * 
 * Defines the structure of a User document in MongoDB
 * Document is a Mongoose type that includes MongoDB _id and methods
 */
export interface IUser extends Document {
  _id: string;
  email: string;
  password?: string; // Optional because Google OAuth users don't have passwords
  name: string;
  role: UserRole;
  googleId?: string; // For Google OAuth users
  avatar?: string; // Profile picture URL
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods (defined in the model)
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): string;
}

/**
 * Product Category Enum
 * 
 * Categories for items we sell
 */
export enum ProductCategory {
  CLADS = 'clads', // Clothing
  SERVICES = 'services', // Web development, integrations, etc.
  ACCESSORIES = 'accessories', // Future category
}

/**
 * Service Type Enum
 * 
 * Types of services Infinity offers
 */
export enum ServiceType {
  WEBSITE_CREATION = 'website_creation',
  FULLSTACK_DEVELOPMENT = 'fullstack_development',
  MPESA_INTEGRATION = 'mpesa_integration',
  MOBILE_APP = 'mobile_app',
  CUSTOM_SOFTWARE = 'custom_software',
}

/**
 * Product Interface
 * 
 * Represents items for sale (clothes, services, etc.)
 */
export interface IProduct extends Document {
  _id: string;
  name: string;
  description: string;
  category: ProductCategory;
  serviceType?: ServiceType; // Only for service products
  price: number;
  images: string[]; // Array of image URLs from R2
  stock: number; // -1 for unlimited (services)
  sizes?: string[]; // For clothing: ['S', 'M', 'L', 'XL']
  colors?: string[]; // For clothing: ['Red', 'Blue', 'Black']
  isActive: boolean; // Can be disabled without deleting
  featured: boolean; // Show on homepage
  metadata?: {
    material?: string; // For clothes
    duration?: string; // For services (e.g., "2-3 weeks")
    [key: string]: any; // Allow flexible additional data
  };
  createdBy: IUser['_id']; // Staff/Admin who created this
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Cart Item Interface
 * 
 * Represents a single item in a shopping cart
 */
export interface ICartItem {
  product: IProduct['_id'];
  quantity: number;
  size?: string; // For clothing
  color?: string; // For clothing
  price: number; // Store price at time of adding to cart
}

/**
 * Cart Interface
 * 
 * User's shopping cart
 */
export interface ICart extends Document {
  _id: string;
  user: IUser['_id'];
  items: ICartItem[];
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Order Status Enum
 * 
 * Tracks the lifecycle of an order
 */
export enum OrderStatus {
  PENDING = 'pending', // Order created, awaiting payment
  PAID = 'paid', // Payment confirmed
  PROCESSING = 'processing', // Being prepared
  SHIPPED = 'shipped', // On the way
  DELIVERED = 'delivered', // Completed
  CANCELLED = 'cancelled', // Cancelled by user or admin
  REFUNDED = 'refunded', // Payment returned
}

/**
 * Payment Method Enum
 */
export enum PaymentMethod {
  MPESA = 'mpesa',
  CARD = 'card',
  CASH = 'cash',
}

/**
 * Order Interface
 * 
 * Represents a completed purchase
 */
export interface IOrder extends Document {
  _id: string;
  orderNumber: string; // Unique order ID (e.g., "INF-2024-00001")
  user: IUser['_id'];
  items: ICartItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: 'pending' | 'completed' | 'failed';
  transactionId?: string; // M-Pesa transaction ID
  shippingAddress: {
    name: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  notes?: string; // Customer notes
  trackingNumber?: string; // Shipping tracking
  createdAt: Date;
  updatedAt: Date;
  deliveredAt?: Date;
}

/**
 * Extended Express Request Interface
 * 
 * Adds user property to Request for authenticated routes
 * This allows us to access req.user in controllers
 */
export interface AuthRequest extends Request {
  user?: IUser;
  file?: Express.Multer.File; // For file uploads
  files?: Express.Multer.File[]; // For multiple file uploads
}

/**
 * API Response Interface
 * 
 * Standardized response format for all API endpoints
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * JWT Payload Interface
 * 
 * Data stored in JWT tokens
 */
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}
```

**Key Concepts:**

- **Interface**: Contract that defines structure of an object
- **Enum**: Set of named constants (like multiple choice)
- **Type Safety**: TypeScript checks if you're using correct data types
- **Optional Properties**: Properties with `?` can be undefined

---

## 🧪 Testing the Setup

### Test 1: Verify Dependencies

```bash
pnpm list
```

Should show all installed packages.

### Test 2: TypeScript Compilation

```bash
pnpm run lint
```

Should complete without errors.

### Test 3: Database Connection

Create a test file `src/test-db.ts`:

```typescript
import { connectDB } from './config/database';
import dotenv from 'dotenv';

dotenv.config();

connectDB().then(() => {
  console.log('Database test successful!');
  process.exit(0);
});
```

Run it:

```bash
pnpm exec ts-node src/test-db.ts
```

---

## 📝 Next Steps

In the next section, we'll add:

1. ✅ **User Model** - Authentication and user management
2. ✅ **Product Model** - Manage clothes and services
3. ✅ **Cart Model** - Shopping cart functionality
4. ✅ **Order Model** - Purchase orders
5. ⏳ **Controllers** - Business logic
6. ⏳ **Routes** - API endpoints
7. ⏳ **Middleware** - Validation and error handling
8. ⏳ **Services** - M-Pesa integration
9. ⏳ **Server** - Start the application

---

## 🤝 Contributing

When adding new features:

1. Create a new branch
2. Follow existing code style
3. Add detailed comments
4. Test thoroughly
5. Update this README

---

## 📞 Support

If you encounter issues:

1. Check error messages carefully
2. Verify environment variables in `.env`
3. Ensure MongoDB is running
4. Check that all dependencies are installed

---

**Last Updated**: November 25, 2025
**Version**: 1.0.0
**Maintained By**: Infinity Team