import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const options = {};

let client;
let clientPromise;

if (process.env.NODE_ENV === 'development') {
  // ক্যাশ চেক করার সময় client এবং clientPromise উভয়কেই সংরক্ষণ করতে হবে
  if (!global._mongoClient) {
    client = new MongoClient(uri, options);
    global._mongoClient = client;
    global._mongoClientPromise = client.connect();
  } else {
    client = global._mongoClient;
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// এখন client সঠিকভাবে পাওয়া যাবে, তাই আর undefined এরর আসবে না
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