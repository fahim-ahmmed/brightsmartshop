"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import toast from "react-hot-toast";

const ACCENT = {
  purchase: {
    chip: "bg-rose-500/10 border-rose-500/30 text-rose-400",
    btn: "bg-rose-600 hover:bg-rose-500",
    amount: "text-rose-400",
  },
  profit: {
    chip: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
    btn: "bg-emerald-600 hover:bg-emerald-500",
    amount: "text-emerald-400",
  },
};

const pad = (n) => String(n).padStart(2, "0");
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const thisMonth = () => todayStr().slice(0, 7);
const showDate = (s) => {
  const [y, m, d] = String(s).split("-");
  return `${d}/${m}/${y}`;
};
const taka = (n) =>
  `৳${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export default function LedgerPage({ type, title, subtitle }) {
  const ac = ACCENT[type] || ACCENT.purchase;

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [month, setMonth] = useState(thisMonth()); // খালি = সব মাস
  const [form, setForm] = useState({ name: "", date: todayStr(), amount: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = `type=${type}${month ? `&month=${month}` : ""}`;
      const res = await fetch(`/api/admin/ledger?${q}`, { cache: "no-store" });
      if (res.status === 401) {
        toast.error("অ্যাডমিন হিসেবে লগইন নেই");
        setEntries([]);
        return;
      }
      const data = await res.json();
      setEntries(data.entries || []);
    } catch (err) {
      console.error(err);
      toast.error("ডাটা আনা যায়নি");
    } finally {
      setLoading(false);
    }
  }, [type, month]);

  useEffect(() => {
    load();
  }, [load]);

  const total = useMemo(() => entries.reduce((s, e) => s + Number(e.amount || 0), 0), [entries]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, ...form }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("এন্ট্রি যোগ হয়েছে");
        setForm({ name: "", date: form.date, amount: "" });
        load();
      } else {
        toast.error(data.message || "সেভ হয়নি");
      }
    } catch (err) {
      console.error(err);
      toast.error("সার্ভারে সমস্যা");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entry) => {
    if (!confirm(`"${entry.name}" (${taka(entry.amount)}) মুছে ফেলবেন?`)) return;
    try {
      const res = await fetch(`/api/admin/ledger?id=${entry.id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        setEntries((list) => list.filter((x) => x.id !== entry.id));
        toast.success("মুছে ফেলা হয়েছে");
      } else {
        toast.error(data.message || "মোছা যায়নি");
      }
    } catch (err) {
      console.error(err);
      toast.error("সার্ভারে সমস্যা");
    }
  };

  const handleClear = async () => {
    if (entries.length === 0) {
      toast.error("মোছার মতো কোনো এন্ট্রি নেই");
      return;
    }
    const scopeText = month ? `${month} মাসের` : "সব মাসের";
    if (!confirm(`${scopeText} সবগুলো (${entries.length}টি) এন্ট্রি মুছে ফেলবেন? এটা ফেরানো যাবে না।`)) return;
    try {
      const q = `type=${type}&clear=1${month ? `&month=${month}` : ""}`;
      const res = await fetch(`/api/admin/ledger?${q}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`${data.deleted}টি এন্ট্রি মুছে ফেলা হয়েছে`);
        load();
      } else {
        toast.error(data.message || "ক্লিয়ার হয়নি");
      }
    } catch (err) {
      console.error(err);
      toast.error("সার্ভারে সমস্যা");
    }
  };

  const inputCls =
    "w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500";

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="bg-[#1E293B] p-6 rounded-3xl border border-slate-800 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">{title}</h1>
          <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={() => setMonth("")}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
          >
            সব মাস
          </button>
          <button
            onClick={handleClear}
            className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs rounded-xl border border-rose-500/20 cursor-pointer"
          >
            🗑 সব ক্লিয়ার
          </button>
          <span className={`text-sm font-black border px-4 py-2 rounded-xl ${ac.chip}`}>
            মোট: {taka(total)}
          </span>
        </div>
      </div>

      {/* Add Form */}
      <form
        onSubmit={handleAdd}
        className="bg-[#1E293B] p-5 rounded-3xl border border-slate-800 grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto] gap-3 items-end"
      >
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-300">প্রোডাক্ট / নোটের নাম *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="যেমন: চাল ৫০ কেজি"
            maxLength={200}
            required
            className={inputCls}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-300">তারিখ *</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
            className={inputCls}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-300">টাকা (BDT) *</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="0"
            required
            className={`${inputCls} font-mono`}
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className={`px-6 py-2.5 ${ac.btn} disabled:bg-slate-700 text-white font-black text-xs rounded-xl shadow-lg cursor-pointer`}
        >
          {saving ? "সেভ হচ্ছে..." : "➕ যোগ করুন"}
        </button>
      </form>

      {/* Table */}
      <div className="bg-[#1E293B] p-6 rounded-3xl border border-slate-800 shadow-xl">
        {loading ? (
          <div className="py-12 text-center text-xs font-bold text-emerald-400 animate-pulse">লোড হচ্ছে...</div>
        ) : entries.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <div className="text-4xl">📒</div>
            <p className="text-xs text-slate-400">
              {month ? `${month} মাসে কোনো এন্ট্রি নেই।` : "কোনো এন্ট্রি নেই।"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3">SL</th>
                  <th className="py-3">তারিখ</th>
                  <th className="py-3">নাম / নোট</th>
                  <th className="py-3 text-right">টাকা</th>
                  <th className="py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {entries.map((e, idx) => (
                  <tr key={e.id} className="hover:bg-slate-800/60 transition-colors">
                    <td className="py-3 text-slate-500 font-mono">{idx + 1}</td>
                    <td className="py-3 text-slate-300 font-mono">{showDate(e.date)}</td>
                    <td className="py-3 font-bold text-white">{e.name}</td>
                    <td className={`py-3 text-right font-mono font-black ${ac.amount}`}>{taka(e.amount)}</td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleDelete(e)}
                        className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-[11px] rounded-xl border border-rose-500/20 cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-700">
                  <td colSpan={3} className="py-3 text-right font-black text-slate-300">
                    মোট ({entries.length}টি এন্ট্রি)
                  </td>
                  <td className={`py-3 text-right font-mono font-black text-sm ${ac.amount}`}>{taka(total)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}