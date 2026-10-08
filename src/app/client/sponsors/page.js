"use client";

import React, { useState, useEffect } from "react";
import DashboardSidebar from "@/components/layout/DashboardSidebar";

export default function MySponsorListPage() {
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState({
    name: "Md Fahim Ahammad Shihab",
    sponsorId: "20260048", // User's own ID acts as Sponsor ID
  });

  // Sponsored Members List
  const [sponsorList, setSponsorList] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchSponsorData() {
      try {
        const res = await fetch("/api/client/dashboard-stats");
        if (res.ok) {
          const json = await res.json();
          if (json.user) {
            setUserInfo({
              name: json.user.name || "Md Fahim Ahammad Shihab",
              sponsorId: json.user.id || "20260048",
            });
          }
        }
      } catch (err) {
        console.error("Failed to load sponsor data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSponsorData();
  }, []);

  // Referral Link Copy Handler
  const handleCopyLink = () => {
    const referralUrl = `${window.location.origin}/register?sponsor=${userInfo.sponsorId}`;
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-600">
        Loading Sponsor Network...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/60 font-sans flex flex-col lg:flex-row text-gray-800 w-full">
      
      {/* 1. Responsive Sidebar */}
      <DashboardSidebar />

      {/* 2. Main Body Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1200px] w-full mx-auto overflow-x-hidden">
        
        {/* Header Title & Sponsor ID Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs">
          <div>
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block">
              MY NETWORK & REFERRALS
            </span>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              My Sponsor List
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Track members registered using your Sponsor ID and view your team structure.
            </p>
          </div>

          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3">
            <div>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
                YOUR SPONSOR ID
              </span>
              <span className="text-lg font-black text-emerald-900 font-mono">
                {userInfo.sponsorId}
              </span>
            </div>
            <button
              onClick={handleCopyLink}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
            >
              {copied ? "Copied Link! ✓" : "Copy Referral Link 📋"}
            </button>
          </div>
        </div>

        {/* Sponsor Network Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs space-y-1">
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
              DIRECT SPONSORED
            </span>
            <div className="text-2xl font-black text-emerald-600">
              {sponsorList.length} Members
            </div>
            <p className="text-[11px] text-gray-400 font-medium">Joined directly using your ID</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs space-y-1">
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
              ACTIVE PURCHASERS
            </span>
            <div className="text-2xl font-black text-sky-600">
              {sponsorList.filter((m) => m.hasPurchased).length} Members
            </div>
            <p className="text-[11px] text-gray-400 font-medium">Completed shop orders</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs space-y-1">
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
              TEAM PACKAGES
            </span>
            <div className="text-2xl font-black text-purple-600">
              {sponsorList.reduce((sum, m) => sum + (m.packages || 0), 0)} Packages
            </div>
            <p className="text-[11px] text-gray-400 font-medium">Total packages in network</p>
          </div>
        </div>

        {/* Sponsored Members Table */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block">
                MEMBER LINEAGE
              </span>
              <h3 className="text-lg font-bold text-gray-900">Direct Referred Members</h3>
            </div>
            <span className="text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
              Sponsor ID: <span className="font-mono text-gray-900">{userInfo.sponsorId}</span>
            </span>
          </div>

          {sponsorList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                    <th className="py-3 px-3">SL</th>
                    <th className="py-3 px-3">MEMBER ID (THEIR SPONSOR ID)</th>
                    <th className="py-3 px-3">NAME</th>
                    <th className="py-3 px-3">JOIN DATE</th>
                    <th className="py-3 px-3">STATUS</th>
                    <th className="py-3 px-3 text-right">PACKAGES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sponsorList.map((member, index) => (
                    <tr key={member.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-3 font-bold text-gray-500">{index + 1}</td>
                      <td className="py-3.5 px-3 font-mono font-bold text-emerald-700">
                        {member.id}
                      </td>
                      <td className="py-3.5 px-3 font-bold text-gray-900">{member.name}</td>
                      <td className="py-3.5 px-3 text-gray-500">{member.joinDate}</td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                            member.hasPurchased
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {member.hasPurchased ? "Active Buyer" : "Pending Order"}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-black text-gray-900">
                        {member.packages || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Empty State when no members sponsored yet */
            <div className="py-12 text-center space-y-3">
              <div className="text-4xl">👥</div>
              <h4 className="font-bold text-gray-800 text-sm">No sponsored members yet.</h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                Share your unique Sponsor ID (<span className="font-mono font-bold text-emerald-700">{userInfo.sponsorId}</span>) or referral link with others when they create an account.
              </p>
              <div className="pt-2">
                <button
                  onClick={handleCopyLink}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-2xs transition-all inline-block cursor-pointer"
                >
                  {copied ? "Referral Link Copied!" : "Copy Referral Link"}
                </button>
              </div>
            </div>
          )}

        </div>

      </main>

    </div>
  );
}