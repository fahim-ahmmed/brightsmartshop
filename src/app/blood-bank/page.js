"use client";

import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

const BLOOD_GROUPS = ["All", "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const SELECTABLE_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

export default function BloodBankPage() {
  const [activeMode, setActiveMode] = useState("receiver"); // "receiver" | "donor"
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Donor Registration Form State
  const [donorForm, setDonorForm] = useState({
    name: "",
    address: "",
    phone: "",
    bloodGroup: "O+",
    lastDonationDate: "",
  });
  const [submittingDonor, setSubmittingDonor] = useState(false);

  // Request Modal State
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [requestForm, setRequestForm] = useState({
    patientName: "",
    patientCondition: "জরুরি (Critical / Emergency)",
    phone: "",
    hemoglobin: "",
    reason: "",
  });
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const fetchDonors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedGroup && selectedGroup !== "All") params.set("bloodGroup", selectedGroup);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/blood-bank/donors?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.success) {
        setDonors(data.donors || []);
      }
    } catch (err) {
      console.error("Failed to fetch donors:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedGroup, searchQuery]);

  useEffect(() => {
    fetchDonors();
  }, [fetchDonors]);

  // ডোনার রেজিস্ট্রেশন সাবমিট
  const handleDonorSubmit = async (e) => {
    e.preventDefault();
    setSubmittingDonor(true);
    try {
      const res = await fetch("/api/blood-bank/donors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(donorForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "রেজিস্ট্রেশন ব্যর্থ হয়েছে।");

      toast.success(data.message || "সফলভাবে ডোনার হিসেবে যুক্ত হয়েছেন!");
      setDonorForm({
        name: "",
        address: "",
        phone: "",
        bloodGroup: "O+",
        lastDonationDate: "",
      });
      await fetchDonors();
      setActiveMode("receiver");
    } catch (err) {
      toast.error(err.message || "সমস্যা হয়েছে, আবার চেষ্টা করুন।");
    } finally {
      setSubmittingDonor(false);
    }
  };

  // রক্তের রিকোয়েস্ট সাবমিট
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDonor) return;
    setSubmittingRequest(true);

    try {
      const res = await fetch("/api/blood-bank/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donorId: selectedDonor._id,
          donorName: selectedDonor.name,
          bloodGroup: selectedDonor.bloodGroup,
          ...requestForm,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "রিকোয়েস্ট পাঠানো যায়নি।");

      toast.success(data.message || "রক্তের রিকোয়েস্ট অ্যাডমিন প্যানেলে পাঠানো হয়েছে!");
      setSelectedDonor(null);
      setRequestForm({
        patientName: "",
        patientCondition: "জরুরি (Critical / Emergency)",
        phone: "",
        hemoglobin: "",
        reason: "",
      });
    } catch (err) {
      toast.error(err.message || "সমস্যা হয়েছে, আবার চেষ্টা করুন।");
    } finally {
      setSubmittingRequest(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-800 font-sans pb-14">
      {/* Top Hero Banner */}
      <section className="bg-gradient-to-r from-red-900 via-rose-800 to-red-900 text-white py-10 px-4">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <span className="inline-flex items-center gap-1.5 bg-white/15 border border-white/25 px-3.5 py-1 rounded-full text-xs font-extrabold tracking-wider uppercase">
            <span>🩸</span> Bright Smart Shop মানবিক উদ্যোগ
          </span>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            ব্রাইট স্মার্ট শপ ব্লাড ব্যাংক
          </h1>
          <p className="text-xs sm:text-sm text-red-100 max-w-2xl mx-auto leading-relaxed">
            এক ব্যাগ রক্ত বাঁচাতে পারে একটি প্রাণ। আপনি রক্তদাতা (Donor) হিসেবে যুক্ত হোন অথবা জরুরি প্রয়োজনে নির্দিষ্ট গ্রুপের রক্তদাতা খুঁজে রিকোয়েস্ট পাঠান।
          </p>

          {/* ২টি মূল অপশন: Receiver (রক্ত খুঁজুন) ও Donor (রক্তদাতা হোন) */}
          <div className="inline-flex bg-black/25 p-1.5 rounded-2xl border border-white/15 gap-2 mt-2">
            <button
              type="button"
              onClick={() => setActiveMode("receiver")}
              className={`px-5 sm:px-7 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                activeMode === "receiver"
                  ? "bg-white text-red-700 shadow-md"
                  : "text-red-100 hover:text-white"
              }`}
            >
              🔍 রক্ত খুঁজুন (Receiver)
            </button>
            <button
              type="button"
              onClick={() => setActiveMode("donor")}
              className={`px-5 sm:px-7 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                activeMode === "donor"
                  ? "bg-white text-red-700 shadow-md"
                  : "text-red-100 hover:text-white"
              }`}
            >
              ❤️ রক্তদাতা হন (Donor)
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 -mt-5">
        {/* ================= MODE 1: RECEIVER (ডোনার খুঁজুন ও রিকোয়েস্ট করুন) ================= */}
        {activeMode === "receiver" && (
          <div className="space-y-6">
            {/* Filter & Search Box */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-black text-gray-900">রক্তের গ্রুপ অনুযায়ী ফিল্টার করুন</h2>
                  <p className="text-xs text-gray-500">মোট {donors.length} জন রক্তদাতা পাওয়া গেছে</p>
                </div>

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="এলাকা বা নাম দিয়ে খুঁজুন (যেমন: কুষ্টিয়া, ঢাকা)..."
                  className="w-full sm:w-72 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Blood Group Filter Pills */}
              <div className="flex flex-wrap gap-2">
                {BLOOD_GROUPS.map((bg) => (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => setSelectedGroup(bg)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      selectedGroup === bg
                        ? "bg-red-600 text-white shadow-sm scale-105"
                        : "bg-red-50/70 text-red-700 hover:bg-red-100 border border-red-100"
                    }`}
                  >
                    {bg === "All" ? "সব গ্রুপ (All)" : `🩸 ${bg}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Donors Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-3xl h-52 animate-pulse border border-gray-200" />
                ))}
              </div>
            ) : donors.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center space-y-3">
                <div className="text-5xl">🩸</div>
                <h3 className="text-base font-black text-gray-900">
                  এই গ্রুপে এখনো কোনো ডোনার পাওয়া যায়নি
                </h3>
                <p className="text-xs text-gray-500">
                  আপনি চাইলে নিজেই রক্তদাতা হিসেবে রেজিস্ট্রেশন করতে পারেন।
                </p>
                <button
                  type="button"
                  onClick={() => setActiveMode("donor")}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl cursor-pointer"
                >
                  ❤️ ডোনার হিসেবে রেজিস্টার করুন
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {donors.map((donor) => (
                  <div
                    key={donor._id}
                    className="bg-white rounded-3xl border border-gray-200 p-5 shadow-2xs hover:shadow-md hover:border-red-200 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-rose-500 text-white font-black text-lg flex items-center justify-center shadow-sm shrink-0">
                          {donor.bloodGroup}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-black text-sm text-gray-900 truncate">
                            {donor.name}
                          </h3>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                            📍 {donor.address}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-3 space-y-1.5 text-xs border border-slate-100">
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-semibold">স্ট্যাটাস:</span>
                        {donor.isEligible ? (
                          <span className="text-emerald-700 font-black">🟢 রক্তদানে প্রস্তুত</span>
                        ) : (
                          <span className="text-amber-700 font-black">
                            🟡 বিশ্রামে ({donor.daysRemaining} দিন বাকি)
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-semibold">শেষ রক্তদান:</span>
                        <span className="font-bold text-gray-800">
                          {donor.lastDonationDate
                            ? new Date(donor.lastDonationDate).toLocaleDateString("bn-BD")
                            : "কখনো দেননি / নতুন"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-semibold">ফোন (সুরক্ষিত):</span>
                        <span className="font-mono font-bold text-gray-700">{donor.phone}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedDonor(donor)}
                      className="w-full py-3 bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-black text-xs rounded-2xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>🩸</span>
                      <span>রক্তের জন্য রিকোয়েস্ট করুন</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= MODE 2: DONOR REGISTRATION ================= */}
        {activeMode === "donor" && (
          <div className="max-w-xl mx-auto bg-white rounded-3xl border border-gray-200 shadow-md p-6 sm:p-8 space-y-5">
            <div className="border-b border-gray-100 pb-4">
              <span className="text-[10px] font-black text-red-600 uppercase tracking-widest block">
                BLOOD DONOR REGISTRATION
              </span>
              <h2 className="text-xl font-black text-gray-900 mt-0.5">
                রক্তদাতা হিসেবে রেজিস্ট্রেশন করুন
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                আপনার ফোন নম্বর সবার কাছে গোপন রাখা হবে। শুধুমাত্র অ্যাডমিন জরুরি প্রয়োজনে আপনার সাথে যোগাযোগ করবেন।
              </p>
            </div>

            <form onSubmit={handleDonorSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1.5">আপনার পূর্ণ নাম *</label>
                <input
                  type="text"
                  required
                  value={donorForm.name}
                  onChange={(e) => setDonorForm({ ...donorForm, name: e.target.value })}
                  placeholder="যেমন: মো. তানভীর আহমেদ"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-semibold focus:bg-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-gray-700 block mb-1.5">মোবাইল নম্বর *</label>
                  <input
                    type="tel"
                    required
                    value={donorForm.phone}
                    onChange={(e) => setDonorForm({ ...donorForm, phone: e.target.value })}
                    placeholder="017XXXXXXXX"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-semibold focus:bg-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1.5">রক্তের গ্রুপ *</label>
                  <select
                    value={donorForm.bloodGroup}
                    onChange={(e) => setDonorForm({ ...donorForm, bloodGroup: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-black text-red-700 focus:bg-white focus:outline-none focus:border-red-500"
                  >
                    {SELECTABLE_GROUPS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1.5">সম্পূর্ণ ঠিকানা *</label>
                <input
                  type="text"
                  required
                  value={donorForm.address}
                  onChange={(e) => setDonorForm({ ...donorForm, address: e.target.value })}
                  placeholder="গ্রাম/মহল্লা, থানা, জেলা..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-semibold focus:bg-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1.5">
                  শেষ কবে রক্ত দিয়েছেন? <span className="text-gray-400 font-normal">(আগে না দিয়ে থাকলে খালি রাখুন)</span>
                </label>
                <input
                  type="date"
                  value={donorForm.lastDonationDate}
                  onChange={(e) => setDonorForm({ ...donorForm, lastDonationDate: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-semibold focus:bg-white focus:outline-none focus:border-red-500"
                />
              </div>

              <button
                type="submit"
                disabled={submittingDonor}
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-black text-sm rounded-2xl shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {submittingDonor ? "রেজিস্ট্রেশন হচ্ছে..." : "🩸 ডোনার রেজিস্ট্রেশন সম্পন্ন করুন"}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* ================= BLOOD REQUEST MODAL ================= */}
      {selectedDonor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-5 my-8">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-600 text-white font-black text-base flex items-center justify-center shrink-0">
                  {selectedDonor.bloodGroup}
                </div>
                <div>
                  <span className="text-[10px] font-black text-red-600 uppercase block">
                    ডোনার প্রোফাইল ও রক্তের আবেদন
                  </span>
                  <h3 className="text-base font-black text-gray-900">{selectedDonor.name}</h3>
                  <p className="text-[11px] text-gray-500">📍 {selectedDonor.address}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDonor(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRequestSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">রোগীর নাম *</label>
                <input
                  type="text"
                  required
                  value={requestForm.patientName}
                  onChange={(e) => setRequestForm({ ...requestForm, patientName: e.target.value })}
                  placeholder="রোগীর পূর্ণ নাম লিখুন"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-semibold focus:bg-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">রোগীর বর্তমান অবস্থা *</label>
                  <select
                    value={requestForm.patientCondition}
                    onChange={(e) =>
                      setRequestForm({ ...requestForm, patientCondition: e.target.value })
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 font-bold focus:bg-white focus:outline-none focus:border-red-500"
                  >
                    <option value="জরুরি (Critical / Emergency)">জরুরি (Critical / Emergency)</option>
                    <option value="অপারেশন / সিজার (Operation)">অপারেশন / সিজার (Operation)</option>
                    <option value="মাঝারি (Moderate)">মাঝারি (Moderate)</option>
                    <option value="স্থিতিশীল (Stable)">স্থিতিশীল (Stable)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">রোগীর হিমোগ্লোবিন (Hb) *</label>
                  <input
                    type="text"
                    required
                    value={requestForm.hemoglobin}
                    onChange={(e) => setRequestForm({ ...requestForm, hemoglobin: e.target.value })}
                    placeholder="যেমন: 7.5 g/dL"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-semibold focus:bg-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">যোগাযোগের ফোন নম্বর *</label>
                <input
                  type="tel"
                  required
                  value={requestForm.phone}
                  onChange={(e) => setRequestForm({ ...requestForm, phone: e.target.value })}
                  placeholder="017XXXXXXXX"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-semibold focus:bg-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  রোগীর রক্ত দেওয়ার কারণ ও হাসপাতালের নাম *
                </label>
                <textarea
                  rows={3}
                  required
                  value={requestForm.reason}
                  onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
                  placeholder="যেমন: থ্যালাসেমিয়া / সিজারিয়ান অপারেশন — কুষ্টিয়া সদর হাসপাতাল..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-semibold focus:bg-white focus:outline-none focus:border-red-500 resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDonor(null)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submittingRequest}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {submittingRequest ? "পাঠানো হচ্ছে..." : "📩 রিকোয়েস্ট পাঠান"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}