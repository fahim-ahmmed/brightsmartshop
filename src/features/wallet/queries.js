import { connectDB } from '@/lib/db';
import { serialize } from '@/lib/utils';
import LevelConfig from '@/models/LevelConfig';
import Order from '@/models/Order';
import Withdrawal from '@/models/Withdrawal';
import WalletAccount from '@/models/WalletAccount';
import WalletLedger from '@/models/WalletLedger';
import { getLifetimePointsX100 } from './rewards';
import { computeLevelInfo } from './levels';

export async function getLevels() {
  await connectDB();
  return serialize(await LevelConfig.find().sort({ level: 1 }).lean());
}

export async function getUserLifetimePointsX100(userId) {
  await connectDB();
  return getLifetimePointsX100(userId);
}

export async function getDashboardData(userId) {
  await connectDB();
  const [levels, account, pointsX100, orderCount, deliveredCount, recentOrders, ledger, withdrawals] = await Promise.all([
    LevelConfig.find().sort({ level: 1 }).lean(),
    WalletAccount.findOne({ userId }).lean(),
    getLifetimePointsX100(userId),
    Order.countDocuments({ userId }),
    Order.countDocuments({ userId, status: 'delivered' }),
    Order.find({ userId }).sort({ createdAt: -1 }).limit(5).lean(),
    WalletLedger.find({ userId }).sort({ createdAt: -1 }).limit(20).lean(),
    Withdrawal.find({ userId }).sort({ createdAt: -1 }).limit(10).lean(),
  ]);
  const levelList = serialize(levels);
  return {
    balancePaisa: account?.balancePaisa || 0,
    pointsX100,
    orderCount,
    deliveredCount,
    levelInfo: computeLevelInfo(levelList, pointsX100),
    recentOrders: serialize(recentOrders),
    ledger: serialize(ledger),
    withdrawals: serialize(withdrawals),
    hasPendingWithdrawal: withdrawals.some((w) => w.status === 'pending'),
  };
}
