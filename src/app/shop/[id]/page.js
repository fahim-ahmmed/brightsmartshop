"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import toast from "react-hot-toast";
import Link from "next/link";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id;

  const cartContext = useCart();
  const addToCart = cartContext?.addToCart || (() => {});

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState("");

  useEffect(() => {
    if (!productId) return;

    async function fetchProductDetails() {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/${productId}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const prod = data.product || data;
          setProduct(prod);
          setSelectedImage(prod.image || prod.images?.[0] || "");
        } else {
          const allRes = await fetch("/api/products", { cache: "no-store" });
          if (allRes.ok) {
            const allData = await allRes.json();
            const found = (allData.products || allData || []).find(
              (p) => (p._id || p.id) === productId
            );
            if (found) {
              setProduct(found);
              setSelectedImage(found.image || found.images?.[0] || "");
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch product details:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProductDetails();
  }, [productId]);

  const handleAddToCart = () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: product._id || product.id,
        title: product.title || product.name,
        price: Number(product.price || 0),
        points: Number(product.points || product.point || 0),
        unit: product.unit || product.weight || "1 Pcs",
        image: selectedImage || product.image,
      });
    }
    toast.success(`🛒 "${product.title || product.name}" কার্টে যোগ করা হয়েছে!`);
  };

  const handleBuyNow = () => {
    if (!product) return;
    handleAddToCart();
    const queryParams = new URLSearchParams({
      id: product._id || product.id || "",
      title: product.title || product.name || "",
      price: product.price || 0,
      point: product.points || product.point || 0,
    });
    router.push(`/checkout?${queryParams.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#00875A] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-[#00875A] animate-pulse">প্রোডাক্ট লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans p-4">
        <div className="bg-white p-8 rounded-3xl shadow-sm text-center space-y-4 max-w-md w-full border border-gray-100">
          <div className="text-5xl">🔍</div>
          <h2 className="text-lg font-black text-gray-900">প্রোডাক্টটি পাওয়া যায়নি!</h2>
          <p className="text-xs text-gray-500">প্রোডাক্টটি হয়তো ডিলিট করা হয়েছে অথবা লিংক ভুল রয়েছে।</p>
          <Link
            href="/shop"
            className="inline-block px-6 py-3 bg-[#00875A] hover:bg-[#00704A] text-white font-extrabold text-xs rounded-xl transition-all shadow-xs"
          >
            ← শপে ফিরে যান
          </Link>
        </div>
      </div>
    );
  }

  const oldPrice = Number(product.discountPrice || product.originalPrice || 0);
  const sellPrice = Number(product.price || 0);
  const saveAmount = oldPrice > sellPrice ? oldPrice - sellPrice : 0;
  const imagesList = product.images && product.images.length > 0 ? product.images : [product.image];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-gray-800 pb-16">
      
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-4">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
          <Link href="/" className="hover:text-[#00875A]">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-[#00875A]">Shop</Link>
          <span>/</span>
          <span className="text-gray-900 truncate">{product.title || product.name}</span>
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-8">
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          <div className="lg:col-span-5 space-y-4">
            <div className="w-full h-[320px] sm:h-[420px] bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 flex items-center justify-center p-4 relative">
              {saveAmount > 0 && (
                <span className="absolute top-4 left-4 bg-rose-500 text-white text-[11px] font-black px-3 py-1.5 rounded-xl shadow-xs uppercase tracking-wider z-10">
                  SAVE ৳{saveAmount}
                </span>
              )}
              <img
                src={selectedImage || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80"}
                alt={product.title || product.name}
                className="w-full h-full object-contain hover:scale-105 transition-transform duration-500"
              />
            </div>

            {imagesList.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {imagesList.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`w-16 h-16 rounded-xl border-2 overflow-hidden bg-gray-50 flex items-center justify-center p-1 shrink-0 cursor-pointer transition-all ${
                      selectedImage === img ? "border-[#00875A] shadow-md scale-105" : "border-gray-200 opacity-70"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain rounded-lg" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="bg-emerald-50 text-[#00875A] border border-emerald-200 text-xs font-black px-3 py-1 rounded-xl uppercase tracking-wider">
                  {product.category || "General Item"}
                </span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  ✔ In Stock & Ready
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-snug">
                {product.title || product.name}
              </h1>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-gray-900">৳{sellPrice}</span>
                {oldPrice > sellPrice && (
                  <span className="text-base text-gray-400 line-through font-bold">৳{oldPrice}</span>
                )}
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Reward Bonus</span>
                <span className="text-sm font-black text-amber-500 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/30 inline-block">
                  🌟 +{product.points || product.point || 0} Points
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-bold text-gray-700">
              <span className="text-gray-400">Packaging Size / Unit:</span>
              <span className="bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200">
                📦 {product.unit || product.weight || "1 Pcs"}
              </span>
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-100">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">Product Description</h3>
              <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
                {product.description || product.details || "এই প্রোডাক্টটি চমৎকার মানের এবং প্রিমিয়াম কোয়ালিটির। আপনার দৈনন্দিন প্রয়োজন মেটাতে এটি অত্যন্ত উপযোগী ও নির্ভরযোগ্য।"}
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-gray-700">Quantity:</span>
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl p-1">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-lg bg-white shadow-2xs font-black text-gray-700 hover:bg-gray-100 cursor-pointer flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="w-12 text-center text-xs font-black text-gray-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-8 h-8 rounded-lg bg-white shadow-2xs font-black text-gray-700 hover:bg-gray-100 cursor-pointer flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="py-3.5 bg-emerald-100 hover:bg-emerald-200 text-[#00875A] font-extrabold text-xs rounded-2xl transition-all cursor-pointer text-center flex items-center justify-center gap-2 shadow-2xs"
                >
                  <span>🛒</span> Add to Cart
                </button>

                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="py-3.5 bg-[#00875A] hover:bg-[#00704A] text-white font-black text-xs rounded-2xl transition-all cursor-pointer shadow-md text-center flex items-center justify-center gap-2"
                >
                  <span>⚡</span> Buy Now (Instant Checkout)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-gray-100 text-center">
              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 space-y-1">
                <span className="text-xl">🚚</span>
                <p className="text-[10px] font-bold text-gray-700">Fast Home Delivery</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 space-y-1">
                <span className="text-xl">🛡️</span>
                <p className="text-[10px] font-bold text-gray-700">100% Genuine</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 space-y-1">
                <span className="text-xl">💳</span>
                <p className="text-[10px] font-bold text-gray-700">Secure Payment</p>
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}