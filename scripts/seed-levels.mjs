import mongoose from 'mongoose';
import LevelConfig from '../src/models/LevelConfig.js';

// আপনার টেবিল অনুযায়ী। threshold = নিজের Delivered অর্ডার থেকে জমা মোট Point, reward = Taka (একবারই)
const packages = [3, 5, 9, 16, 33, 65, 129, 257, 513, 1025, 2049, 4097, 8193, 16385, 32769, 65537, 131073, 262145, 524289, 1048577, 2097153, 4194305, 8388609, 16777217];
const taka = [0, 3, 4, 8, 15, 32, 60, 100, 250, 510, 1025, 2050, 4050, 8200, 16000, 30000, 65000, 100000, 250000, 350000, 800000, 1500000, 2000000, 5000000];
// যে লেভেলে নতুন Designation শুরু হয়; মাঝের লেভেলগুলো আগেরটাই পায়
const designations = { 1: 'Preferred Customer', 5: 'General Customer', 10: 'Regular Customer', 15: 'Special Customer', 17: 'Silver Customer', 19: 'Gold Customer', 21: 'Diamond Customer', 22: 'Platinum Customer', 23: 'Royal Customer', 24: 'Crown Customer' };

await mongoose.connect(process.env.MONGODB_URI);
for (let i = 0; i < 24; i++) {
  const level = i + 1;
  await LevelConfig.findOneAndUpdate(
    { level },
    { level, threshold: packages[i], rewardPaisa: taka[i] * 100, designation: designations[level] || '' },
    { upsert: true }
  );
}
console.log('২৪টি লেভেল সিড হয়েছে');
await mongoose.disconnect();
