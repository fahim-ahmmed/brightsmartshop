import { MongoClient } from 'mongodb';

// Better Auth নিজস্ব native driver সংযোগ ব্যবহার করে (ডেটা Mongoose-এর মডেল থেকে আলাদা)।
// URI না থাকলেও import ভাঙবে না, যাতে build চলে।
const client =
  globalThis._authMongoClient ||
  (globalThis._authMongoClient = new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017'));

export const db = client.db();

export const getUserCollection = () => db.collection('user');

let indexPromise;
export function ensureUserIndexes() {
  // মোবাইল নম্বর ইউনিক; একবারই চলে
  indexPromise ||= getUserCollection()
    .createIndex({ mobile: 1 }, { unique: true, partialFilterExpression: { mobile: { $type: 'string' } } })
    .catch((e) => {
      indexPromise = null;
      console.error('[auth] index error:', e.message);
    });
  return indexPromise;
}
