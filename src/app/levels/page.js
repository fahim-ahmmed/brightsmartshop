import React from "react";
import DashboardSidebar from "@/components/layout/DashboardSidebar";

export const metadata = {
  title: "Customer Benefit Levels | Bright Smart Shop",
};

export default function LevelsPage() {
  // 24 Levels Data according to screenshot specification
  const levelsData = [
    { level: 1, package: "3", taka: "00", designation: "Preferred Customer" },
    { level: 2, package: "5", taka: "03", designation: "" },
    { level: 3, package: "9", taka: "04", designation: "" },
    { level: 4, package: "16", taka: "08", designation: "" },
    { level: 5, package: "33", taka: "15", designation: "General Customer" },
    { level: 6, package: "65", taka: "32", designation: "" },
    { level: 7, package: "129", taka: "60", designation: "" },
    { level: 8, package: "257", taka: "100", designation: "" },
    { level: 9, package: "513", taka: "250", designation: "" },
    { level: 10, package: "1025", taka: "510", designation: "Regular Customer" },
    { level: 11, package: "2049", taka: "1025", designation: "" },
    { level: 12, package: "4097", taka: "2050", designation: "" },
    { level: 13, package: "8193", taka: "4050", designation: "" },
    { level: 14, package: "16385", taka: "8200", designation: "" },
    { level: 15, package: "32769", taka: "16000", designation: "Special Customer" },
    { level: 16, package: "65537", taka: "30000", designation: "" },
    { level: 17, package: "131073", taka: "65000", designation: "Silver Customer" },
    { level: 18, package: "262145", taka: "100000", designation: "" },
    { level: 19, package: "524289", taka: "250000", designation: "Gold Customer" },
    { level: 20, package: "1048577", taka: "350000", designation: "" },
    { level: 21, package: "2097153", taka: "800000", designation: "Diamond Customer" },
    { level: 22, package: "4194305", taka: "1500000", designation: "Platinum Customer" },
    { level: 23, package: "8388609", taka: "2000000", designation: "Royel Customer" },
    { level: 24, package: "16777217", taka: "5000000", designation: "Crown Customer" },
  ];

  // Current level dummy (Change according to DB session)
  const currentLevel = 1;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col lg:flex-row">
      <DashboardSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1200px] mx-auto">
        
        {/* Header Title */}
        <div className="bg-slate-800/80 p-6 rounded-3xl border border-slate-700/60 shadow-lg space-y-2">
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
            CUSTOMER BENEFIT PROGRAM
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            How Will Customers Benefits
          </h1>
          <p className="text-xs text-slate-400">
            Earn level upgrades based on your own purchase points and unlock level-up cashback benefits.
          </p>

          {/* Progress Bar Card */}
          <div className="pt-4 space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-emerald-400">Current Level: Level {currentLevel}</span>
              <span className="text-slate-400">Target for Level {currentLevel + 1}: 5 Points</span>
            </div>
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full w-[20%]" />
            </div>
          </div>
        </div>

        {/* 24 Level Table Structure */}
        <div className="bg-slate-800/60 rounded-3xl border border-slate-700/60 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-950 text-slate-300 uppercase font-black tracking-wider text-[11px] border-b border-slate-700">
                  <th className="py-4 px-6">Level</th>
                  <th className="py-4 px-6">Package Target</th>
                  <th className="py-4 px-6">Taka (Cashback)</th>
                  <th className="py-4 px-6">Designation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {levelsData.map((row) => {
                  const isCurrent = row.level === currentLevel;
                  return (
                    <tr
                      key={row.level}
                      className={`transition-colors ${
                        isCurrent
                          ? "bg-emerald-950/60 text-emerald-300 font-bold border-l-4 border-l-emerald-400"
                          : "hover:bg-slate-800/80 text-slate-300"
                      }`}
                    >
                      <td className="py-3.5 px-6 font-bold">{row.level}</td>
                      <td className="py-3.5 px-6 font-mono text-slate-200">{row.package}</td>
                      <td className="py-3.5 px-6 font-extrabold text-emerald-400">৳ {row.taka}</td>
                      <td className="py-3.5 px-6 font-semibold">
                        {row.designation ? (
                          <span className="px-3 py-1 bg-slate-900 border border-slate-700 rounded-full text-xs text-amber-400 font-bold">
                            {row.designation}
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}