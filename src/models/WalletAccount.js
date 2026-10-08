import mongoose from 'mongoose';

// প্রতি ইউজারের বর্তমান ব্যালেন্স (পয়সায়)। সত্যের উৎস WalletLedger; এটা দ্রুত ও atomic পরীক্ষার জন্য।
const schema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    balancePaisa: { type: Number, default: 0, min: 0, validate: Number.isInteger },
  },
  { timestamps: true }
);

export default mongoose.models.WalletAccount || mongoose.model('WalletAccount', schema);
