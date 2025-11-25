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

### 4. User Model

**File**: `src/models/User.model.ts`

```typescript
// src/models/User.model.ts

/**
 * User Model
 * 
 * Defines the User schema for MongoDB and includes methods for:
 * - Password hashing
 * - Password comparison
 * - JWT token generation
 */

import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IUser, UserRole, JWTPayload } from '../types';

/**
 * User Schema Definition
 * 
 * Schema defines the structure of documents in the 'users' collection
 */
const UserSchema = new Schema<IUser>(
  {
    // Email - required and unique
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true, // No two users can have the same email
      lowercase: true, // Always store in lowercase
      trim: true, // Remove whitespace
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },

    // Password - optional for OAuth users
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't include password in queries by default
    },

    // Full name
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },

    // User role - determines permissions
    role: {
      type: String,
      enum: Object.values(UserRole), // Only allow defined roles
      default: UserRole.CUSTOMER,
    },

    // Google OAuth ID
    googleId: {
      type: String,
      unique: true, // Each Google account maps to one user
      sparse: true, // Allow multiple null values (for non-OAuth users)
    },

    // Profile picture URL
    avatar: {
      type: String,
      default: '', // Can store R2 URL or Google profile picture
    },

    // Phone number
    phone: {
      type: String,
      match: [/^[0-9]{10,15}$/, 'Please provide a valid phone number'],
    },

    // Address object
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zipCode: { type: String },
      country: { type: String, default: 'Kenya' },
    },

    // Email verification status
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    // Automatically add createdAt and updatedAt timestamps
    timestamps: true,
  }
);

/**
 * Pre-save Middleware
 * 
 * This runs BEFORE a document is saved to the database
 * We use it to hash passwords before storing them
 * 
 * NOTE: Arrow functions don't work here because we need 'this' context
 */
UserSchema.pre('save', async function (next) {
  // Only hash the password if it's new or modified
  if (!this.isModified('password')) {
    return next();
  }

  // If password exists (not OAuth user)
  if (this.password) {
    try {
      // Generate salt (random data added to password before hashing)
      // 10 is the cost factor - higher = more secure but slower
      const salt = await bcrypt.genSalt(10);

      // Hash the password with the salt
      this.password = await bcrypt.hash(this.password, salt);

      next();
    } catch (error) {
      next(error as Error);
    }
  } else {
    next();
  }
});

/**
 * Instance Method: Compare Password
 * 
 * Checks if provided password matches hashed password in database
 * Used during login
 * 
 * @param candidatePassword - Plain text password from login form
 * @returns Boolean - true if passwords match
 */
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    // If user doesn't have a password (OAuth user), return false
    if (!this.password) {
      return false;
    }

    // bcrypt.compare() hashes candidatePassword and compares with stored hash
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

/**
 * Instance Method: Generate Auth Token
 * 
 * Creates a JWT token for authenticated sessions
 * Token contains user ID, email, and role
 * 
 * @returns JWT token string
 */
UserSchema.methods.generateAuthToken = function (): string {
  // Payload - data embedded in the token
  const payload: JWTPayload = {
    userId: this._id.toString(),
    email: this.email,
    role: this.role,
  };

  // Get JWT secret from environment variables
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  // Sign the token with secret and set expiration
  // jwt.sign() creates the token
  const token = jwt.sign(
    payload,
    secret,
    {
      expiresIn: process.env.JWT_EXPIRE || '7d', // Token valid for 7 days
    }
  );

  return token;
};

/**
 * Create and export the User model
 * 
 * Model is a class with which we construct documents
 * mongoose.model() takes collection name and schema
 */
const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);

export default User;
```

**Key Concepts Explained:**

1. **Schema**: Blueprint for how data is structured in MongoDB
2. **Pre-save Middleware**: Runs automatically before saving to database
3. **Password Hashing**: 
   - Plain password: `"mypassword123"`
   - Salt: Random data added for security
   - Hashed: `"$2a$10$N9qo8uLO..."`
   - Cannot be reversed (one-way function)
4. **Instance Methods**: Functions available on each user document
5. **JWT (JSON Web Token)**: 
   - Encoded string containing user data
   - Used for authentication
   - Format: `header.payload.signature`

**Why Hash Passwords?**
If database is compromised, attackers can't see actual passwords. Even if two users have the same password, hashes will be different due to salt.

---

---

### 5. Product Model

**File**: `src/models/Product.model.ts`

```typescript
// src/models/Product.model.ts

/**
 * Product Model
 * 
 * Handles both physical products (clothes) and services (web development)
 * Flexible schema allows for different product types with optional fields
 */

import mongoose, { Schema, Model } from 'mongoose';
import { IProduct, ProductCategory, ServiceType } from '../types';

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
  return this.stock > 0;
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
  if (this.stock < quantity) {
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

  this.stock += quantity;
  await this.save();
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
ProductSchema.pre('save', function (next) {
  // Services should have stock set to -1 (unlimited)
  if (this.category === ProductCategory.SERVICES && this.stock !== -1) {
    this.stock = -1;
  }

  next();
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
```

**Key Concepts:**

1. **Indexes**: 
   - Like a book's index - helps find data quickly
   - `{ category: 1 }` means ascending order index
   - Without indexes, MongoDB scans every document (slow)

2. **Virtual Properties**: 
   - Calculated fields not stored in database
   - Example: `isInStock` computed from `stock` value
   - Saves database space

3. **Instance vs Static Methods**:
   - Instance: Called on a document → `product.decreaseStock(5)`
   - Static: Called on the Model → `Product.getFeaturedProducts()`

4. **Population**:
   - Replacing references with actual data
   - `createdBy: ObjectId("123")` → `createdBy: { name: "John", email: "..." }`

---

### 6. Cart Model

**File**: `src/models/Cart.model.ts`

```typescript
// src/models/Cart.model.ts

/**
 * Cart Model
 * 
 * Manages shopping cart functionality
 * Each user has one cart that persists across sessions
 */

import mongoose, { Schema, Model } from 'mongoose';
import { ICart, ICartItem } from '../types';

/**
 * Cart Item Sub-Schema
 * 
 * Defines structure of individual items in the cart
 * This is embedded within the Cart schema
 */
const CartItemSchema = new Schema<ICartItem>(
  {
    // Reference to the product
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product', // Links to Product model
      required: true,
    },

    // Quantity of this item
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },

    // Selected size (for clothing)
    size: {
      type: String,
    },

    // Selected color (for clothing)
    color: {
      type: String,
    },

    // Price at time of adding to cart
    // Important: Store price to handle price changes
    // If product price changes later, cart price remains consistent
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative'],
    },
  },
  {
    _id: false, // Don't create _id for sub-documents
  }
);

/**
 * Cart Schema Definition
 */
const CartSchema = new Schema<ICart>(
  {
    // Reference to the user who owns this cart
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // Each user can have only one cart
    },

    // Array of cart items
    items: {
      type: [CartItemSchema],
      default: [],
    },

    // Total amount calculated from all items
    totalAmount: {
      type: Number,
      default: 0,
      min: [0, 'Total amount cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Index for quick cart lookup by user
 */
CartSchema.index({ user: 1 });

/**
 * Pre-save Middleware: Calculate Total Amount
 * 
 * Automatically recalculates totalAmount before saving
 * This ensures totalAmount always matches the sum of items
 */
CartSchema.pre('save', function (next) {
  // Calculate total by summing (price * quantity) for each item
  this.totalAmount = this.items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);

  next();
});

/**
 * Instance Method: Add Item to Cart
 * 
 * Adds a product to the cart or increases quantity if already exists
 * 
 * @param productId - ID of the product to add
 * @param quantity - Amount to add
 * @param price - Current price of the product
 * @param size - Selected size (optional)
 * @param color - Selected color (optional)
 */
CartSchema.methods.addItem = async function (
  this: ICart,
  productId: string,
  quantity: number,
  price: number,
  size?: string,
  color?: string
): Promise<void> {
  // Check if item already exists in cart
  // For clothing, must match product, size, AND color
  const existingItemIndex = this.items.findIndex((item) => {
    const isSameProduct = item.product.toString() === productId;
    const isSameSize = size ? item.size === size : !item.size;
    const isSameColor = color ? item.color === color : !item.color;
    return isSameProduct && isSameSize && isSameColor;
  });

  if (existingItemIndex > -1) {
    // Item exists - increase quantity
    this.items[existingItemIndex].quantity += quantity;
  } else {
    // Item doesn't exist - add new item
    this.items.push({
      product: productId as any, // Cast to avoid TypeScript error
      quantity,
      price,
      size,
      color,
    });
  }

  // Save will trigger pre-save middleware to recalculate total
  await this.save();
};

/**
 * Instance Method: Remove Item from Cart
 * 
 * Removes an item completely from the cart
 * 
 * @param productId - ID of the product to remove
 * @param size - Size of the item (for clothing)
 * @param color - Color of the item (for clothing)
 */
CartSchema.methods.removeItem = async function (
  this: ICart,
  productId: string,
  size?: string,
  color?: string
): Promise<void> {
  // Filter out the matching item
  this.items = this.items.filter((item) => {
    const isSameProduct = item.product.toString() === productId;
    const isSameSize = size ? item.size === size : !item.size;
    const isSameColor = color ? item.color === color : !item.color;
    
    // Keep item if it doesn't match (inverse logic)
    return !(isSameProduct && isSameSize && isSameColor);
  });

  await this.save();
};

/**
 * Instance Method: Update Item Quantity
 * 
 * Changes the quantity of a specific item
 * 
 * @param productId - ID of the product
 * @param quantity - New quantity
 * @param size - Size (for clothing)
 * @param color - Color (for clothing)
 */
CartSchema.methods.updateQuantity = async function (
  this: ICart,
  productId: string,
  quantity: number,
  size?: string,
  color?: string
): Promise<boolean> {
  // Find the item
  const item = this.items.find((item) => {
    const isSameProduct = item.product.toString() === productId;
    const isSameSize = size ? item.size === size : !item.size;
    const isSameColor = color ? item.color === color : !item.color;
    return isSameProduct && isSameSize && isSameColor;
  });

  if (!item) {
    return false; // Item not found
  }

  if (quantity <= 0) {
    // If quantity is 0 or negative, remove the item
    await this.removeItem(productId, size, color);
  } else {
    // Update quantity
    item.quantity = quantity;
    await this.save();
  }

  return true;
};

/**
 * Instance Method: Clear Cart
 * 
 * Removes all items from cart (used after order is placed)
 */
CartSchema.methods.clearCart = async function (this: ICart): Promise<void> {
  this.items = [];
  this.totalAmount = 0;
  await this.save();
};

/**
 * Instance Method: Get Item Count
 * 
 * Returns total number of individual items in cart
 */
CartSchema.methods.getItemCount = function (this: ICart): number {
  return this.items.reduce((total, item) => total + item.quantity, 0);
};

/**
 * Static Method: Get or Create Cart
 * 
 * Retrieves user's cart or creates a new one if it doesn't exist
 * 
 * @param userId - ID of the user
 * @returns User's cart
 */
CartSchema.statics.getOrCreateCart = async function (
  userId: string
): Promise<ICart> {
  // Try to find existing cart
  let cart = await this.findOne({ user: userId }).populate({
    path: 'items.product', // Populate product details for each item
    select: 'name price images isActive stock', // Only get needed fields
  });

  // If cart doesn't exist, create new one
  if (!cart) {
    cart = await this.create({ user: userId, items: [] });
  }

  return cart;
};

/**
 * Create and export the Cart model
 */
const Cart: Model<ICart> = mongoose.model<ICart>('Cart', CartSchema);

export default Cart;
```

**Key Concepts:**

1. **Embedded Documents**: 
   - `CartItemSchema` is embedded inside `CartSchema`
   - Alternative: Separate collection (but slower for small data)

2. **Array Methods**:
   - `findIndex()`: Find position of item in array
   - `filter()`: Remove items that match condition
   - `reduce()`: Sum up values (like Excel SUM function)

3. **Why Store Price in Cart?**
   ```
   User adds item at $10 → Stored in cart
   Next day, price changes to $15
   User's cart still shows $10 (fair pricing)
   ```

---

### 7. Order Model

**File**: `src/models/Order.model.ts`

```typescript
// src/models/Order.model.ts

/**
 * Order Model
 * 
 * Represents completed purchases
 * Orders are created when payment is confirmed
 */

import mongoose, { Schema, Model } from 'mongoose';
import { IOrder, OrderStatus, PaymentMethod, ICartItem } from '../types';

/**
 * Order Schema Definition
 */
const OrderSchema = new Schema<IOrder>(
  {
    // Unique order identifier
    // Format: INF-2024-00001
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },

    // Reference to the customer
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Items purchased (snapshot from cart at time of order)
    // We store items directly instead of referencing cart
    // because cart contents can change after order is placed
    items: {
      type: [
        {
          product: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
          },
          quantity: {
            type: Number,
            required: true,
            min: 1,
          },
          size: String,
          color: String,
          price: {
            type: Number,
            required: true,
            min: 0,
          },
        },
      ],
      required: true,
      validate: {
        validator: function (v: ICartItem[]) {
          return v.length > 0; // Must have at least one item
        },
        message: 'Order must contain at least one item',
      },
    },

    // Total amount paid
    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Total amount cannot be negative'],
    },

    // Order status tracking
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
    },

    // Payment method used
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true,
    },

    // Payment confirmation status
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },

    // Transaction ID from payment provider (M-Pesa, Stripe, etc.)
    transactionId: {
      type: String,
    },

    // Shipping/delivery address
    shippingAddress: {
      name: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      street: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      zipCode: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        default: 'Kenya',
      },
    },

    // Customer notes/instructions
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },

    // Shipping tracking number
    trackingNumber: {
      type: String,
    },

    // Delivery completion date
    deliveredAt: {
      type: Date,
    },
  },
  {
    timestamps: true, // createdAt = order date, updatedAt = last modification
  }
);

/**
 * Indexes for Performance
 */

// Index for user orders lookup
OrderSchema.index({ user: 1, createdAt: -1 });

// Index for order number lookup
OrderSchema.index({ orderNumber: 1 });

// Index for status filtering
OrderSchema.index({ status: 1 });

// Index for payment status
OrderSchema.index({ paymentStatus: 1 });

// Index for transaction ID lookup
OrderSchema.index({ transactionId: 1 });

/**
 * Pre-save Middleware: Generate Order Number
 * 
 * Automatically generates a unique order number
 * Only runs when creating a new order (not on updates)
 */
OrderSchema.pre('save', async function (next) {
  // Only generate order number for new documents
  if (!this.isNew) {
    return next();
  }

  try {
    // Get current year
    const year = new Date().getFullYear();

    // Find the last order created this year
    const lastOrder = await mongoose.model('Order').findOne({
      orderNumber: new RegExp(`^INF-${year}-`),
    })
    .sort({ createdAt: -1 })
    .limit(1);

    let orderCount = 1;

    if (lastOrder) {
      // Extract the count from last order number
      // Example: "INF-2024-00042" -> 42
      const lastNumber = parseInt(lastOrder.orderNumber.split('-')[2]);
      orderCount = lastNumber + 1;
    }

    // Generate new order number with padding
    // Example: "INF-2024-00001"
    this.orderNumber = `INF-${year}-${orderCount.toString().padStart(5, '0')}`;

    next();
  } catch (error) {
    next(error as Error);
  }
});

/**
 * Instance Method: Update Status
 * 
 * Updates order status and sets deliveredAt date when delivered
 * 
 * @param newStatus - The new status to set
 */
OrderSchema.methods.updateStatus = async function (
  this: IOrder,
  newStatus: OrderStatus
): Promise<void> {
  this.status = newStatus;

  // If status is delivered, record the delivery date
  if (newStatus === OrderStatus.DELIVERED) {
    this.deliveredAt = new Date();
  }

  await this.save();
};

/**
 * Instance Method: Mark as Paid
 * 
 * Updates payment status to completed
 * 
 * @param transactionId - Payment transaction ID
 */
OrderSchema.methods.markAsPaid = async function (
  this: IOrder,
  transactionId: string
): Promise<void> {
  this.paymentStatus = 'completed';
  this.transactionId = transactionId;
  this.status = OrderStatus.PAID;
  await this.save();
};

/**
 * Instance Method: Cancel Order
 * 
 * Cancels the order and restores product stock
 */
OrderSchema.methods.cancelOrder = async function (this: IOrder): Promise<void> {
  // Only allow cancellation for certain statuses
  const cancellableStatuses = [
    OrderStatus.PENDING,
    OrderStatus.PAID,
    OrderStatus.PROCESSING,
  ];

  if (!cancellableStatuses.includes(this.status)) {
    throw new Error('Order cannot be cancelled at this stage');
  }

  // Restore stock for each item
  const Product = mongoose.model('Product');
  
  for (const item of this.items) {
    const product = await Product.findById(item.product);
    if (product && product.stock !== -1) {
      // Only restore stock for physical products
      product.stock += item.quantity;
      await product.save();
    }
  }

  // Update order status
  this.status = OrderStatus.CANCELLED;
  await this.save();
};

/**
 * Static Method: Get User Orders
 * 
 *

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