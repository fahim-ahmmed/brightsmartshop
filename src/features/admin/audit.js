import AuditLog from '@/models/AuditLog';

export async function audit(admin, action, entity, entityId = '', summary = '') {
  try {
    await AuditLog.create({ adminId: admin.id, adminName: admin.name, action, entity, entityId: String(entityId), summary: String(summary).slice(0, 300) });
  } catch (err) {
    console.error('[audit]', err.message);
  }
}
