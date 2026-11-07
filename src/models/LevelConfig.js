import mongoose from 'mongoose';

// Level টেবিল (২৪ লেভেল) অ্যাডমিন থেকে বদলানো যাবে; মান বসানো হবে ভাগ ৪-এ
const schema = new mongoose.Schema(
  {
    level: { type: Number, required: true, unique: true, min: 1 },
    threshold: { type: Number, required: true, min: 0 }, // "Package" কলাম
    rewardPaisa: { type: Number, default: 0, min: 0 }, // "Taka" কলাম, পয়সায়
    designation: { type: String, default: '' }, // Preferred Customer, General Customer ...
  },
  { timestamps: true }
);

export default mongoose.models.LevelConfig || mongoose.model('LevelConfig', schema);
