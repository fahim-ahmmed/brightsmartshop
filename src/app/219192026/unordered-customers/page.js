"use client";

import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function UnorderedCustomersPage() {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({
    currentDay: 1,
    currentMonthName: "",
    totalRegisteredUsers: 0,
    totalDefaulters: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchDefaulters = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/unordered-users", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setMeta({
          currentDay: data.currentDay,
          currentMonthName: data.currentMonthName,
          totalRegisteredUsers: data.totalRegisteredUsers || 0,
          totalDefaulters: data.totalDefaulters || 0,
        });
      } else {
        toast.error("তালিকা লোড করতে সমস্যা হয়েছে!");
      }
    } catch (err) {
      console.error(err);
      toast.error("নেটওয়ার্ক সমস্যা!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDefaulters();
  }, []);

  // নাম, ফোন বা ইমেইল দিয়ে সার্চ ফিল্টার
  const filteredUsers = users.filter((u) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      u.name?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.address?.toLowerCase().includes(q)
    );
  });

  const copyToClipboard = (text, label) => {
    if (!text || text === "N/A") return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} কপি করা হয়েছে: ${text}`);
  };

  return (
    <main className="space-y-6 font-sans text-slate-100 pb-12">
      <Toaster position="top-right" />

      {/* টপ হেডার ও রুলস স্ট্যাটাস */}
      <div className="bg-[#1E293B] p-6 rounded-3xl border border-slate-800 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[10px] font-black uppercase rounded-full">
              Monthly 40-Point Rule
            </span>
            <span className="text-xs font-bold text-slate-400">
              ({meta.currentMonthName})
            </span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">
            Unordered Customers (Defaulter List)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            চলতি মাসের ১ তারিখ থেকে যারা এখনো অন্তত ১টি প্যাকেজ (৪০ পয়েন্ট) অর্ডার সম্পন্ন করেনি তাদের তালিকা। অর্ডার করলেই নাম এই তালিকা থেকে স্বয়ংক্রিয়ভাবে বাদ হয়ে যাবে।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-[#0F172A] px-4 py-2.5 rounded-2xl border border-slate-700 text-center">
            <span className="text-[10px] font-bold text-slate-400 block">Total Users</span>
            <span className="text-sm font-black text-white">{meta.totalRegisteredUsers} জন</span>
          </div>

          <div className="bg-rose-500/10 px-4 py-2.5 rounded-2xl border border-rose-500/30 text-center">
            <span className="text-[10px] font-bold text-rose-300 block">Unordered (Remaining)</span>
            <span className="text-sm font-black text-rose-400">{meta.totalDefaulters} জন</span>
          </div>

          <button
            onClick={() => fetchDefaulters()}
            className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl transition-all cursor-pointer shadow-md"
          >
            🔄 রিফ্রেশ
          </button>
        </div>
      </div>

      {/* সার্চ ও ফিল্টার বার */}
      <div className="bg-[#1E293B] p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="নাম, ফোন নাম্বার বা ইমেইল দিয়ে খুঁজুন..."
            className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="text-xs text-slate-400 font-bold">
          প্রদর্শিত হচ্ছে: <span className="text-white font-black">{filteredUsers.length}</span> জন ইউজার
        </div>
      </div>

      {/* ইউজার টেবিল */}
      <div className="bg-[#1E293B] rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs font-bold text-emerald-400 animate-pulse">
            ডাটাবেস থেকে ইউজারদের অর্ডার স্ট্যাটাস যাচাই করা হচ্ছে...
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#0F172A] border-b border-slate-800 text-slate-400 uppercase font-black text-[10px] tracking-wider">
                  <th className="py-4 px-5">#</th>
                  <th className="py-4 px-5">User Info (নাম ও রেফারেল)</th>
                  <th className="py-4 px-5">Phone Number</th>
                  <th className="py-4 px-5">Email Address</th>
                  <th className="py-4 px-5">Address & Details</th>
                  <th className="py-4 px-5 text-center whitespace-nowrap">This Month Points</th>
                  <th className="py-4 px-5 text-right whitespace-nowrap">Quick Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {filteredUsers.map((u, idx) => (
                  <tr key={u._id || idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-5 font-mono text-slate-400 font-bold">
                      {idx + 1}
                    </td>

                    {/* নাম ও সাইন-আপ তারিখ */}
                    <td className="py-4 px-5">
                      <p className="font-black text-white text-sm whitespace-nowrap">{u.name}</p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 whitespace-nowrap">
                        <span>Joined: {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"}</span>
                        {u.referralId !== "N/A" && (
                          <span className="bg-slate-800 text-amber-300 px-2 py-0.5 rounded border border-slate-700 font-mono">
                            Ref: {u.referralId}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* ফোন নাম্বার (কপি বাটন সহ) */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-emerald-400 text-xs">
                          {u.phone}
                        </span>
                        {u.phone !== "N/A" && (
                          <button
                            onClick={() => copyToClipboard(u.phone, "ফোন নাম্বার")}
                            title="কপি করুন"
                            className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] cursor-pointer"
                          >
                            📋
                          </button>
                        )}
                      </div>
                    </td>

                    {/* ইমেইল অ্যাড্রেস */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-200 font-medium">{u.email}</span>
                        {u.email !== "N/A" && (
                          <button
                            onClick={() => copyToClipboard(u.email, "ইমেইল")}
                            title="কপি করুন"
                            className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] cursor-pointer"
                          >
                            📋
                          </button>
                        )}
                      </div>
                    </td>

                    {/* ঠিকানা ও লেভেল */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      <p className="text-slate-300 max-w-[200px] truncate" title={u.address}>
                        📍 {u.address}
                      </p>
                      <span className="text-[10px] text-slate-400 font-bold">
                        Level: {u.level} | Wallet: ৳{u.walletBalance}
                      </span>
                    </td>

                    {/* পয়েন্ট স্ট্যাটাস */}
                    <td className="py-4 px-5 text-center whitespace-nowrap">
                      <span className="inline-block whitespace-nowrap px-3 py-1 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-full font-black text-[10px]">
                        {u.earnedPointsThisPeriod} / 40 Pts
                      </span>
                      <span className="block whitespace-nowrap text-[9px] text-slate-400 mt-1">
                        বাকি: {u.shortfallPoints} পয়েন্ট
                      </span>
                    </td>

                    {/* সরাসরি কল বা ইমেইল বাটন */}
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {u.phone !== "N/A" && (
                          <a
                            href={`tel:${u.phone}`}
                            className="inline-flex items-center gap-1 whitespace-nowrap px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 rounded-xl font-bold text-[10px] transition-all"
                          >
                            📞 Call
                          </a>
                        )}
                        {u.email !== "N/A" && (
                          <a
                            href={`mailto:${u.email}`}
                            className="inline-flex items-center gap-1 whitespace-nowrap px-2.5 py-1.5 bg-sky-500/10 hover:bg-sky-600 text-sky-400 hover:text-white border border-sky-500/30 rounded-xl font-bold text-[10px] transition-all"
                          >
                            ✉️ Email
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center space-y-2">
            <div className="text-4xl">🎉</div>
            <h3 className="text-base font-black text-white">
              চলতি মাসে সবাই অর্ডার সম্পন্ন করেছে!
            </h3>
            <p className="text-xs text-slate-400">
              এই মাসে কোনো আন-অর্ডার্ড ইউজার বাকি নেই। পরবর্তী মাসের ১ তারিখে আবার নতুন তালিকা শুরু হবে।
            </p>
          </div>
        )}
      </div>
    </main>
  );
}