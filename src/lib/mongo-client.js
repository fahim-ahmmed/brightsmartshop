import { MongoClient } from "mongodb";

const options = {};

function getValidMongoUri() {
  let raw =
    process.env.MONGODB_URI ||
    process.env.NEXT_PUBLIC_MONGODB_URI ||
    process.env.DATABASE_URL ||
    "";

  raw = raw.trim();

  // যদি ভুলবশত কোটেশন বা MONGODB_URI= সহ পেস্ট করা থাকে, তা অটোমেটিক ক্লিন করবে
  if (raw.includes("mongodb+srv://")) {
    raw = "mongodb+srv://" + raw.split("mongodb+srv://")[1];
  } else if (raw.includes("mongodb://")) {
    raw = "mongodb://" + raw.split("mongodb://")[1];
  }

  raw = raw.replace(/["'\s]+$/g, "");

  if (raw.startsWith("mongodb://") || raw.startsWith("mongodb+srv://")) {
    return raw;
  }

  // বিল্ডের সময় ভেরিয়েবল না পেলে ডামি URI ব্যবহার করবে যাতে কখনোই MongoParseError না আসে
  return "mongodb://127.0.0.1:27017/brightsmartshop";
}

const uri = getValidMongoUri();

let client;
let _clientPromise = null;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClient) {
    global._mongoClient = new MongoClient(uri, options);
  }
  client = global._mongoClient;
} else {
  client = new MongoClient(uri, options);
}

// 🟢 Named export 'db' ও 'client' (যাতে queries.js ও অন্যান্য ফাইলে কোনো এরর না আসে)
export const db = client.db();
export { client };

function getClientPromise() {
  if (_clientPromise) return _clientPromise;

  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = client.connect();
    }
    _clientPromise = global._mongoClientPromise;
  } else {
    _clientPromise = client.connect();
  }

  return _clientPromise;
}

// 🟢 Lazy clientPromise: বিল্ডের সময় ডাটাবেস কল করে ক্র্যাশ করবে না
const clientPromise = {
  then(onFulfilled, onRejected) {
    return getClientPromise().then(onFulfilled, onRejected);
  },
  catch(onRejected) {
    return getClientPromise().catch(onRejected);
  },
  finally(onFinally) {
    return getClientPromise().finally(onFinally);
  },
};

export { clientPromise };
export default clientPromise;