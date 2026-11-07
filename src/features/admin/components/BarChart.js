// সরল বার চার্ট (সার্ভারে আঁকা)। স্ক্রিন রিডারের জন্য প্রতিটি বারের লেখা আছে।
export default function BarChart({ data, label }) {
  const max = Math.max(1, ...data.map((d) => d.n));
  return (
    <figure>
      <figcaption className="mb-3 font-semibold">{label}</figcaption>
      <ul className="flex h-40 items-end gap-1.5">
        {data.map((d) => (
          <li key={d.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
            <span className="text-xs text-default-600">{d.n}</span>
            <span className="w-full rounded-t bg-primary" style={{ height: `${(d.n / max) * 100}%`, minHeight: d.n ? 4 : 1 }} />
            <span className="sr-only">{d.key}: {d.n} orders</span>
            <span aria-hidden="true" className="text-[10px] text-default-500">{d.key.slice(8)}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
