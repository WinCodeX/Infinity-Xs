import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!, {
      serverSelectionTimeoutMS: 5000
    });

    console.log("✅ Mongoose connected");
  } catch (error: any) {
    console.error("❌ Mongoose connection failed:", error.message);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log("✅ Mongoose disconnected");
  } catch (error) {
    console.error("❌ Error disconnecting mongoose:", error);
  }
};
