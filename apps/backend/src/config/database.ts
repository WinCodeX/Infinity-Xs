// src/config/database.ts (Prisma Client Configuration)

import { PrismaClient } from '@prisma/client';

/**
 * Global Prisma Client Instance
 * * We use a global variable to ensure that only one instance
 * of PrismaClient is created during the application lifecycle.
 */
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Use existing global instance or create a new one
export const prisma = global.prisma || new PrismaClient({
  __internal: {
        clientEngineType: 'library',
  },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

// Set global variable for development environment to prevent hot-reload issues
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

/**
 * Connect to Database (Initial Log)
 * * In Prisma, the connection is lazy (happens on the first query),
 * so we simply log initialization success.
 */
export const connectDB = async (): Promise<void> => {
    try {
        // Attempt a simple query to verify connection (optional, but good practice)
        await prisma.$connect();
        console.log(`✅ Prisma Client Initialized and Connected to MongoDB`);
    } catch (error) {
        const err = error as Error;
        console.error('❌ Error initializing Prisma/MongoDB connection:', err.message);
        process.exit(1);
    }
};

/**
 * Gracefully disconnect from Database
 */
export const disconnectDB = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    console.log('✅ Prisma connection closed');
  } catch (error) {
    const err = error as Error;
    console.error('❌ Error closing Prisma connection:', err.message);
  }
};