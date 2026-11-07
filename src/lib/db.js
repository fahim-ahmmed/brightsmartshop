import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI;

// dev-এ hot reload হলেও একটাই সংযোগ থাকবে
const cached = globalThis._mongooseCache || (globalThis._mongooseCache = { conn: null, promise: null });

export async function connectDB() {
  if (!uri) throw new Error('MONGODB_URI সেট করা নেই (.env.local দেখুন)');
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, { bufferCommands: false }).catch((err) => {
      cached.promise = null; // ব্যর্থ হলে পরের বার আবার চেষ্টা হবে
      throw err;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export const dbConnect = connectDB;
export default connectDB;
