import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    message: { type: String, required: true, trim: true, maxlength: 240 },
    linkUrl: { type: String, trim: true, default: '' },
    linkLabel: { type: String, trim: true, default: '' },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export default mongoose.models.Notification || mongoose.model('Notification', schema);
