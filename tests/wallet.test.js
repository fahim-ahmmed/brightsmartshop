import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import LevelConfig from '../src/models/LevelConfig.js';
import Order from '../src/models/Order.js';
import WalletAccount from '../src/models/WalletAccount.js';
import WalletLedger from '../src/models/WalletLedger.js';
import Withdrawal from '../src/models/Withdrawal.js';
import { postLedger } from '../src/features/wallet/ledger.js';
import { applyDeliveredOrder } from '../src/features/wallet/rewards.js';

let mongod;
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Promise.all([WalletLedger.init(), Withdrawal.init(), Order.init(), LevelConfig.init(), WalletAccount.init()]); // unique index তৈরি
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});
beforeEach(async () => {
  for (const c of await mongoose.connection.db.collections()) await c.deleteMany({}); // ইনডেক্স থাকে, ডেটা যায়
});

const balance = async (userId) => (await WalletAccount.findOne({ userId }))?.balancePaisa || 0;
const credit = (userId, amountPaisa, refId = 'r1') => postLedger({ userId, type: 'credit', reason: 'adjustment', amountPaisa, refType: 'test', refId });
const hold = (userId, amountPaisa, refId) => postLedger({ userId, type: 'hold', reason: 'withdraw_request', amountPaisa, refType: 'withdrawal', refId });

describe('ledger', () => {
  it('credits the balance', async () => {
    expect((await credit('u1', 5000)).ok).toBe(true);
    expect(await balance('u1')).toBe(5000);
  });
  it('ignores the same entry posted twice (idempotent)', async () => {
    await credit('u1', 5000, 'same');
    const again = await credit('u1', 5000, 'same');
    expect(again).toEqual({ ok: false, reason: 'duplicate' });
    expect(await balance('u1')).toBe(5000);
  });
  it('refuses to overdraw', async () => {
    await credit('u1', 3000);
    expect(await hold('u1', 5000, 'w1')).toEqual({ ok: false, reason: 'insufficient' });
    expect(await balance('u1')).toBe(3000);
  });
  it('never lets simultaneous requests spend more than the balance', async () => {
    await credit('u1', 10000);
    const results = await Promise.all([1, 2, 3, 4, 5].map((i) => hold('u1', 4000, `w${i}`)));
    expect(results.filter((r) => r.ok)).toHaveLength(2);
    expect(await balance('u1')).toBe(2000);
  });
  it('cannot be edited or deleted', async () => {
    await credit('u1', 1000);
    await expect(WalletLedger.updateOne({ userId: 'u1' }, { note: 'changed' })).rejects.toThrow();
    await expect(WalletLedger.deleteMany({ userId: 'u1' })).rejects.toThrow();
  });
});

describe('withdrawals', () => {
  it('allows only one pending request per user', async () => {
    const base = { userId: 'u1', amountPaisa: 10000, method: 'bkash', accountNumber: '01712345678', status: 'pending' };
    await Withdrawal.create(base);
    await expect(Withdrawal.create(base)).rejects.toMatchObject({ code: 11000 });
    await Withdrawal.create({ ...base, userId: 'u2' }); // অন্য ইউজার পারবে
  });
});

describe('level rewards', () => {
  const seedLevels = () =>
    LevelConfig.insertMany([
      { level: 1, threshold: 3, rewardPaisa: 0 },
      { level: 2, threshold: 5, rewardPaisa: 300 },
      { level: 3, threshold: 9, rewardPaisa: 400 },
      { level: 4, threshold: 16, rewardPaisa: 800 },
      { level: 5, threshold: 33, rewardPaisa: 1500 },
    ]);
  const deliveredOrder = (userId, pointsX100, orderNo = 'T1') =>
    Order.create({
      orderNo, userId, status: 'delivered', totalPaisa: 34000, totalPointsX100: pointsX100,
      items: [{ product: new mongoose.Types.ObjectId(), name: 'Pack', pricePaisa: 34000, pointsX100, qty: 1 }],
    });

  it('credits every level reached, once', async () => {
    await seedLevels();
    const order = await deliveredOrder('u1', 4000); // 40 Points → Level 5
    const first = await applyDeliveredOrder(order._id);
    expect(first.levelsCredited).toEqual([2, 3, 4, 5]);
    expect(await balance('u1')).toBe(3000); // ৳3+4+8+15 = ৳30
    expect(await applyDeliveredOrder(order._id)).toEqual({ skipped: 'already applied' });
    expect(await balance('u1')).toBe(3000);
  });
  it('does nothing for an order that is not delivered', async () => {
    await seedLevels();
    const order = await deliveredOrder('u1', 4000);
    await Order.updateOne({ _id: order._id }, { status: 'shipped' });
    expect(await applyDeliveredOrder(order._id)).toEqual({ skipped: 'order is not delivered' });
    expect(await balance('u1')).toBe(0);
  });
  it('never pays more than the Points are worth, even if the config is wrong', async () => {
    await LevelConfig.create({ level: 1, threshold: 1, rewardPaisa: 1_000_000 }); // ৳10,000 পুরস্কার, কিন্তু মাত্র ৫ Point
    const order = await deliveredOrder('u1', 500);
    expect((await applyDeliveredOrder(order._id)).levelsCredited).toEqual([]);
    expect(await balance('u1')).toBe(0);
  });
  it('adds up across several orders', async () => {
    await seedLevels();
    await applyDeliveredOrder((await deliveredOrder('u1', 500, 'T1'))._id); // 5 Points → Level 2
    expect(await balance('u1')).toBe(300);
    await applyDeliveredOrder((await deliveredOrder('u1', 500, 'T2'))._id); // 10 Points → Level 3
    expect(await balance('u1')).toBe(700);
  });
});
