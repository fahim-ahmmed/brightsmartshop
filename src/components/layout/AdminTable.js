// অ্যাডমিনের সব টেবিলের জন্য একই কাঠামো (স্ক্রিন রিডার-বান্ধব, মোবাইলে অনুভূমিক স্ক্রল)
export default function AdminTable({ caption, headers, children, empty = 'Nothing here yet.' }) {
  const hasRows = Array.isArray(children) ? children.length > 0 : !!children;
  return (
    <div className="overflow-x-auto rounded-2xl border border-divider bg-content1">
      <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-content2">
          <tr>
            {headers.map((h) => (
              <th key={h} scope="col" className="border-b border-divider px-4 py-3 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {!hasRows && <p className="p-6 text-center text-default-600">{empty}</p>}
    </div>
  );
}
