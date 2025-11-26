// scripts/make_first_admin.ts

/**
 * SCRIPT: MAKE FIRST USER ADMIN
 * * This script connects to the database and promotes the 
 * first user found (by creation date) to the 'admin' role.
 * This is crucial for initializing your backend permissions.
 */

import dotenv from 'dotenv';
import { connectDB } from '../src/config/database'; // Adjust path if needed
import User from '../src/models/User.model';
import { UserRole } from '../src/types';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

const makeAdmin = async () => {
  // Ensure DB is connected
  await connectDB();

  try {
    // 1. Find the first user ever registered (newest one if sorting by -1)
    const firstUser = await User.findOne().sort({ createdAt: 1 });

    if (!firstUser) {
      console.log('⚠️ No users found in the database. Please register a user first.');
      return;
    }

    // 2. Check current role
    if (firstUser.role === UserRole.ADMIN) {
      console.log(`✅ User ${firstUser.email} is already an Admin.`);
      return;
    }

    // 3. Update the role
    firstUser.role = UserRole.ADMIN;
    await firstUser.save();

    console.log(`
      👑 SUCCESS: ${firstUser.name} (${firstUser.email})
      Role updated from 'customer' to 'admin'.
    `);

  } catch (error) {
    console.error('❌ Error promoting user:', error);
    process.exit(1);
  } finally {
    // Gracefully close connection
    await mongoose.connection.close();
    process.exit(0);
  }
};

makeAdmin();
