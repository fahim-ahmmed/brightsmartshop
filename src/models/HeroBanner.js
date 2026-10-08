import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    image: { type: String, required: true },
    alt: { type: String, default: 'Bright Smart Shop banner' },
    linkUrl: { type: String, default: '' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.HeroBanner || mongoose.model('HeroBanner', schema);
