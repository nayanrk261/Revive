import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServer = null;

export const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/revive';

  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`[DB] Connected to MongoDB at ${primaryUri}`);
  } catch (primaryErr) {
    console.warn(`[DB] Could not connect to ${primaryUri} (${primaryErr.message}). Starting in-memory MongoDB...`);
    try {
      mongoMemoryServer = await MongoMemoryServer.create();
      const memoryUri = mongoMemoryServer.getUri();
      await mongoose.connect(memoryUri);
      console.log(`[DB] Connected to MongoMemoryServer at ${memoryUri}`);
    } catch (memErr) {
      console.error('[DB] Failed to connect to MongoMemoryServer:', memErr);
      process.exit(1);
    }
  }
};
