import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db();

const me = await db.collection('users').findOne({ name: 'BRIGHT SMART SHOP 1' });
if (!me) { console.log('প্রোফাইল পাওয়া যায়নি'); process.exit(0); }
const myId = String(me._id);
console.log('প্রোফাইল:', myId, '| ফোন:', me.phone, '| রিজার্ভ:', me.reservePoints, '| totalPackages:', me.totalPackages);

const orders = await db.collection('orders')
  .find({ $or: [{ userId: myId }, { profileId: myId }, { userId: String(me.authUserId) }, { phone: me.phone }] })
  .sort({ createdAt: 1 }).toArray();
console.log('\n--- আমার অর্ডার ---');
for (const o of orders) {
  const itemPts = (o.items || []).map((i) => `${i.title || i.name}: ${i.points ?? i.point ?? 0} x ${i.quantity ?? i.qty ?? 1}`).join(' ; ');
  console.log(o.orderNo || o.orderId, '|', o.status, '| পয়েন্ট:', o.totalPoints ?? o.points ?? 0, '|', o.createdAt, '|', itemPts);
}

const nodes = await db.collection('global_chain').find({ sequenceNo: { $gte: 1 } }).sort({ sequenceNo: 1 }).toArray();
console.log('\n--- চেইনের সব নোড ---');
for (const n of nodes) {
  const mine = String(n.userId) === myId ? ' <== আমার' : '';
  console.log('seq', n.sequenceNo, '|', n.chainAccountId || '(খালি)', '| orderNo:', n.orderNo || '(নেই)', '| userId:', n.userId, '| ফোন:', n.phone, '| তৈরি:', n.createdAt, mine);
}
await client.close();