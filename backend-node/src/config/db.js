import mongoose from 'mongoose';

export async function connectDb(uri) {
  if (!uri) {
    throw new Error('Missing MONGODB_URI');
  }
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  console.log('MongoDB connected');
}
