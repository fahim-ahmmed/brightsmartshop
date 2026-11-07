import { ObjectId } from 'mongodb';
import { connectDB } from '@/lib/db';
import { escapeRegex, serialize } from '@/lib/utils';
import { db } from '@/lib/mongo-client';
import AuditLog from '@/models/AuditLog';
import Order from '@/models/Order';
import Product from '@/models/Product';
import Withdrawal from '@/models/Withdrawal';

export async function getAdminStats() {
  await connectDB();
  const since = new Date(Date.now() - 13 * 864e5);
  since.setHours(0, 0, 0, 0);
  const [users, orders, pendingOrders, revenue, pendingW, lowStock, daily] = await Promise.all([
    db.collection('user').countDocuments(),
    Order.countDocuments(),
    Order.countDocuments({ status: 'pending' }),
    Order.aggregate([{ $match: { status: 'delivered' } }, { $group: { _id: null, t: { $sum: '$totalPaisa' } } }]),
    Withdrawal.aggregate([{ $match: { status: 'pending' } }, { $group: { _id: null, n: { $sum: 1 }, t: { $sum: '$amountPaisa' } } }]),
    Product.countDocuments({ isActive: true, stock: { $lte: 5 } }),
    Order.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Dhaka' } }, n: { $sum: 1 } } },
    ]),
  ]);
  const byDay = Object.fromEntries(daily.map((d) => [d._id, d.n]));
  const days = Array.from({ length: 14 }, (_, i) => {
    const key = new Date(Date.now() - (13 - i) * 864e5).toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
    return { key, n: byDay[key] || 0 };
  });
  return {
    users, orders, pendingOrders, lowStock, days,
    revenuePaisa: revenue[0]?.t || 0,
    pendingWithdrawals: pendingW[0]?.n || 0,
    pendingWithdrawalPaisa: pendingW[0]?.t || 0,
  };
}

export const ORDERS_PER_PAGE = 20;

export async function getOrdersPage({ status = '', page = 1 }) {
  await connectDB();
  const filter = status ? { status } : {};
  const total = await Order.countDocuments(filter);
  const pages = Math.max(1, Math.ceil(total / ORDERS_PER_PAGE));
  const current = Math.min(Math.max(1, page), pages);
  const docs = await Order.find(filter).sort({ createdAt: -1 }).skip((current - 1) * ORDERS_PER_PAGE).limit(ORDERS_PER_PAGE).lean();
  return { orders: serialize(docs), total, page: current, pages };
}

export async function getOrderDetail(orderNo) {
  await connectDB();
  const doc = await Order.findOne({ orderNo }).lean();
  if (!doc) return null;
  let customer = null;
  if (ObjectId.isValid(doc.userId)) {
    const u = await db.collection('user').findOne({ _id: new ObjectId(doc.userId) }, { projection: { name: 1, email: 1, mobile: 1 } });
    if (u) customer = { name: u.name, email: u.email, mobile: u.mobile };
  }
  return { order: serialize(doc), customer };
}

export async function getWithdrawals(status = '') {
  await connectDB();
  const filter = status ? { status } : {};
  const docs = await Withdrawal.find(filter).sort({ createdAt: -1 }).limit(200).lean();
  const ids = [...new Set(docs.map((d) => d.userId).filter(ObjectId.isValid))].map((i) => new ObjectId(i));
  const users = ids.length ? await db.collection('user').find({ _id: { $in: ids } }, { projection: { name: 1, email: 1 } }).toArray() : [];
  const map = Object.fromEntries(users.map((u) => [String(u._id), u]));
  return serialize(docs).map((d) => ({ ...d, user: map[d.userId] ? { name: map[d.userId].name, email: map[d.userId].email } : null }));
}

export async function getUsers({ q = '', page = 1 }) {
  const per = 25;
  const filter = q ? { $or: ['name', 'email', 'mobile'].map((f) => ({ [f]: { $regex: escapeRegex(q), $options: 'i' } })) } : {};
  const col = db.collection('user');
  const total = await col.countDocuments(filter);
  const pages = Math.max(1, Math.ceil(total / per));
  const current = Math.min(Math.max(1, page), pages);
  const docs = await col.find(filter, { projection: { name: 1, email: 1, mobile: 1, role: 1, createdAt: 1 } }).sort({ createdAt: -1 }).skip((current - 1) * per).limit(per).toArray();
  return { users: docs.map((u) => ({ id: String(u._id), name: u.name, email: u.email, mobile: u.mobile || '', role: u.role || 'user', createdAt: u.createdAt })), total, page: current, pages };
}

export async function getAuditLog() {
  await connectDB();
  return serialize(await AuditLog.find().sort({ createdAt: -1 }).limit(150).lean());
}
