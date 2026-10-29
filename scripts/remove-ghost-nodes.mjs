// একবার চালানোর স্ক্রিপ্ট: যে অর্ডার মোছা হয়েছে বা Cancelled, কিন্তু চেইনে নোড রয়ে গেছে সেই নোড মুছে ফেলে।
// প্রথমে `node --env-file=.env.local scripts/remove-ghost-nodes.mjs` (শুধু দেখাবে)
// ঠিক লাগলে শেষে --apply দিন, তারপর rebuild-chain.mjs --apply চালান।
// দ্রষ্টব্য: ইউজারের reservePoints এখানে ফেরত দেওয়া হয় না।
import { MongoClient, ObjectId } from 'mongodb';
import { isRealNode } from '../src/lib/level-progress.js';

const apply = process.argv.includes('--apply');
const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db();
const chain = db.collection('global_chain');
const users = db.collection('users');

const orders = await db.collection('orders').find({}).toArray();
const known = new Set(orders.flatMap((o) => [o.orderNo, o.orderId]).filter(Boolean));
const cancelled = new Set(
  orders.filter((o) => /^cancel/i.test(String(o.status || ''))).flatMap((o) => [o.orderNo, o.orderId]).filter(Boolean)
);

const nodes = await chain.find({}).sort({ sequenceNo: 1 }).toArray();
const ghosts = nodes.filter((n) => isRealNode(n) && n.orderNo && (!known.has(n.orderNo) || cancelled.has(n.orderNo)));

console.log('ভুতুড়ে নোড:', ghosts.length, 'টি');
for (const n of ghosts) {
  console.log('seq', n.sequenceNo, '|', n.chainAccountId, '| orderNo:', n.orderNo, '| ইউজার:', n.userName, cancelled.has(n.orderNo) ? '| Cancelled' : '| অর্ডার মোছা');
}

if (apply) {
  for (const n of ghosts) {
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