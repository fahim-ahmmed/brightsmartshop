export default function LevelTable({ levels, currentLevel = 0 }) {
  let designation = '';
  const rows = levels.map((l) => {
    const starts = !!l.designation;
    if (starts) designation = l.designation;
    return { ...l, starts, designation };
  });
  const num = (n) => Number(n).toLocaleString('en-US');

  return (
    <div className="overflow-x-auto rounded-2xl border border-divider">
      <table className="w-full min-w-[32rem] border-collapse text-center">
        <caption className="sr-only">Level, package, taka and designation</caption>
        <thead className="bg-content2">
          <tr>
            {['Level', 'Package', 'Taka', 'Designation'].map((h) => (
              <th key={h} scope="col" className="border-b border-divider px-4 py-3 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const mine = r.level === currentLevel;
            return (
              <tr key={r.level} aria-current={mine ? 'true' : undefined} className={mine ? 'bg-primary-50 font-semibold' : ''}>
                <th scope="row" className="border-b border-divider px-4 py-2 font-medium">
                  {r.level}
                  {mine && <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">You</span>}
                </th>
                <td className="border-b border-divider px-4 py-2">{num(r.threshold)}</td>
                <td className="border-b border-divider px-4 py-2">{num(r.rewardPaisa / 100)}</td>
                <td className="border-b border-divider px-4 py-2">{r.starts ? r.designation : ''}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
