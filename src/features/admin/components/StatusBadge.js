'use client';

import { Label } from '@gravity-ui/uikit';

const THEME = { pending: 'warning', confirmed: 'info', shipped: 'info', delivered: 'success', cancelled: 'danger', approved: 'info', paid: 'success', rejected: 'danger', admin: 'info', user: 'normal' };

export default function StatusBadge({ status }) {
  return <Label theme={THEME[status] || 'normal'}>{status}</Label>;
}
