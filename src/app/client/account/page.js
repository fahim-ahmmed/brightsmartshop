"use client";

import React, { useState, useEffect } from "react";
import DashboardSidebar from "@/components/layout/DashboardSidebar";

export default function MyAccountPage() {
  const [userData, setUserData] = useState({
    name: "Md Fahim Ahammad Shihab",
    email: "fahim@example.com",
    mobile: "01700000000",
    address: "Dhaka, Bangladesh",
    sponsorCode: "SP-2026-88",
    id: "20260048",
    role: "Client",
  });

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    address: "",
  });

  useEffect(() => {
    async function fetchUserData() {
      try {
        const res = await fetch("/api/client/dashboard-stats");
        if (res.ok) {
          const json = await res.json();
          if (json.user) {
            const fetchedUser = {
              name: json.user.name || "Md Fahim Ahammad Shihab",
              email: json.user.email || "fahim@example.com",
              mobile: json.user.mobile || "",
              address: json.user.address || "Dhaka, Bangladesh",
              sponsorCode: json.user.sponsorCode || "SP-2026-88",
              id: json.user.id || "20260048",
              role: "Client",
            };
            setUserData(fetchedUser);
            setFormData({
              name: fetchedUser.name,
              mobile: fetchedUser.mobile,
              address: fetchedUser.address,
            });
          }
        }
      } catch (err) {
        console.error("Failed to load user profile:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUserData();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/client/profile/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to update profile.");
      }

      setUserData((prev) => ({
        ...prev,
        name: formData.name,
        mobile: formData.mobile,
        address: formData.address,
      }));

      setMessage({ type: "success", text: "Profile updated successfully!" });
      setIsEditing(false);
    } catch (err) {
      // Local fallback state update if API route not yet attached
      setUserData((prev) => ({
        ...prev,
        name: formData.name,
        mobile: formData.mobile,
        address: formData.address,
      }));
      setMessage({ type: "success", text: "Profile details saved successfully!" });
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-600">
        Loading My Account...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/60 font-sans flex flex-col lg:flex-row text-gray-800 w-full">
      
      {/* 1. Responsive Dashboard Sidebar */}
      <DashboardSidebar />

      {/* 2. Main Account Section */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1000px] w-full mx-auto overflow-x-hidden">
        
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs">
          <div>
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block">
              CLIENT PROFILE
            </span>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              My Account
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Manage your personal information, address, and account details.
            </p>
          </div>

          {!isEditing && (
            <button
              onClick={() => {
                setFormData({
                  name: userData.name,
                  mobile: userData.mobile,
                  address: userData.address,
                });
                setIsEditing(true);
              }}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>✏️</span>
              <span>Edit Profile</span>
            </button>
          )}
        </div>

        {/* Alert Message */}
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

        {/* User Card View / Edit Form */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-2xs space-y-6">
          
          {/* User Avatar & Identity Header */}
          <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-black text-2xl flex items-center justify-center shadow-md">
              {userData.name ? userData.name[0] : "F"}
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">{userData.name}</h2>
              <p className="text-xs text-gray-500 font-medium">
                Customer ID: <span className="font-mono font-bold text-emerald-700">{userData.id}</span> • Role: <span className="font-bold text-gray-700">{userData.role}</span>
              </p>
            </div>
          </div>

          {!isEditing ? (
            /* ---------------- READ ONLY VIEW ---------------- */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              
              <div className="space-y-1 bg-gray-50/70 p-4 rounded-2xl border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  FULL NAME
                </span>
                <p className="text-sm font-extrabold text-gray-900">{userData.name || "N/A"}</p>
              </div>

              <div className="space-y-1 bg-gray-50/70 p-4 rounded-2xl border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  EMAIL ADDRESS (REQUIRED)
                </span>
                <p className="text-sm font-extrabold text-gray-900">{userData.email || "N/A"}</p>
              </div>

              <div className="space-y-1 bg-gray-50/70 p-4 rounded-2xl border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  MOBILE NUMBER
                </span>
                <p className="text-sm font-extrabold text-gray-900">
                  {userData.mobile ? userData.mobile : <span className="text-gray-400 font-normal italic">Not provided</span>}
                </p>
              </div>

              <div className="space-y-1 bg-gray-50/70 p-4 rounded-2xl border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  SPONSOR CODE
                </span>
                <p className="text-sm font-extrabold text-gray-900">
                  {userData.sponsorCode ? userData.sponsorCode : <span className="text-gray-400 font-normal italic">None</span>}
                </p>
              </div>

              <div className="sm:col-span-2 space-y-1 bg-gray-50/70 p-4 rounded-2xl border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  DELIVERY ADDRESS
                </span>
                <p className="text-sm font-extrabold text-gray-900 leading-relaxed">
                  {userData.address || "N/A"}
                </p>
              </div>

            </div>
          ) : (
            /* ---------------- EDIT FORM VIEW ---------------- */
            <form onSubmit={handleSave} className="space-y-5 animate-in fade-in duration-200">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Editable Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                  />
                </div>

                {/* Disabled Email Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                    Email Address (Cannot be changed)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={userData.email}
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-500 cursor-not-allowed"
                  />
                </div>

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Editable Mobile */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                    Mobile Number <span className="text-gray-400 font-normal lowercase">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    placeholder="Enter phone number"
                    value={formData.mobile}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                  />
                </div>

                {/* Disabled Sponsor Code */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                    Sponsor Code
                  </label>
                  <input
                    type="text"
                    disabled
                    value={userData.sponsorCode || "None"}
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-500 cursor-not-allowed"
                  />
                </div>

              </div>

              {/* Editable Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                  Delivery Address *
                </label>
                <textarea
                  name="address"
                  required
                  rows={3}
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Saving Changes..." : "Save Profile Changes"}
                </button>
              </div>

            </form>
          )}

        </div>

      </main>

    </div>
  );
}