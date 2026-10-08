import mongoose from 'mongoose';

// pricePaisa: পয়সায় (৳340 = 34000) | pointsX100: Point ×100 (40 Point = 4000)
const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', index: true },
    description: { type: String, default: '' },
    images: { type: [String], default: [] },
    pricePaisa: { type: Number, required: true, min: 0, validate: Number.isInteger },
    pointsX100: { type: Number, default: 0, min: 0, validate: Number.isInteger },
    stock: { type: Number, default: 0, min: 0 },
    isPackage: { type: Boolean, default: false, index: true }, // "Our Packages"
    isFeatured: { type: Boolean, default: false, index: true }, // "Featured picks"
    isActive: { type: Boolean, default: true, index: true },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);
schema.index({ name: 'text' });

export default mongoose.models.Product || mongoose.model('Product', schema);
