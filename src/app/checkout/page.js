"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { authClient } from "@/lib/auth-client";
import toast from "react-hot-toast";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { cartItems, clearCart } = useCart() || {};

  const { data: session, isPending: sessionLoading } = authClient?.useSession
    ? authClient.useSession()
    : { data: null, isPending: false };

  const buyId = searchParams.get("id");
  const buyTitle = searchParams.get("title");
  const buyPrice = searchParams.get("price");
  const buyPoint = searchParams.get("point");

  const isDirectBuy = Boolean(buyTitle && buyPrice);

  // 🟢 ডিফল্টভাবে অফিস রিসিভ ("office_receive") সিলেক্ট করা থাকবে
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    paymentMethod: "office_receive",
    senderNumber: "",
    transactionId: "",
  });

  const [loading, setLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [userCustomerId, setUserCustomerId] = useState(""); // ইউজারের নিজের BSS আইডি
  const [userSponsor, setUserSponsor] = useState(""); // ইউজারকে যে রেফার করেছে তার BSS আইডি

  useEffect(() => {
    if (sessionLoading) return;

    const savedUser = localStorage.getItem("bright_user");
    const sessionUser = session?.user;

    if (!savedUser && !sessionUser) {
      toast.error("অর্ডার করার আগে অনুগ্রহ করে লগিন করুন।");
      router.push("/login");
    } else {
      async function syncUserAndSponsor() {
        try {
          const user = savedUser ? JSON.parse(savedUser) : {};
          const uid = sessionUser?.id || user._id || user.id || "";
          const uphone = sessionUser?.mobile || sessionUser?.phone || user.phone || user.mobile || "";

          setFormData((prev) => ({
            ...prev,
            name: user.name || sessionUser?.name || prev.name,
            phone: uphone || prev.phone,
            address: user.address || sessionUser?.address || prev.address,
          }));

          // সার্ভার থেকে ইউজারের আসল পার্মানেন্ট BSS- আইডি এবং স্পন্সর আইডি নিয়ে আসা
          const params = new URLSearchParams();
          if (uid) params.set("userId", uid);
          if (uphone) params.set("phone", uphone);

          const res = await fetch(`/api/client/dashboard-stats?${params.toString()}`, {
            cache: "no-store",
          });
          if (res.ok) {
            const data = await res.json();
            if (data?.user) {
              const myBssId = data.user.referralCode || data.user.id || "";
              const mySponsorId = data.user.sponsorCode || "";
              setUserCustomerId(myBssId);
              setUserSponsor(mySponsorId !== "SYSTEM-TOP" ? mySponsorId : "");

              setFormData((prev) => ({
                ...prev,
                name: data.user.name || prev.name,
                phone: data.user.mobile || prev.phone,
                address: data.user.address || prev.address,
              }));

              // localStorage-ও আপডেট করে রাখা যাতে সব জায়গায় নাম ও আইডি এক থাকে
              const updatedLocal = {
                ...user,
                id: myBssId,
                customerId: myBssId,
                referralCode: myBssId,
                name: data.user.name || user.name,
                phone: data.user.mobile || user.phone,
                sponsorCode: mySponsorId,
              };
              localStorage.setItem("bright_user", JSON.stringify(updatedLocal));
            }
          } else {
            const fallbackId = user.referralCode || user.customerId || user.id || "";
            const fallbackSponsor =
              user.sponsorCode || user.sponsorId || user.referredBy || sessionUser?.sponsorCode || "";
            setUserCustomerId(fallbackId);
            setUserSponsor(fallbackSponsor !== "SYSTEM-TOP" ? fallbackSponsor : "");
          }
        } catch (e) {
          console.error("User storage parse error", e);
        } finally {
          setIsCheckingAuth(false);
        }
      }

      syncUserAndSponsor();
    }
  }, [router, session, sessionLoading]);

  const totalItemCount = isDirectBuy
    ? 1
    : (cartItems || []).reduce((acc, item) => acc + (item.quantity || 1), 0);

  const subtotalPrice = isDirectBuy
    ? Number(buyPrice)
    : (cartItems || []).reduce(
        (acc, item) => acc + Number(item.price || 0) * (item.quantity || 1),
        0
      );

  const totalPoints = isDirectBuy
    ? Number(buyPoint || 0)
    : (cartItems || []).reduce(
        (acc, item) => acc + Number(item.points || item.point || 0) * (item.quantity || 1),
        0
      );

  const isOfficeReceive = formData.paymentMethod === "office_receive";
  const deliveryCharge = isOfficeReceive ? 0 : totalPoints >= 200 ? 0 : 120;
  const totalAmount = subtotalPrice + deliveryCharge;

  const handleSubmitOrder = async (e) => {
    e.preventDefault();

    if (isOrderPlaced || loading) return;

    if (!formData.name || !formData.phone) {
      toast.error("অনুগ্রহ করে আপনার নাম ও মোবাইল নম্বর দিন।");
      return;
    }

    if (!isOfficeReceive && !formData.address) {
      toast.error("অনুগ্রহ করে আপনার সম্পূর্ণ ঠিকানা দিন।");
      return;
    }

    if (
      formData.paymentMethod !== "cod" &&
      formData.paymentMethod !== "office_receive" &&
      (!formData.senderNumber || !formData.transactionId)
    ) {
      toast.error("অনুগ্রহ করে সেন্ডার নম্বর এবং Transaction ID প্রদান করুন।");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("অর্ডার প্রসেস হচ্ছে...");

    try {
      const savedUser = localStorage.getItem("bright_user");
      let userId = session?.user?.id || null;
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        userId = userId || parsedUser._id || parsedUser.id;
      }

      const orderPayload = {
        userId: userId,
        customerId: userCustomerId,
        referralCode: userCustomerId,
        customerName: formData.name,
        phone: formData.phone,
        address: isOfficeReceive
          ? formData.address
            ? `${formData.address} (অফিস রিসিভ)`
            : "অফিস রিসিভ (Office Pickup)"
          : formData.address,
        paymentMethod: formData.paymentMethod,
        paymentDetails: {
          senderNumber: formData.senderNumber,
          transactionId: formData.transactionId,
          officialNumber: "01305470835",
        },
        items: isDirectBuy
          ? [
              {
                id: buyId,
                title: buyTitle,
                price: Number(buyPrice),
                points: Number(buyPoint || 0),
                quantity: 1,
              },
            ]
          : cartItems,
        subtotalPrice,
        totalPoints,
        points: totalPoints,
        deliveryCharge,
        totalAmount,
        status: "Pending",
        sponsorId: userSponsor || userCustomerId,
        sponsorCode: userSponsor || "",
        createdAt: new Date(),
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      if (res.ok) {
        setIsOrderPlaced(true);
        toast.success("🎉 আপনার অর্ডারটি সফলভাবে সম্পন্ন হয়েছে!", { id: toastId });

        if (!isDirectBuy && clearCart) clearCart();

        router.push("/client/orders");
      } else {
        toast.error("অর্ডার জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।", { id: toastId });
        setLoading(false);
      }
    } catch (err) {
      console.error("Order submit error:", err);
      toast.error("সার্ভারে সমস্যা হয়েছে।", { id: toastId });
      setLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="text-[#00875A] font-bold text-lg animate-pulse">লগিন স্ট্যাটাস যাচাই করা হচ্ছে...</p>
      </div>
    );
  }

  if (isOrderPlaced) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <div className="text-5xl">✅</div>
        <p className="text-[#00875A] font-bold text-xl">আপনার অর্ডারটি প্রসেস হচ্ছে, রিডাইরেক্ট করা হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 font-sans text-gray-800 space-y-8">
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
        <h1 className="text-2xl font-black text-[#00875A]">Checkout & Delivery</h1>
        <p className="text-xs text-gray-500 mt-1">
          আপনার ঠিকানা ও পেমেন্ট সিলেক্ট করে অর্ডার নিশ্চিত করুন
        </p>
      </div>

      <form
        onSubmit={handleSubmitOrder}
        className="grid grid-cols-1 md:grid-cols-12 gap-8"
      >
        <div className="md:col-span-7 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-6">
          <h2 className="text-sm font-extrabold text-gray-900 border-b pb-3">
            ১. শিপিং ঠিকানা
          </h2>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold block mb-1">আপনার নাম *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="আপনার নাম লিখুন"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#00875A]"
              />
            </div>

            <div>
              <label className="font-bold block mb-1">ফোন নম্বর *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="017XXXXXXXX"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#00875A]"
              />
            </div>

            <div>
              <label className="font-bold block mb-1">
                সম্পূর্ণ ঠিকানা {!isOfficeReceive && "*"}
              </label>
              <textarea
                required={!isOfficeReceive}
                rows="3"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder={
                  isOfficeReceive
                    ? "অফিস রিসিভ (প্রয়োজনে নোট বা ঠিকানা লিখতে পারেন - ঐচ্ছিক)"
                    : "বাসা নং, রোড নং, এলাকা, জেলা..."
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-[#00875A]"
              />
            </div>

            {/* 🟢 ইউজারের নিজের আইডি এবং স্পন্সর আইডি প্রদর্শন */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {userCustomerId && (
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center gap-2">
                  <span className="text-emerald-900 font-bold text-xs">
                    🆔 আপনার আইডি: <span className="font-mono font-black">{userCustomerId}</span>
                  </span>
                </div>
              )}
              {userSponsor && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center gap-2">
                  <span className="text-amber-800 font-bold text-xs">
                    🤝 স্পন্সর আইডি: <span className="font-mono font-black">{userSponsor}</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          <h2 className="text-sm font-extrabold text-gray-900 border-b pb-3 pt-2">
            ২. ডেলিভারি ও পেমেন্ট সিলেক্ট করুন
          </h2>

          <div className="space-y-3">
            <label
              className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer ${
                formData.paymentMethod === "office_receive"
                  ? "border-[#00875A] bg-emerald-50/50"
                  : "border-gray-200"
              }`}
            >
              <input
                type="radio"
                name="payment"
                value="office_receive"
                checked={formData.paymentMethod === "office_receive"}
                onChange={(e) =>
                  setFormData({ ...formData, paymentMethod: e.target.value })
                }
              />
              <span className="text-xs font-bold text-emerald-800">
                🏢 অফিস রিসিভ (Office Pickup - চার্জ ৳০) [Default]
              </span>
            </label>

            <label
              className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer ${
                formData.paymentMethod === "cod"
                  ? "border-[#00875A] bg-emerald-50/50"
                  : "border-gray-200"
              }`}
            >
              <input
                type="radio"
                name="payment"
                value="cod"
                checked={formData.paymentMethod === "cod"}
                onChange={(e) =>
                  setFormData({ ...formData, paymentMethod: e.target.value })
                }
              />
              <span className="text-xs font-bold">
                💵 ক্যাশ অন ডেলিভারি (Cash on Delivery)
              </span>
            </label>

            <label
              className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer ${
                formData.paymentMethod === "bkash"
                  ? "border-pink-500 bg-pink-50/50"
                  : "border-gray-200"
              }`}
            >
              <input
                type="radio"
                name="payment"
                value="bkash"
                checked={formData.paymentMethod === "bkash"}
                onChange={(e) =>
                  setFormData({ ...formData, paymentMethod: e.target.value })
                }
              />
              <span className="text-xs font-bold text-pink-700">
                💖 বিকাশ সেন্ড মানি
              </span>
            </label>

            <label
              className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer ${
                formData.paymentMethod === "nagad"
                  ? "border-orange-500 bg-orange-50/50"
                  : "border-gray-200"
              }`}
            >
              <input
                type="radio"
                name="payment"
                value="nagad"
                checked={formData.paymentMethod === "nagad"}
                onChange={(e) =>
                  setFormData({ ...formData, paymentMethod: e.target.value })
                }
              />
              <span className="text-xs font-bold text-orange-700">
                🟠 নগদ সেন্ড মানি
              </span>
            </label>
          </div>

          {(formData.paymentMethod === "bkash" || formData.paymentMethod === "nagad") && (
            <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl space-y-3 text-xs border border-slate-800">
              <p className="font-bold text-emerald-400">
                📲 বিকাশ / নগদ সেন্ড মানি নম্বর:
              </p>
              <div className="bg-slate-800 p-2.5 rounded-xl text-center text-sm font-black text-amber-400 font-mono">
                01727629513
              </div>
              <div className="space-y-2 pt-1">
                <input
                  type="text"
                  placeholder="যে নম্বর থেকে সেন্ড করেছেন"
                  value={formData.senderNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, senderNumber: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Transaction ID (TrxID)"
                  value={formData.transactionId}
                  onChange={(e) =>
                    setFormData({ ...formData, transactionId: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white uppercase"
                />
              </div>
            </div>
          )}
        </div>

        <div className="md:col-span-5 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm h-fit space-y-4">
          <h2 className="text-sm font-extrabold text-gray-900 border-b pb-3">
            অর্ডার সামারি
          </h2>

          <div className="space-y-2.5 text-xs font-bold">
            <div className="flex justify-between">
              <span>প্রোডাক্ট সাবটোটাল ({totalItemCount} টি)</span>
              <span>৳{subtotalPrice}</span>
            </div>

            <div className="flex justify-between items-center">
              <span>মোট অর্জিত পয়েন্ট</span>
              <span className="text-[#00875A] font-black bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                🌟 {totalPoints} পয়েন্ট
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span>ডেলিভারি চার্জ</span>
              {isOfficeReceive ? (
                <span className="text-emerald-600 font-black bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                  🏢 ফ্রি (অফিস রিসিভ)
                </span>
              ) : deliveryCharge === 0 ? (
                <span className="text-emerald-600 font-black bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                  🎉 ফ্রি (২০০+ পয়েন্ট অফার)
                </span>
              ) : (
                <span className="text-gray-900 font-bold">৳{deliveryCharge}</span>
              )}
            </div>

            {!isOfficeReceive && totalPoints < 200 && (
              <p className="text-[10px] text-amber-700 font-extrabold bg-amber-50 p-2.5 rounded-2xl border border-amber-200/80 leading-relaxed">
                💡 টিপস: আপনার অর্ডারে ২০০ পয়েন্ট বা তার বেশি থাকলে ডেলিভারি চার্জ সম্পূর্ণ ফ্রি হয়ে যাবে! (বর্তমান পয়েন্ট: {totalPoints})
              </p>
            )}
          </div>

          <div className="border-t pt-3 flex justify-between text-sm font-black">
            <span>সর্বমোট বিল:</span>
            <span className="text-[#00875A] text-base">৳{totalAmount}</span>
          </div>

          <button
            type="submit"
            disabled={loading || isOrderPlaced}
            className={`w-full py-3.5 text-white font-black text-xs rounded-xl shadow-md transition-all ${
              loading || isOrderPlaced
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#00875A] hover:bg-[#00704A] cursor-pointer"
            }`}
          >
            {loading ? "প্রসেস হচ্ছে..." : "✅ কনফার্ম অর্ডার করুন"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="p-10 text-center font-bold text-[#00875A] animate-pulse">
          Loading Checkout...
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}