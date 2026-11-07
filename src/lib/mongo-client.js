import { MongoClient } from "mongodb";

const options = {};

function getValidMongoUri() {
  let raw =
    process.env.MONGODB_URI ||
    process.env.NEXT_PUBLIC_MONGODB_URI ||
    process.env.DATABASE_URL ||
    "";

  raw = raw.trim();

  // ভুলবশত কোটেশন বা MONGODB_URI= সহ পেস্ট করা থাকলে ক্লিন করবে
  if (raw.includes("mongodb+srv://")) {
    raw = "mongodb+srv://" + raw.split("mongodb+srv://")[1];
  } else if (raw.includes("mongodb://")) {
    raw = "mongodb://" + raw.split("mongodb://")[1];
  }

  raw = raw.replace(/["'\s]+$/g, "");

  if (raw.startsWith("mongodb://") || raw.startsWith("mongodb+srv://")) {
    return raw;
  }

  // বিল্ডের সময় ভেরিয়েবল না পেলে ডামি URI, যাতে MongoParseError না আসে
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

// URI-তে ডাটাবেসের নাম থাকলে সেটাই নেবে। না থাকলে MONGODB_DB ভ্যারিয়েবল দিন
export const db = client.db(process.env.MONGODB_DB || undefined);
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

// Lazy clientPromise: বিল্ডের সময় ডাটাবেস কল করবে না
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

// async নয়: auth/actions.js আর profile/actions.js এটা সরাসরি .findOne() দিয়ে ব্যবহার করে
export function getUserCollection() {
  return db.collection("user"); // আসল কালেকশনের নাম দিন ("user" বা "users")
}

let _indexesPromise = null;

// registerAction এটা await করে ডাকে
export async function ensureUserIndexes() {
  if (!_indexesPromise) {
    _indexesPromise = getUserCollection()
      .createIndex(
        { mobile: 1 },
        {
          unique: true,
          partialFilterExpression: { mobile: { $type: "string" } },
        }
      )
      .catch((err) => {
        _indexesPromise = null; // ফেইল করলে পরের বার আবার চেষ্টা করবে
        throw err;
      });
  }
  return _indexesPromise;
}

export { clientPromise };
export default clientPromise;