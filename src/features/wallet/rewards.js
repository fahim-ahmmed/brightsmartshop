import Order from '../../models/Order.js';
import LevelConfig from '../../models/LevelConfig.js';
import WalletLedger from '../../models/WalletLedger.js';
import { postLedger } from './ledger.js';

// নিজের Delivered অর্ডারগুলোর মোট Point (×100)
export async function getLifetimePointsX100(userId) {
  const [row] = await Order.aggregate([
    { $match: { userId, status: 'delivered' } },
    { $group: { _id: null, total: { $sum: '$totalPointsX100' } } },
  ]);
  return row?.total || 0;
}

/**
 * পৌঁছানো প্রতিটি লেভেলের পুরস্কার একবারই Wallet-এ যায় (ডেটাবেসের unique key নিশ্চিত করে)।
 * নিরাপত্তা-সীমা: মোট পুরস্কার কখনো জমা Point-এর মূল্যের (১ Point = ৳১) বেশি হবে না,
 * তাই ভুল কনফিগারেশনেও পুরস্কার বিক্রয়ের অংশের বাইরে যেতে পারে না।
 */
export async function creditLevelRewards(userId) {
  const [levels, pointsX100, paidRow] = await Promise.all([
    LevelConfig.find().sort({ level: 1 }).lean(),
    getLifetimePointsX100(userId),
    WalletLedger.aggregate([{ $match: { userId, reason: 'level_reward' } }, { $group: { _id: null, total: { $sum: '$amountPaisa' } } }]),
  ]);
  let paidPaisa = paidRow[0]?.total || 0;
  const credited = [];

  for (const l of levels) {
    if (pointsX100 < l.threshold * 100) break;
    if (!l.rewardPaisa) continue;
    const exists = await WalletLedger.exists({ userId, reason: 'level_reward', refType: 'level', refId: String(l.level) });
    if (exists) continue;
    if (paidPaisa + l.rewardPaisa > pointsX100) continue; // সীমা ছাড়ালে এখন নয়; পরের অর্ডারে আবার চেষ্টা
    const res = await postLedger({
      userId,
      type: 'credit',
      reason: 'level_reward',
      amountPaisa: l.rewardPaisa,
      refType: 'level',
      refId: String(l.level),
      note: `Level ${l.level} reward`,
    });
    if (res.ok) {
      paidPaisa += l.rewardPaisa;
      credited.push(l.level);
    }
  }
  return credited;
}

/**
 * অর্ডার Delivered হলে এটা ডাকতে হবে (ভাগ ৫-এ অ্যাডমিন স্ট্যাটাস বদলালে)।
 * একই অর্ডারে দুবার চালালেও কিছু দুবার যোগ হয় না।
 */
export async function applyDeliveredOrder(orderId) {
  const order = await Order.findById(orderId).lean();
  if (!order || order.status !== 'delivered') return { skipped: 'order is not delivered' };

  const claim = await Order.updateOne({ _id: order._id, rewardsApplied: false }, { $set: { rewardsApplied: true } });
  if (claim.modifiedCount !== 1) return { skipped: 'already applied' };

  try {
    const levels = await creditLevelRewards(order.userId);
    return { applied: true, levelsCredited: levels };
  } catch (err) {
    await Order.updateOne({ _id: order._id }, { $set: { rewardsApplied: false } }); // আবার চেষ্টা করা যাবে
    throw err;
  }
}
