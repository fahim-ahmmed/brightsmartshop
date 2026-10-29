"use client";

// প্রতিটি আইডির নিচে কয়টি প্যাকেজ এসেছে, সেই আইডির নিজস্ব লেভেল ও টাকা দেখায়
export default function ChainNodesList({ nodes = [] }) {
  if (!nodes.length) return null;

  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs space-y-4">
      <div className="border-b border-gray-100 pb-3">
        <span className="text-[10px] font-black text-[#00875A] uppercase tracking-widest block">
          MY CHAIN IDS
        </span>
        <h3 className="text-lg font-bold text-gray-900">আমার আইডিসমূহ ({nodes.length} টি)</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
              <th className="py-2">#</th>
              <th className="py-2">ID</th>
              <th className="py-2">ধরন</th>
              <th className="py-2">এর পরে প্যাকেজ</th>
              <th className="py-2">ধাপ</th>
              <th className="py-2 text-right">লেভেল</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {nodes.map((n, i) => (
              <tr key={n._id}>
                <td className="py-2.5 font-mono text-gray-500">{n.sequenceNo}</td>
                <td className="py-2.5 font-mono font-bold text-gray-800">{n.chainAccountId}</td>
                <td className="py-2.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      n.isManId ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {n.isManId ? "Man ID" : "Product ID"}
                  </span>
                </td>
                <td className="py-2.5 font-black text-[#00875A]">{n.accumulatedPackages}</td>
                <td className="py-2.5 text-gray-600">
                  {n.currentStepPackages} / {n.nextLevelTarget}
                </td>
                <td className="py-2.5 text-right font-black text-gray-900">Level {n.currentLevel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}