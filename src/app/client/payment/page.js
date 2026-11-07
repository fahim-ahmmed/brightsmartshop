"use client";

import React, { useState, useEffect } from "react";
import DashboardSidebar from "@/components/layout/DashboardSidebar";

// Bangladesh Top Commercial Banks List
const BANGLADESH_BANKS = [
  "Sonali Bank PLC",
  "Janata Bank PLC",
  "Agrani Bank PLC",
  "Rupali Bank PLC",
  "Pubali Bank PLC",
  "Islami Bank Bangladesh PLC",
  "BRAC Bank PLC",
  "Dutch-Bangla Bank PLC (DBBL)",
  "Eastern Bank PLC (EBL)",
  "City Bank PLC",
  "United Commercial Bank PLC (UCB)",
  "Prime Bank PLC",
  "Dhaka Bank PLC",
  "Mutual Trust Bank PLC (MTB)",
  "NCC Bank PLC",
  "National Bank Limited",
  "Mercantile Bank PLC",
  "One Bank PLC",
  "Southeast Bank PLC",
  "Social Islami Bank PLC (SIBL)",
  "Al-Arafah Islami Bank PLC",
  "First Security Islami Bank PLC",
  "EXIM Bank PLC",
  "Shahjalal Islami Bank PLC",
  "Standard Bank PLC",
  "Jamuna Bank PLC",
  "Bank Asia PLC",
  "Trust Bank PLC",
  "South Bangla Agriculture and Commerce (SBAC) Bank",
  "NRB Bank PLC",
  "Global Islami Bank PLC",
  "Union Bank PLC",
  "Midland Bank PLC",
  "Modhumoti Bank PLC",
  "Meghna Bank PLC",
  "Community Bank Bangladesh PLC",
  "Bengal Commercial Bank PLC",
  "Citizens Bank PLC",
  "Standard Chartered Bank",
  "HSBC Bangladesh"
];

export default function WithdrawPaymentPage() {
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paymentType, setPaymentType] = useState("mobile"); // 'mobile' or 'bank'
  
  // Mobile Banking Form State
  const [mobileMethod, setMobileMethod] = useState("bKash"); // bKash, Nagad, Rocket
  const [mobileNumber, setMobileNumber] = useState("");

  // Bank Form State
  const [bankName, setBankName] = useState(BANGLADESH_BANKS[0]);
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [branchName, setBranchName] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [swiftCode, setSwiftCode] = useState("");

  // Amount State
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/client/dashboard-stats");
        if (res.ok) {
          const json = await res.json();
          setWalletBalance(json.stats?.walletBalance || 0);
        }
      } catch (err) {
        console.error("Error fetching balance:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setMessage({ type: "error", text: "Please enter a valid withdrawal amount." });
      return;
    }

    if (numericAmount > walletBalance) {
      setMessage({ type: "error", text: "Insufficient wallet balance." });
      return;
    }

    setSubmitting(true);

    const withdrawalData = {
      type: paymentType,
      amount: numericAmount,
      details:
        paymentType === "mobile"
          ? {
              method: mobileMethod,
              mobileNumber: mobileNumber,
            }
          : {
              bankName,
              accountName,
              accountNumber,
              branchName,
              routingNumber,
              swiftCode,
            },
    };

    try {
      const res = await fetch("/api/client/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(withdrawalData),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.message || "Failed to submit request.");
      }

      setMessage({
        type: "success",
        text: `Withdrawal request of ৳${numericAmount} submitted successfully!`,
      });

      // Reset Form
      setAmount("");
      setMobileNumber("");
      setAccountName("");
      setAccountNumber("");
      setBranchName("");
      setRoutingNumber("");
      setSwiftCode("");
      
      // Update local wallet balance
      setWalletBalance((prev) => prev - numericAmount);
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Something went wrong." });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-600">
        Loading Payment Portal...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/60 font-sans flex flex-col lg:flex-row text-gray-800 w-full">
      
      {/* 1. Responsive Sidebar */}
      <DashboardSidebar />

      {/* 2. Main Body Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1000px] w-full mx-auto overflow-x-hidden">
        
        {/* Header Title & Available Balance */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs">
          <div>
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block">
              WITHDRAWAL PORTAL
            </span>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Payment & Withdraw
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Withdraw your level cashback & earnings directly to your account.
            </p>
          </div>

          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-3 rounded-2xl shadow-sm text-right leading-tight">
            <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider block">
              AVAILABLE BALANCE
            </span>
            <span className="text-xl font-black">৳ {walletBalance.toFixed(2)}</span>
          </div>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div
            className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
              message.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                : "bg-rose-50 border border-rose-200 text-rose-800"
            }`}
          >
            <span>{message.type === "success" ? "✅" : "⚠️"}</span>
            <span>{message.text}</span>
          </div>
        )}

        {/* Main Form Container */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-2xs space-y-6">
          
          {/* Payment Method Selector Tabs */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block">
              SELECT PAYMENT METHOD *
            </label>
            <div className="grid grid-cols-2 gap-3 p-1.5 bg-gray-100/80 rounded-2xl">
              <button
                type="button"
                onClick={() => setPaymentType("mobile")}
                className={`py-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  paymentType === "mobile"
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <span>📱</span>
                <span>Mobile Banking</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentType("bank")}
                className={`py-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  paymentType === "bank"
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <span>🏦</span>
                <span>Bank Transfer</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* ---------------- MOBILE BANKING FORM ---------------- */}
            {paymentType === "mobile" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Provider Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                    Mobile Banking Provider *
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { name: "bKash", color: "border-pink-500 text-pink-600 bg-pink-50/50" },
                      { name: "Nagad", color: "border-orange-500 text-orange-600 bg-orange-50/50" },
                      { name: "Rocket", color: "border-purple-500 text-purple-600 bg-purple-50/50" },
                    ].map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setMobileMethod(item.name)}
                        className={`py-3 rounded-2xl border-2 text-xs font-black transition-all cursor-pointer ${
                          mobileMethod === item.name
                            ? `${item.color} shadow-xs scale-[1.02]`
                            : "border-gray-200 text-gray-600 bg-gray-50 hover:border-gray-300"
                        }`}
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mobile Number Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                    {mobileMethod} Personal Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 017XXXXXXXX"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                  />
                </div>
              </div>
            )}

            {/* ---------------- BANK TRANSFER FORM ---------------- */}
            {paymentType === "bank" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                
                {/* Bank Select List */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                    Select Bank Name *
                  </label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all cursor-pointer"
                  >
                    {BANGLADESH_BANKS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Account Name & Number Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                      Account Holder Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Name as per bank account"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                      Account Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter full bank account number"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                    />
                  </div>
                </div>

                {/* Branch Name & Routing Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                      Branch Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Gulshan Branch"
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                      Routing Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="9-digit routing number"
                      value={routingNumber}
                      onChange={(e) => setRoutingNumber(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                    />
                  </div>
                </div>

                {/* SWIFT Code */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                    SWIFT Code <span className="text-gray-400 lowercase font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Bank SWIFT/BIC Code"
                    value={swiftCode}
                    onChange={(e) => setSwiftCode(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                  />
                </div>

              </div>
            )}

            {/* Amount Field */}
            <div className="space-y-1.5 pt-2 border-t border-gray-100">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                Withdrawal Amount (৳) *
              </label>
              <input
                type="number"
                required
                min="1"
                max={walletBalance}
                placeholder={`Max available: ৳${walletBalance.toFixed(2)}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-extrabold text-emerald-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting || walletBalance <= 0}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <span>Processing Request...</span>
                ) : (
                  <>
                    <span>Submit Withdrawal Request</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>

          </form>

        </div>

      </main>

    </div>
  );
}