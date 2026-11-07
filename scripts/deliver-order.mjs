// পরীক্ষার জন্য: একটি অর্ডারকে Delivered করে Level পুরস্কার প্রয়োগ করে (অ্যাডমিন প্যানেল ভাগ ৫-এ আসবে)
import mongoose from 'mongoose';
import Order from '../src/models/Order.js';
import { applyDeliveredOrder } from '../src/features/wallet/rewards.js';

const orderNo = process.argv[2];
if (!orderNo) {
  console.error('ব্যবহার: npm run deliver-order -- BSS-XXXXXXXX');
  process.exit(1);
}
await mongoose.connect(process.env.MONGODB_URI);
const order = await Order.findOneAndUpdate({ orderNo }, { $set: { status: 'delivered', deliveredAt: new Date() } }, { new: true });
if (!order) console.log('অর্ডার পাওয়া যায়নি');
else console.log(await applyDeliveredOrder(order._id));
await mongoose.disconnect();
