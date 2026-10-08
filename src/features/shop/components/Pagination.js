import NextLink from 'next/link';

export default function Pagination({ page, pages, basePath, params = {} }) {
  if (pages <= 1) return null;
  const href = (p) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && sp.set(k, v));
    if (p > 1) sp.set('page', String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  const btn = 'rounded-lg border border-divider px-4 py-2 hover:border-primary';
  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-4">
      {page > 1 ? <NextLink href={href(page - 1)} className={btn}>← Previous</NextLink> : <span />}
      <span className="text-sm text-default-600">
        Page {page} of {pages}
      </span>
      {page < pages ? <NextLink href={href(page + 1)} className={btn}>Next →</NextLink> : <span />}
    </nav>
  );
}
