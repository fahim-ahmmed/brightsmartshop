import mongoose from 'mongoose';

/**
 * Append-only খাতা: একবার লিখলে আর বদলানো বা মোছা যাবে না।
 * balance = সব credit/release − সব debit/hold (ভাগ ৪-এ হিসাব হবে)।
 */
const schema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: ['credit', 'debit', 'hold', 'release'], required: true },
    reason: {
      type: String,
      enum: ['order_reward', 'level_reward', 'withdraw_request', 'withdraw_paid', 'withdraw_rejected', 'adjustment'],
      required: true,
    },
    amountPaisa: { type: Number, required: true, min: 1, validate: Number.isInteger },
    pointsX100: { type: Number, default: 0 },
    refType: { type: String, required: true }, // 'order' | 'withdrawal' | 'level' ...
    refId: { type: String, required: true },
    note: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// একই কারণে একই রেফারেন্সে দুবার এন্ট্রি হবে না (idempotency)
schema.index({ userId: 1, reason: 1, refType: 1, refId: 1 }, { unique: true });

const blocked = ['updateOne', 'updateMany', 'findOneAndUpdate', 'findOneAndReplace', 'replaceOne', 'deleteOne', 'deleteMany', 'findOneAndDelete'];
schema.pre(blocked, function () {
  throw new Error('WalletLedger অপরিবর্তনীয়: এন্ট্রি বদলানো বা মোছা যাবে না');
});
schema.pre('save', function (next) {
  if (!this.isNew) return next(new Error('WalletLedger অপরিবর্তনীয়'));
  next();
});

export default mongoose.models.WalletLedger || mongoose.model('WalletLedger', schema);
