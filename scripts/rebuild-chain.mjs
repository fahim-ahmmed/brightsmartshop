// একবার চালানোর স্ক্রিপ্ট: চেইনের লেভেল, প্যাকেজ সংখ্যা ও ওয়ালেট আসল অর্ডার থেকে নতুন করে হিসাব করে।
// এখন dashboard-stats ও orders-এর সাথে একই "ধাপে ধাপে রিসেট" নিয়ম এবং একই "আসল নোড" নিয়ম ব্যবহার করে।
// নিয়ম: ইউজারের প্রথম আসল নোড = মেইন আইডি (টাকা ইউজারের ওয়ালেটে), বাকি = প্রোডাক্ট আইডি (earnedTaka)।
// অনাথ নোড (orderNo ও chainAccountId দুটোই ফাঁকা) কোনো হিসাবে ধরা হয় না।
// প্রথমে `node --env-file=.env.local scripts/rebuild-chain.mjs` (শুধু দেখাবে)
// ঠিক লাগলে `node --env-file=.env.local scripts/rebuild-chain.mjs --apply`
import { MongoClient, ObjectId } from 'mongodb';
import { designationFor } from '../src/lib/level-config.js';
import { getStepByStepProgress, isRealNode } from '../src/lib/level-progress.js';

const apply = process.argv.includes('--apply');
const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db();
const chain = db.collection('global_chain');
const users = db.collection('users');
const authUsers = db.collection('user');
const hist = db.collection('wallet_history');

const idFilter = (id) => (ObjectId.isValid(String(id)) ? { _id: new ObjectId(String(id)) } : { _id: String(id) });

const nodes = await chain.find({}).sort({ sequenceNo: 1, createdAt: 1 }).toArray();
const realPkgs = (n) => (isRealNode(n) ? Number(n.packages ?? 1) : 0);

// প্রতিটা নোডের পরে কতটা আসল প্যাকেজ এসেছে
let after = 0;
const acc = new Array(nodes.length);
for (let i = nodes.length - 1; i >= 0; i--) {
  acc[i] = after;
  after += realPkgs(nodes[i]);
}
console.log('মোট আসল প্যাকেজ (চেইনে):', after);

const orphans = nodes.filter((n) => !n.isSystemFounder && !isRealNode(n));
if (orphans.length) {
  console.log(`\n⚠️ ${orphans.length}টি অনাথ নোড পাওয়া গেছে (গণনায় ধরা হয়নি):`);
  for (const o of orphans) console.log('   seq', o.sequenceNo, '| userId:', o.userId, '| তৈরি:', o.createdAt);
  console.log('   মুছতে চাইলে scripts/remove-orphan-node.mjs --apply চালান।\n');
}

const seenMan = new Set();
const walletByUser = new Map();
const levelByUser = new Map();
const pkgsByUser = new Map();
const histRows = [];

for (let i = 0; i < nodes.length; i++) {
  const n = nodes[i];
  const real = isRealNode(n);
  const uid = String(n.userId || n.phone || '');

  // ইউজারের প্রথম আসল নোডই মেইন আইডি; ফাউন্ডার প্লেসহোল্ডার শুধু তখনই যখন ওই ইউজারের কোনো আসল নোড নেই
  const hasRealNode = nodes.some((x) => isRealNode(x) && String(x.userId || x.phone || '') === uid);
  let isMan = false;
  if (uid && !seenMan.has(uid)) {
    if (n.isSystemFounder ? !hasRealNode : real) {
      seenMan.add(uid);
      isMan = true;
    }
  }

  const step = getStepByStepProgress(acc[i]);
  const level = step.level;
  const reward = step.earnedTaka;

  if (isMan) {
    walletByUser.set(uid, reward);
    levelByUser.set(uid, level);
    if (real) pkgsByUser.set(uid, 0);
    if (reward > 0) {
      histRows.push({
        userId: uid,
        authUserId: String(n.authUserId || ''),
        chainAccountId: n.chainAccountId,
        isManId: true,
        amount: reward,
        toLevel: level,
        type: 'level_reward',
        createdAt: new Date(),
      });
    }
  }
  if (real) pkgsByUser.set(uid, (pkgsByUser.get(uid) || 0) + 1);

  console.log(
    `seq ${n.sequenceNo} ${n.chainAccountId || '(খালি)'} | ${real ? (isMan ? 'মেইন (M)' : 'প্রোডাক্ট (P)') : n.isSystemFounder ? 'ফাউন্ডার' : 'অনাথ'} | নিচে প্যাকেজ: ${acc[i]} | লেভেল: ${level} | টাকা: ${reward}${isMan ? ' → ইউজারের ওয়ালেটে' : ''}`
  );

  if (apply) {
    await chain.updateOne(
      { _id: n._id },
      { $set: { accumulatedPackages: acc[i], currentLevel: level, isManId: isMan, earnedTaka: !isMan && real ? reward : 0 } }
    );
  }
}

console.log('\nইউজার অনুযায়ী (শুধু মেইন আইডির টাকা):');
for (const [uid, taka] of walletByUser) {
  console.log(uid, '=>', taka, 'টাকা, লেভেল', levelByUser.get(uid), ', নিজের প্যাকেজ', pkgsByUser.get(uid) || 0);
}

if (apply) {
  await hist.deleteMany({ type: 'level_reward' });
  if (histRows.length) await hist.insertMany(histRows);

  for (const [uid, taka] of walletByUser) {
    const lvl = levelByUser.get(uid) || 0;
    const profile = await users.findOne(idFilter(uid));
    await users.updateOne(idFilter(uid), {
      $set: {
        walletBalance: taka,
        level: lvl,
        currentLevel: lvl,
        designation: designationFor(lvl),
        totalPackages: pkgsByUser.get(uid) || 0,
      },
    });
    if (profile?.authUserId && ObjectId.isValid(profile.authUserId)) {
      await authUsers.updateOne(
        { _id: new ObjectId(profile.authUserId) },
        { $set: { walletBalance: taka, level: lvl } }
      );
    }
  }
  console.log('\nপ্রয়োগ সম্পন্ন।');
} else {
  console.log('\nএটা শুধু প্রিভিউ। কিছু বদলানো হয়নি। বদলাতে --apply দিন।');
}
await client.close();