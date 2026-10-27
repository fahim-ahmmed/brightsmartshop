// একবার চালানোর স্ক্রিপ্ট: আইডি ও অর্ডার নম্বর ছাড়া পুরোনো অবশিষ্ট নোড মুছে ফেলে।
// প্রথমে `node --env-file=.env.local scripts/remove-orphan-node.mjs` (শুধু দেখাবে)
// ঠিক লাগলে শেষে --apply দিন।
import { MongoClient, ObjectId } from 'mongodb';

const apply = process.argv.includes('--apply');
const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db();
const chain = db.collection('global_chain');
const users = db.collection('users');

const orphans = await chain
  .find({
    sequenceNo: { $gt: 10 },
    isSystemFounder: { $ne: true },
    $and: [
      { $or: [{ chainAccountId: { $exists: false } }, { chainAccountId: '' }, { chainAccountId: null }] },
      { $or: [{ orderNo: { $exists: false } }, { orderNo: '' }, { orderNo: null }] },
    ],
  })
  .toArray();

console.log('পাওয়া গেছে:', orphans.length, 'টি');
for (const n of orphans) {
  console.log('seq', n.sequenceNo, '| userId:', n.userId, '| তৈরি:', n.createdAt);
}

if (apply) {
  for (const n of orphans) {
    await chain.deleteOne({ _id: n._id });
    const filter = ObjectId.isValid(String(n.userId)) ? { _id: new ObjectId(String(n.userId)) } : { _id: String(n.userId) };
    await users.updateOne(filter, { $inc: { totalPackages: -1 } });
    console.log('মুছেছি: seq', n.sequenceNo);
  }
  console.log('সম্পন্ন। এখন rebuild-chain.mjs --apply চালান।');
} else {
  console.log('এটা শুধু প্রিভিউ। কিছু মোছা হয়নি। মুছতে শেষে --apply দিন।');
}
await client.close();