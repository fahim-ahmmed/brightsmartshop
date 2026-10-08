const ITEMS = [
  ['🚚', 'Fast delivery', 'Right at your doorstep'],
  ['💰', 'Cash on delivery', 'Pay safely when you receive'],
  ['✅', 'Genuine products', 'Quality you can trust'],
  ['🎁', 'Earn Point', 'Get more value every time'],
];

export default function FeatureStrip() {
  return (
    <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {ITEMS.map(([icon, title, text]) => (
        <li key={title} className="flex items-center gap-3 rounded-xl bg-content2 p-4">
          <span aria-hidden="true" className="text-2xl">
            {icon}
          </span>
          <span>
            <strong className="block">{title}</strong>
            <span className="text-sm text-default-600">{text}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
