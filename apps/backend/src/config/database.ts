import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {   
const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
    throw new Error('MONGO_URI is not defined in environment variables');
}

try {
    const conn = await mongoose.connect(mongoURI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
        console.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected. Attempting to reconnect...');
        connectDB().catch(error => console.error('Reconnection error:', error));
    });

    mongoose.connection.on('reconnected', () => {
        console.log('MongoDB reconnected successfully');
    });
} catch (error) {
    const err = error as Error;
    console.error(`Error connecting to MongoDB:`, err.message);
    
    process.exit(1);
}
};

export const disconnectDB = async (): Promise<void> => {
    try {
        await mongoose.disconnect();
        console.log('MongoDB disconnected successfully');
    } catch (error) {
        const err = error as Error;
        console.error(`Error disconnecting from MongoDB:`, err.message);
    }
};