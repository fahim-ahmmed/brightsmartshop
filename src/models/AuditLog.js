import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    adminId: { type: String, required: true, index: true },
    adminName: { type: String, default: '' },
    action: { type: String, required: true }, // create | update | delete | order_status | withdrawal | role ...
    entity: { type: String, required: true },
    entityId: { type: String, default: '' },
    summary: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
schema.index({ createdAt: -1 });

export default mongoose.models.AuditLog || mongoose.model('AuditLog', schema);
