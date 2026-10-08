const MAP = {
  pending: ['Pending', 'bg-warning-100 text-warning-700'],
  confirmed: ['Confirmed', 'bg-primary-100 text-primary-700'],
  shipped: ['Shipped', 'bg-secondary-100 text-secondary-700'],
  delivered: ['Delivered', 'bg-success-100 text-success-700'],
  cancelled: ['Cancelled', 'bg-danger-100 text-danger-700'],
};

export default function OrderStatusBadge({ status }) {
  const [label, cls] = MAP[status] || [status, 'bg-default-100'];
  return <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>{label}</span>;
}
