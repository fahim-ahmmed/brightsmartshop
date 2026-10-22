import { MongoClient } from "mongodb";

const options = {};

function getCleanUri() {
  const raw = process.env.MONGODB_URI || process.env.NEXT_PUBLIC_MONGODB_URI || "";
  // ভুলবশত কোটেশন (" ") বা স্পেস থাকলে তা অটোমেটিক পরিষ্কার করবে
  return raw
    .trim()
    .replace(/^MONGODB_URI\s*=\s*/i, "")
    .replace(/^["']|["']$/g, "")
    .trim();
}

let _clientPromise = null;

function getClientPromise() {
  if (_clientPromise) return _clientPromise;

  const uri = getCleanUri();

  if (!uri || (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://"))) {
    throw new Error(
      "MONGODB_URI is missing or invalid in Vercel Environment Variables."
    );
  }

  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
    _clientPromise = global._mongoClientPromise;
  } else {
    const client = new MongoClient(uri, options);
    _clientPromise = client.connect();
  }

  return _clientPromise;
}

// 🟢 Lazy Connection: Vercel Build-এর সময় কখনোই ক্র্যাশ করবে না, শুধু লাইভ রিকোয়েস্টে কানেক্ট হবে
const clientPromise = {
  then(onFulfilled, onRejected) {
    try {
      return getClientPromise().then(onFulfilled, onRejected);
    } catch (err) {
      return Promise.reject(err).then(onFulfilled, onRejected);
    }
  },
  catch(onRejected) {
    try {
      return getClientPromise().catch(onRejected);
    } catch (err) {
      return Promise.reject(err).catch(onRejected);
    }
  },
};

export default clientPromise;