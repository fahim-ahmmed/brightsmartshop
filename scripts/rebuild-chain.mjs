// একবার চালানোর স্ক্রিপ্ট: চেইনের লেভেল, প্যাকেজ সংখ্যা ও ওয়ালেট আসল অর্ডার থেকে নতুন করে হিসাব করে।
// নিয়ম: ইউজারের প্রথম নোড = মেইন আইডি (টাকা ইউজারের ওয়ালেটে), বাকি সব = প্রোডাক্ট আইডি (টাকা ওই আইডিতেই, earnedTaka)।
// প্রথমে `node --env-file=.env.local scripts/rebuild-chain.mjs` চালান (শুধু দেখাবে)।
// ঠিক লাগলে `node --env-file=.env.local scripts/rebuild-chain.mjs --apply` দিন।
import { MongoClient, ObjectId } from 'mongodb';
import { LEVEL_CONFIG, designationFor } from '../src/lib/level-config.js';

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
const realPkgs = (n) => (n.isSystemFounder ? 0 : Number(n.packages ?? 1));

// প্রতিটা নোডের পরে কতটা আসল প্যাকেজ এসেছে
let after = 0;
const acc = new Array(nodes.length);
for (let i = nodes.length - 1; i >= 0; i--) {
  acc[i] = after;
  after += realPkgs(nodes[i]);
}
console.log('মোট আসল প্যাকেজ (চেইনে):', after);

const seenMan = new Set();
const walletByUser = new Map();
const levelByUser = new Map();
const histRows = [];

for (let i = 0; i < nodes.length; i++) {
  const n = nodes[i];
  const uid = String(n.userId || n.phone || '');

  // ইউজারের প্রথম নোডই মেইন আইডি, বাকি সব প্রোডাক্ট আইডি
  const isMan = Boolean(uid) && !seenMan.has(uid);
  if (isMan) seenMan.add(uid);

  let level = 0;
  for (const c of LEVEL_CONFIG) {
    if (acc[i] >= c.requiredPackages) level = c.level;
    else break;
  }
  const reward = LEVEL_CONFIG.filter((c) => c.level <= level).reduce((s, c) => s + c.taka, 0);

  if (isMan) {
    walletByUser.set(uid, (walletByUser.get(uid) || 0) + reward);
    levelByUser.set(uid, Math.max(levelByUser.get(uid) || 0, level));
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

  console.log(
    `seq ${n.sequenceNo} ${n.chainAccountId || '(খালি)'} | ${isMan ? 'মেইন (M)' : 'প্রোডাক্ট (P)'} | নিচে প্যাকেজ: ${acc[i]} | লেভেল: ${level} | টাকা: ${reward} ${isMan ? '→ ইউজারের ওয়ালেটে' : '→ শুধু এই আইডিতে'}`
  );

  if (apply) {
    await chain.updateOne(
      { _id: n._id },
      { $set: { accumulatedPackages: acc[i], currentLevel: level, isManId: isMan, earnedTaka: isMan ? 0 : reward } }
    );
  }
}

console.log('\nইউজার অনুযায়ী ওয়ালেট (শুধু মেইন আইডির টাকা):');
for (const [uid, taka] of walletByUser) console.log(uid, '=>', taka, 'টাকা, লেভেল', levelByUser.get(uid));

if (apply) {
  await hist.deleteMany({ type: 'level_reward' });
  if (histRows.length) await hist.insertMany(histRows);

  for (const [uid, taka] of walletByUser) {
    const lvl = levelByUser.get(uid) || 0;
    const profile = await users.findOne(idFilter(uid));
    await users.updateOne(idFilter(uid), {
      $set: { walletBalance: taka, level: lvl, currentLevel: lvl, designation: designationFor(lvl) },
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