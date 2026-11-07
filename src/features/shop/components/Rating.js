export default function Rating({ avg = 0, count = 0 }) {
  if (!count) {
    return (
      <p className="text-sm text-default-500">
        <span aria-hidden="true">☆☆☆☆☆</span> No reviews
      </p>
    );
  }
  const full = Math.round(avg);
  return (
    <p className="text-sm text-default-600">
      <span aria-hidden="true" className="text-warning">
        {'★'.repeat(full)}
        {'☆'.repeat(5 - full)}
      </span>{' '}
      <span className="sr-only">{avg.toFixed(1)} out of 5, </span>({count})
    </p>
  );
}
