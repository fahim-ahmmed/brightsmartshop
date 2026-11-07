import { connectDB } from '@/lib/db';
import { serialize } from '@/lib/utils';
import Order from '@/models/Order';

export async function getUserOrders(userId) {
  await connectDB();
  const docs = await Order.find({ userId }).sort({ createdAt: -1 }).limit(100).lean();
  return serialize(docs);
}

// অন্য ইউজারের অর্ডার দেখা যাবে না: userId মিলতেই হবে
export async function getOrderForUser(userId, orderNo) {
  await connectDB();
  const doc = await Order.findOne({ userId, orderNo }).lean();
  return doc ? serialize(doc) : null;
}
