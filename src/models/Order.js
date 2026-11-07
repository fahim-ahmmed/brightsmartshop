import mongoose from 'mongoose';

// অর্ডার করার মুহূর্তের দাম ও Point snapshot হিসেবে রাখা হয়
const itemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: String,
    image: String,
    pricePaisa: { type: Number, required: true },
    pointsX100: { type: Number, default: 0 },
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const schema = new mongoose.Schema(
  {
    orderNo: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true }, // Better Auth user id
    items: { type: [itemSchema], validate: (v) => v.length > 0 },
    totalPaisa: { type: Number, required: true },
    totalPointsX100: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
      index: true,
    },
    paymentMethod: { type: String, enum: ['cod'], default: 'cod' },
    shipping: { name: String, mobile: String, address: String },
    deliveredAt: Date,
    rewardsApplied: { type: Boolean, default: false }, // Point/ক্যাশব্যাক দুবার যোগ ঠেকাতে
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model('Order', schema);
