// শুধু পড়ে, কিছু বদলায় না। চেইনের কোন নোডটা বাড়তি বা ভুতুড়ে তা বলে দেয়।
// চালান: node --env-file=.env.local scripts/check-chain.mjs
import { MongoClient } from 'mongodb';
import { isRealNode } from '../src/lib/level-progress.js';

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db();

const nodes = await db.collection('global_chain').find({}).sort({ sequenceNo: 1 }).toArray();
const orders = await db.collection('orders').find({}).toArray();
const orderNos = new Set(orders.flatMap((o) => [o.orderNo, o.orderId]).filter(Boolean));
const cancelledNos = new Set(
  orders.filter((o) => /^cancel/i.test(String(o.status || ''))).flatMap((o) => [o.orderNo, o.orderId]).filter(Boolean)
);

const real = nodes.filter(isRealNode);
console.log(`মোট নোড: ${nodes.length} | ফাউন্ডার: ${nodes.filter((n) => n.isSystemFounder).length} | আসল: ${real.length}`);

// ১. অনাথ নোড (অর্ডার নম্বর ও আইডি দুটোই ফাঁকা)
const orphans = nodes.filter((n) => !n.isSystemFounder && !isRealNode(n));
console.log(`\n[১] অনাথ নোড (অর্ডার নম্বর ও আইডি ছাড়া): ${orphans.length}`);
for (const n of orphans) console.log('   seq', n.sequenceNo, '| userId:', n.userId, '| ফোন:', n.phone, '| তৈরি:', n.createdAt);

// ২. অর্ডার মুছে ফেলা হয়েছে কিন্তু নোড রয়ে গেছে
const ghost = real.filter((n) => n.orderNo && (!orderNos.has(n.orderNo) || cancelledNos.has(n.orderNo)));
console.log(`\n[২] অর্ডার মোছা/Cancelled অথচ নোড আছে: ${ghost.length}`);
for (const n of ghost) console.log('   seq', n.sequenceNo, '|', n.chainAccountId, '| orderNo:', n.orderNo, '| ইউজার:', n.userName, cancelledNos.has(n.orderNo) ? '| (Cancelled)' : '| (অর্ডার মোছা)');

// ৩. ডুপ্লিকেট sequenceNo
const seqCount = new Map();
for (const n of nodes) seqCount.set(n.sequenceNo, (seqCount.get(n.sequenceNo) || 0) + 1);
const dupSeq = [...seqCount].filter(([, c]) => c > 1);
console.log(`\n[৩] ডুপ্লিকেট sequenceNo: ${dupSeq.length}`);
for (const [s, c] of dupSeq) console.log('   seq', s, 'আছে', c, 'বার');

// ৪. একই অর্ডার থেকে একাধিক নোড (বড় অর্ডারে ৪০+ পয়েন্ট হলে স্বাভাবিক, তবে দেখে নিন)
const byOrder = new Map();
for (const n of real) if (n.orderNo) byOrder.set(n.orderNo, (byOrder.get(n.orderNo) || 0) + 1);
const multi = [...byOrder].filter(([, c]) => c > 1);
console.log(`\n[৪] একই orderNo-তে একাধিক নোড: ${multi.length}`);
for (const [o, c] of multi) {
  const ord = orders.find((x) => x.orderNo === o || x.orderId === o);
  console.log('   ', o, '→', c, 'টি নোড | অর্ডারের পয়েন্ট:', ord?.totalPoints ?? ord?.points ?? '(অর্ডার নেই)');
}

// ৫. প্রতি ইউজারের নোড বনাম Paid অর্ডার
console.log('\n[৫] ইউজার অনুযায়ী');
const byUser = new Map();
for (const n of real) {
  const k = String(n.userId || n.phone);
  if (!byUser.has(k)) byUser.set(k, { name: n.userName, nodes: [] });
  byUser.get(k).nodes.push(n);
}
for (const [uid, info] of byUser) {
  const paid = orders.filter(
    (o) => ['Paid', 'paid'].includes(o.status) && (String(o.profileId) === uid || String(o.userId) === uid)
  );
  const paidPts = paid.reduce((s, o) => s + Number(o.totalPoints ?? o.points ?? 0), 0);
  console.log(
    `   ${info.name || uid}: নোড ${info.nodes.length} | Paid অর্ডার ${paid.length} | Paid পয়েন্ট ${paidPts} (≈ ${Math.floor(paidPts / 40)} প্যাকেজ)`
  );
}

console.log('\nউপরের [১] বা [২]-এ যা পাওয়া গেল সেটাই বাড়তি নোড। [১] হলে remove-orphan-node.mjs, [২] হলে remove-ghost-nodes.mjs চালান।');
await client.close();