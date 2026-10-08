// পুরোনো সাইটের ছবি Cloudinary-তে সরায় ও ডেটাবেসের লিংক বদলায়। ডোমেইন পরিবর্তনের আগে একবার চালান।
import mongoose from 'mongoose';
import Product from '../src/models/Product.js';
import Category from '../src/models/Category.js';
import HeroBanner from '../src/models/HeroBanner.js';
import TeamMember from '../src/models/TeamMember.js';
import { uploadImage } from '../src/lib/cloudinary.js';

const OLD = 'https://www.brightsmartshop24.com/';
const moved = new Map();
async function move(url) {
  if (!url?.startsWith(OLD)) return url;
  if (!moved.has(url)) moved.set(url, await uploadImage(url));
  return moved.get(url);
}

await mongoose.connect(process.env.MONGODB_URI);
let n = 0;
for (const p of await Product.find({ images: { $regex: '^' + OLD } })) { p.images = await Promise.all(p.images.map(move)); await p.save(); n++; }
for (const c of await Category.find({ image: { $regex: '^' + OLD } })) { c.image = await move(c.image); await c.save(); n++; }
for (const b of await HeroBanner.find({ image: { $regex: '^' + OLD } })) { b.image = await move(b.image); await b.save(); n++; }
for (const t of await TeamMember.find({ photo: { $regex: '^' + OLD } })) { t.photo = await move(t.photo); await t.save(); n++; }
console.log(`${n}টি রেকর্ড আপডেট, ${moved.size}টি ছবি সরানো হয়েছে`);
await mongoose.disconnect();
