import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const options = {};

let client;
let clientPromise;

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Better Auth এবং অ্যাপ্লিকেশনের ব্যবহারের জন্য db ও কালেকশন হেল্পার
export const db = client.db();
export const getUserCollection = () => db.collection('user');

let indexPromise;
export function ensureUserIndexes() {
  indexPromise ||= getUserCollection()
    .createIndex({ mobile: 1 }, { unique: true, partialFilterExpression: { mobile: { $type: 'string' } } })
    .catch((e) => {
      indexPromise = null;
      console.error('[auth] index error:', e.message);
    });
  return indexPromise;
}

export default clientPromise;