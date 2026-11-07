import mongoose from 'mongoose';
import Notification from '../src/models/Notification.js';

await mongoose.connect(process.env.MONGODB_URI);
await Notification.updateMany({}, { isActive: false });
await Notification.create({
  message: 'Welcome to Bright Smart Shop. Shop quality products and earn Points.',
  linkUrl: '/shop',
  linkLabel: 'Shop now',
  isActive: true,
});
console.log('নোটিফিকেশন যোগ হয়েছে');
await mongoose.disconnect();
