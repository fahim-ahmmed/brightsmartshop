import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    amountPaisa: { type: Number, required: true, min: 1, validate: Number.isInteger },
    method: { type: String, enum: ['bkash', 'nagad'], required: true },
    accountNumber: { type: String, required: true, trim: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'paid'], default: 'pending', index: true },
    adminNote: { type: String, default: '' },
    processedBy: { type: String, default: '' },
    processedAt: Date,
  },
  { timestamps: true }
);

// একজন ইউজারের একসাথে একটাই pending রিকোয়েস্ট থাকতে পারবে (ডেটাবেস নিজেই নিশ্চিত করে)
schema.index({ userId: 1 }, { unique: true, partialFilterExpression: { status: 'pending' } });

export default mongoose.models.Withdrawal || mongoose.model('Withdrawal', schema);
