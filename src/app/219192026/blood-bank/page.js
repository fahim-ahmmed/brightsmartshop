"use client";

import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

const BLOOD_GROUPS = ["All", "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

export default function AdminBloodBankPage() {
  const [activeTab, setActiveTab] = useState("donors"); // "donors" | "requests"
  const [donors, setDonors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [donorGroupFilter, setDonorGroupFilter] = useState("All");
  const [donorSearch, setDonorSearch] = useState("");
  const [reqStatusFilter, setReqStatusFilter] = useState("All");

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [dRes, rRes] = await Promise.all([
        fetch("/api/blood-bank/donors?admin=true", { cache: "no-store" }),
        fetch("/api/blood-bank/requests", { cache: "no-store" }),
      ]);
      const dJson = await dRes.json();
      const rJson = await rRes.json();
      if (dJson.success) setDonors(dJson.donors || []);
      if (rJson.success) setRequests(rJson.requests || []);
    } catch (err) {
      toast.error("ব্লাড ব্যাংক ডাটা লোড করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleUpdateRequestStatus = async (id, status) => {
    try {
      const res = await fetch("/api/blood-bank/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success(data.message || "স্ট্যাটাস আপডেট হয়েছে!");
      await loadAll();
    } catch (err) {
      toast.error(err.message || "আপডেট করা যায়নি।");
    }
  };

  const handleDeleteRequest = async (id) => {
    if (!confirm("এই রক্তের রিকোয়েস্টটি মুছে ফেলতে চান?")) return;
    try {
      const res = await fetch(`/api/blood-bank/requests?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("রিকোয়েস্ট মুছে ফেলা হয়েছে।");
        setRequests((prev) => prev.filter((r) => r._id !== id));
      }
    } catch {
      toast.error("ডিলিট করতে সমস্যা হয়েছে।");
    }
  };

  const handleDeleteDonor = async (id) => {
    if (!confirm("এই ডোনারকে তালিকা থেকে মুছে ফেলতে চান?")) return;
    try {
      const res = await fetch(`/api/blood-bank/donors?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("ডোনার মুছে ফেলা হয়েছে।");
        setDonors((prev) => prev.filter((d) => d._id !== id));
      }
    } catch {
      toast.error("ডিলিট করতে সমস্যা হয়েছে।");
    }
  };

  const filteredDonors = donors.filter((d) => {
    const matchGroup = donorGroupFilter === "All" || d.bloodGroup === donorGroupFilter;
    const q = donorSearch.trim().toLowerCase();
    const matchSearch =
      !q ||
      String(d.name).toLowerCase().includes(q) ||
      String(d.address).toLowerCase().includes(q) ||
      String(d.phone).includes(q);
    return matchGroup && matchSearch;
  });

  const filteredRequests = requests.filter(
    (r) => reqStatusFilter === "All" || r.status === reqStatusFilter
  );

  const pendingCount = requests.filter((r) => r.status === "Pending").length;
  const urgentCount = requests.filter((r) => r.status === "Pending" && r.isUrgent).length;
  const eligibleDonorsCount = donors.filter((d) => d.isEligible).length;

  return (
    <div className="space-y-6 font-sans text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1E293B] border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <span>🩸</span> ব্লাড ব্যাংক ম্যানেজমেন্ট (Blood Bank)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            সকল রক্তদাতার হিস্ট্রি, ঠিকানা, ফোন নম্বর এবং রোগীদের রক্তের রিকোয়েস্ট এখান থেকে পরিচালনা করুন।
          </p>
        </div>

        <button
          type="button"
          onClick={loadAll}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl cursor-pointer self-start sm:self-auto"
        >
          🔄 রিফ্রেশ করুন
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1E293B] border border-slate-800 p-5 rounded-3xl">
          <span className="text-[10px] font-bold uppercase text-slate-400">মোট ডোনার</span>
          <p className="text-2xl font-black text-white mt-1">{donors.length}</p>
        </div>
        <div className="bg-[#1E293B] border border-emerald-500/30 p-5 rounded-3xl">
          <span className="text-[10px] font-bold uppercase text-emerald-400">রক্তদানে প্রস্তুত</span>
          <p className="text-2xl font-black text-emerald-400 mt-1">{eligibleDonorsCount}</p>
        </div>
        <div className="bg-[#1E293B] border border-amber-500/30 p-5 rounded-3xl">
          <span className="text-[10px] font-bold uppercase text-amber-400">পেন্ডিং রিকোয়েস্ট</span>
          <p className="text-2xl font-black text-amber-400 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-[#1E293B] border border-red-500/40 p-5 rounded-3xl">
          <span className="text-[10px] font-bold uppercase text-red-400">জরুরি (Urgent)</span>
          <p className="text-2xl font-black text-red-400 mt-1">{urgentCount}</p>
        </div>
      </div>

      {/* ২টি প্রধান অপশন ট্যাব: ১. ব্লাড ব্যাংক ডোনার, ২. ব্লাড রিকোয়েস্ট */}
      <div className="flex flex-wrap gap-3 bg-[#1E293B] p-2 rounded-2xl border border-slate-800 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("donors")}
          className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === "donors"
              ? "bg-red-600 text-white shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          🩸 ব্লাড ব্যাংক ডোনার ({donors.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("requests")}
          className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "requests"
              ? "bg-red-600 text-white shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <span>📩 রক্তের রিকোয়েস্ট ({requests.length})</span>
          {pendingCount > 0 && (
            <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-black">
              {pendingCount} New
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm font-bold text-emerald-400 animate-pulse">
          ডাটা লোড হচ্ছে...
        </div>
      ) : activeTab === "donors" ? (
        /* ================= TAB 1: BLOOD BANK DONORS ================= */
        <div className="bg-[#1E293B] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {BLOOD_GROUPS.map((bg) => (
                <button
                  key={bg}
                  type="button"
                  onClick={() => setDonorGroupFilter(bg)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    donorGroupFilter === bg
                      ? "bg-red-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {bg}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={donorSearch}
              onChange={(e) => setDonorSearch(e.target.value)}
              placeholder="ডোনারের নাম, ফোন বা ঠিকানা খুঁজুন..."
              className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[720px]">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="py-3 px-3">রক্তের গ্রুপ</th>
                  <th className="py-3 px-3">ডোনারের নাম ও হিস্ট্রি</th>
                  <th className="py-3 px-3">ফোন নম্বর</th>
                  <th className="py-3 px-3">ঠিকানা</th>
                  <th className="py-3 px-3">শেষ রক্তদান</th>
                  <th className="py-3 px-3">বর্তমান অবস্থা</th>
                  <th className="py-3 px-3 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredDonors.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-10 text-center text-slate-400">
                      কোনো ডোনার পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  filteredDonors.map((d) => (
                    <tr key={d._id} className="hover:bg-slate-800/40">
                      <td className="py-3.5 px-3">
                        <span className="inline-block bg-red-600 text-white font-black px-3 py-1 rounded-lg">
                          {d.bloodGroup}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-bold text-white">
                        {d.name}
                        <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
                          মোট রক্তদান: {d.totalDonations || 0} বার
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-emerald-400">
                        <a href={`tel:${d.phone}`} className="hover:underline">
                          📞 {d.phone}
                        </a>
                      </td>
                      <td className="py-3.5 px-3 text-slate-300">{d.address}</td>
                      <td className="py-3.5 px-3 text-slate-300">
                        {d.lastDonationDate
                          ? new Date(d.lastDonationDate).toLocaleDateString("bn-BD")
                          : "কখনো দেননি / নতুন"}
                      </td>
                      <td className="py-3.5 px-3">
                        {d.isEligible ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            🟢 রক্তদানে প্রস্তুত
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            🟡 বিশ্রামে ({d.daysRemaining} দিন বাকি)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteDonor(d._id)}
                          className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          🗑️ মুছুন
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ================= TAB 2: BLOOD REQUESTS ================= */
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {["All", "Pending", "Approved", "Completed", "Rejected"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setReqStatusFilter(st)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold cursor-pointer ${
                  reqStatusFilter === st
                    ? "bg-red-600 text-white"
                    : "bg-[#1E293B] border border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {filteredRequests.length === 0 ? (
            <div className="bg-[#1E293B] border border-slate-800 rounded-3xl p-12 text-center text-slate-400 text-xs">
              কোনো রক্তের রিকোয়েস্ট পাওয়া যায়নি।
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredRequests.map((req) => (
                <div
                  key={req._id}
                  className={`bg-[#1E293B] rounded-3xl p-5 border space-y-4 shadow-lg ${
                    req.isUrgent && req.status === "Pending"
                      ? "border-red-500/70"
                      : "border-slate-800"
                  }`}
                >
                  {/* Request Top Row */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-red-600 text-white font-black text-base flex items-center justify-center shrink-0">
                        {req.bloodGroup}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-sm text-white">
                            রোগীর নাম: {req.patientName}
                          </h3>
                          {req.isUrgent && (
                            <span className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse">
                              🚨 URGENT
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          আবেদনের সময়: {new Date(req.createdAt).toLocaleString("bn-BD")}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        req.status === "Completed"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : req.status === "Approved"
                          ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                          : req.status === "Rejected"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  {/* Patient & Target Donor Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-1.5">
                      <span className="text-[10px] font-black text-amber-400 uppercase block">
                        রোগীর বিবরণ (রিসিভার)
                      </span>
                      <p>
                        <span className="text-slate-400">বর্তমান অবস্থা:</span>{" "}
                        <strong className="text-white">{req.patientCondition}</strong>
                      </p>
                      <p>
                        <span className="text-slate-400">হিমোগ্লোবিন (Hb):</span>{" "}
                        <strong className="text-rose-400">{req.hemoglobin || "উল্লেখ নেই"}</strong>
                      </p>
                      <p>
                        <span className="text-slate-400">রোগীর ফোন:</span>{" "}
                        <a
                          href={`tel:${req.requesterPhone}`}
                          className="font-mono font-black text-emerald-400 hover:underline"
                        >
                          📞 {req.requesterPhone}
                        </a>
                      </p>
                    </div>

                    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-1.5">
                      <span className="text-[10px] font-black text-emerald-400 uppercase block">
                        যাকে রিকোয়েস্ট করেছে (ডোনার)
                      </span>
                      <p>
                        <span className="text-slate-400">ডোনার:</span>{" "}
                        <strong className="text-white">{req.donorName}</strong>
                      </p>
                      <p>
                        <span className="text-slate-400">ঠিকানা:</span>{" "}
                        <span className="text-slate-300">{req.donorAddress || "—"}</span>
                      </p>
                      <p>
                        <span className="text-slate-400">ডোনারের ফোন:</span>{" "}
                        {req.donorPhone ? (
                          <a
                            href={`tel:${req.donorPhone}`}
                            className="font-mono font-black text-emerald-400 hover:underline"
                          >
                            📞 {req.donorPhone}
                          </a>
                        ) : (
                          "—"
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-xs">
                    <span className="text-slate-400 font-bold block mb-0.5">
                      রোগীর রক্ত দেওয়ার কারণ ও হাসপাতাল:
                    </span>
                    <p className="text-slate-200 leading-relaxed">{req.reason}</p>
                  </div>

                  {/* Admin Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleUpdateRequestStatus(req._id, "Approved")}
                      className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-black rounded-xl cursor-pointer"
                    >
                      ✓ Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateRequestStatus(req._id, "Completed")}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black rounded-xl cursor-pointer"
                    >
                      🩸 Completed (রক্তদান সম্পন্ন)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateRequestStatus(req._id, "Rejected")}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white text-[11px] font-bold rounded-xl cursor-pointer"
                    >
                      ✕ Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRequest(req._id)}
                      className="ml-auto px-3 py-2 bg-rose-500/15 hover:bg-rose-600 text-rose-400 hover:text-white text-[11px] font-bold rounded-xl cursor-pointer"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}