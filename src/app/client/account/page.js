"use client";

import React, { useState, useEffect } from "react";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { authClient } from "@/lib/auth-client";

const ensureBssFormat = (val) => {
  if (!val) return "";
  const s = String(val).trim();
  if (!s || s === "SYSTEM-TOP" || s === "None") return "";
  return s.toUpperCase().startsWith("BSS-") ? s.toUpperCase() : `BSS-${s}`;
};

export default function MyAccountPage() {
  const { data: session } = authClient?.useSession
    ? authClient.useSession()
    : { data: null };

  const [userData, setUserData] = useState({
    name: "Customer",
    email: "",
    mobile: "",
    address: "",
    referralCode: "BSS-20260001",
    sponsorCode: "",
    sponsorName: "",
    id: "BSS-20260001",
    _id: "",
    role: "Client",
    profileImage: "",
  });

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Password Change States
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: "", text: "" });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    address: "",
    profileImage: "",
  });

  useEffect(() => {
    async function fetchUserData() {
      try {
        // ১. LocalStorage থেকে প্রাথমিক ডাটা চেক
        const savedUser = localStorage.getItem("bright_user");
        let localParsed = null;
        if (savedUser) {
          try {
            localParsed = JSON.parse(savedUser);
          } catch (e) {
            console.error(e);
          }
        }

        const uid =
          session?.user?.id ||
          localParsed?._id ||
          localParsed?.id ||
          localParsed?.referralCode ||
          "";
        const phone =
          session?.user?.mobile ||
          session?.user?.phone ||
          localParsed?.mobile ||
          localParsed?.phone ||
          "";
        const email = session?.user?.email || localParsed?.email || "";

        const params = new URLSearchParams();
        if (uid) params.set("userId", uid);
        if (phone) params.set("phone", phone);
        if (email) params.set("email", email);

        // ২. API থেকে লেটেস্ট ইউজার ডাটা ফেচ
        const res = await fetch(`/api/client/dashboard-stats?${params.toString()}`, {
          cache: "no-store",
        });

        if (res.ok) {
          const json = await res.json();
          if (json.user) {
            const myBssId =
              ensureBssFormat(json.user.referralCode || json.user.id) ||
              ensureBssFormat(localParsed?.referralCode || localParsed?.id) ||
              "BSS-20260001";

            const referredByCode = ensureBssFormat(
              json.user.sponsorCode || json.user.referredBy || localParsed?.sponsorCode || ""
            );

            const fetchedUser = {
              name: json.user.name || localParsed?.name || "Customer",
              email: json.user.email || localParsed?.email || "",
              mobile:
                json.user.mobile ||
                json.user.phone ||
                localParsed?.mobile ||
                localParsed?.phone ||
                "",
              address: json.user.address || localParsed?.address || "",
              referralCode: myBssId,
              sponsorCode: referredByCode,
              sponsorName: json.user.sponsorName || "",
              id: myBssId,
              _id: json.user._id || localParsed?._id || "",
              role: json.user.role || localParsed?.role || "Client",
              profileImage:
                json.user.profileImage ||
                json.user.image ||
                localParsed?.profileImage ||
                localParsed?.image ||
                "",
            };

            setUserData(fetchedUser);
            setFormData({
              name: fetchedUser.name,
              mobile: fetchedUser.mobile,
              address: fetchedUser.address,
              profileImage: fetchedUser.profileImage,
            });

            // LocalStorage ও Header-এর সাথে সিঙ্ক করে রাখা যাতে সব জায়গায় একই নাম ও BSS- আইডি থাকে
            const syncedLocal = {
              ...(localParsed || {}),
              ...fetchedUser,
              id: myBssId,
              customerId: myBssId,
              referralCode: myBssId,
            };
            localStorage.setItem("bright_user", JSON.stringify(syncedLocal));
            window.dispatchEvent(new Event("userUpdated"));
          }
        } else if (localParsed) {
          const myBssId =
            ensureBssFormat(localParsed.referralCode || localParsed.id) || "BSS-20260001";
          const referredByCode = ensureBssFormat(
            localParsed.sponsorCode || localParsed.referredBy || ""
          );
          setUserData((prev) => ({
            ...prev,
            ...localParsed,
            id: myBssId,
            referralCode: myBssId,
            sponsorCode: referredByCode,
          }));
          setFormData({
            name: localParsed.name || "",
            mobile: localParsed.mobile || localParsed.phone || "",
            address: localParsed.address || "",
            profileImage: localParsed.profileImage || localParsed.image || "",
          });
        }
      } catch (err) {
        console.error("Failed to load user profile:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUserData();
  }, [session]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChangeInput = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  // 🟢 📷 প্রোফাইল ছবি পিক ও স্বয়ংক্রিয়ভাবে আল্ট্রা-ফাস্ট WebP কম্প্রেশন
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_SIZE = 400; // প্রোফাইল পিকচারের জন্য ৪০০px একদম পারফেক্ট
        let width = img.width;
        let height = img.height;

        if (width > height && width > MAX_SIZE) {
          height = Math.round((height * MAX_SIZE) / width);
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width = Math.round((width * MAX_SIZE) / height);
          height = MAX_SIZE;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // 75% কোয়ালিটিতে WebP কম্প্রেশন
        const compressedBase64 = canvas.toDataURL("image/webp", 0.75);
        setFormData((prev) => ({
          ...prev,
          profileImage: compressedBase64,
        }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    const updatedUserObj = {
      ...userData,
      name: formData.name,
      mobile: formData.mobile,
      phone: formData.mobile,
      address: formData.address,
      profileImage: formData.profileImage,
    };

    try {
      const res = await fetch("/api/client/profile/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          userId: userData._id || userData.id,
          id: userData.id,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to update profile.");
      }

      setUserData(updatedUserObj);

      // LocalStorage আপডেট এবং ন্যাভবারে লাইভ সিঙ্কের জন্য Event Trigger
      const savedUser = localStorage.getItem("bright_user");
      const currentLocal = savedUser ? JSON.parse(savedUser) : {};
      const newLocalData = { ...currentLocal, ...updatedUserObj };
      localStorage.setItem("bright_user", JSON.stringify(newLocalData));
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("userUpdated"));

      setMessage({ type: "success", text: "Profile updated successfully!" });
      setIsEditing(false);
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to save profile changes." });
    } finally {
      setSaving(false);
    }
  };

  // 🟢 পাসওয়ার্ড পরিবর্তনের হ্যান্ডলার
  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordMessage({ type: "", text: "" });

    const { currentPassword, newPassword, confirmPassword } = passwordData;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: "error", text: "সবগুলো পাসওয়ার্ড ফিল্ড পূরণ করুন!" });
      setPasswordSaving(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "নতুন পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না!" });
      setPasswordSaving(false);
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: "error", text: "নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে!" });
      setPasswordSaving(false);
      return;
    }

    try {
      const { error } = await authClient.changePassword({
        currentPassword: currentPassword,
        newPassword: newPassword,
        revokeOtherSessions: true,
      });

      if (error) {
        throw new Error(error.message || "পুরাতন পাসওয়ার্ড সঠিক নয়!");
      }

      setPasswordMessage({ type: "success", text: "পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!" });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPasswordMessage({
        type: "error",
        text: err.message || "পুরাতন পাসওয়ার্ড সঠিক নয় অথবা পরিবর্তন করা সম্ভব হয়নি।",
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleCopyMyReferralLink = () => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/register?sponsor=${userData.referralCode || userData.id}`;
    navigator.clipboard.writeText(url);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2500);
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
              Manage your personal information, referral ID, sponsor details, and address.
            </p>
          </div>

          {!isEditing && (
            <button
              onClick={() => {
                setFormData({
                  name: userData.name,
                  mobile: userData.mobile,
                  address: userData.address,
                  profileImage: userData.profileImage,
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-6 border-b border-gray-100">
            <div className="flex items-center gap-5">
              {/* Profile Image Picker Container */}
              <div className="relative group shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-black text-2xl flex items-center justify-center shadow-md overflow-hidden border-2 border-emerald-500/20">
                  {(isEditing ? formData.profileImage : userData.profileImage) ? (
                    <img
                      src={isEditing ? formData.profileImage : userData.profileImage}
                      alt={userData.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{userData.name ? userData.name[0].toUpperCase() : "U"}</span>
                  )}
                </div>

                {/* Camera Button when Editing */}
                {isEditing && (
                  <label className="absolute -bottom-2 -right-2 bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-full cursor-pointer shadow-md transition-transform hover:scale-110 flex items-center justify-center">
                    <span className="text-xs">📷</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div>
                <h2 className="text-xl font-black text-gray-900">{userData.name}</h2>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Customer ID  :{" "}
                  <span className="font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {userData.id}
                  </span>{" "}
                  | Role: <span className="font-bold text-gray-700">{userData.role}</span>
                </p>
                {isEditing && (
                  <label className="inline-block mt-2 text-[11px] text-emerald-600 font-extrabold cursor-pointer hover:underline">
                    📷 Pick Profile Picture
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
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
                  MOBILE NUMBER
                </span>
                <p className="text-sm font-extrabold text-gray-900 font-mono">
                  {userData.mobile ? (
                    userData.mobile
                  ) : (
                    <span className="text-gray-400 font-normal italic">Not provided</span>
                  )}
                </p>
              </div>

              {/* 🟢 নিজের রেফারেল কোড (যার মাধ্যমে অন্যরা একাউন্ট খুলবে) */}
              <div className="space-y-1 bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/80">
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider block">
                   MY ID  
                </span>
                <p className="text-sm font-black text-emerald-900 font-mono">
                  {userData.referralCode || userData.id}
                </p>
              </div>

              {/* 🟢 আমাকে কে রেফার করেছে (Sponsor Code) */}
              <div className="space-y-1 bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80">
                <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">
                  SPONSOR CODE (আমাকে যিনি রেফার করেছেন)
                </span>
                <p className="text-sm font-black text-gray-900 font-mono">
                  {userData.sponsorCode ? (
                    <>
                      <span>{userData.sponsorCode}</span>
                      {userData.sponsorName && (
                        <span className="text-xs font-bold text-amber-800 font-sans ml-2">
                          ({userData.sponsorName})
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-400 font-normal font-sans italic">
                        No Sponsor
                    </span>
                  )}
                </p>
              </div>

              <div className="space-y-1 bg-gray-50/70 p-4 rounded-2xl border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  EMAIL ADDRESS
                </span>
                <p className="text-sm font-extrabold text-gray-900">
                  {userData.email || <span className="text-gray-400 font-normal italic">Not provided</span>}
                </p>
              </div>

              <div className="space-y-1 bg-gray-50/70 p-4 rounded-2xl border border-gray-100">
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
            <div className="space-y-8">
              {/* Profile Update Form */}
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

                  {/* Editable Mobile */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                      Mobile Number
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
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Disabled My Referral Code */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                        Customer ID
                    </label>
                    <input
                      type="text"
                      disabled
                      value={userData.referralCode || userData.id}
                      className="w-full bg-emerald-50/60 border border-emerald-200 rounded-xl px-4 py-2.5 text-xs font-black font-mono text-emerald-900 cursor-not-allowed"
                    />
                  </div>

                  {/* Disabled Sponsor Code (Referred By) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                      Sponsor Code (আমাকে যিনি রেফার করেছেন)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={
                        userData.sponsorCode
                          ? `${userData.sponsorCode}${userData.sponsorName ? ` (${userData.sponsorName})` : ""}`
                          : "Direct / None"
                      }
                      className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold font-mono text-gray-500 cursor-not-allowed"
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

              {/* ---------------- PASSWORD CHANGE SECTION ---------------- */}
              <div className="pt-6 border-t-2 border-dashed border-gray-200 space-y-4">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                  Change Password Section
                </h3>

                {passwordMessage.text && (
                  <div
                    className={`p-3 rounded-xl text-xs font-bold ${
                      passwordMessage.type === "success"
                        ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                        : "bg-rose-50 border border-rose-200 text-rose-800"
                    }`}
                  >
                    {passwordMessage.text}
                  </div>
                )}

                <form onSubmit={handlePasswordSave} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1">
                      পুরাতন পাসওয়ার্ড (Current Password) *
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChangeInput}
                      placeholder="Enter current password"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1">
                        নতুন পাসওয়ার্ড (New Password) *
                      </label>
                      <input
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChangeInput}
                        placeholder="At least 6 characters"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1">
                        কনফার্ম পাসওয়ার্ড (Confirm Password) *
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChangeInput}
                        placeholder="Confirm new password"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={passwordSaving}
                      className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      {passwordSaving ? "Updating Password..." : "Update Password"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}