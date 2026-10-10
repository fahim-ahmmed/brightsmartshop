"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";

export default function HomePage() {
  const router = useRouter();
  const cartContext = useCart();
  const addToCart = cartContext?.addToCart || (() => {});

  // Real Products State from MongoDB
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // 2 Hero Slider Images from public folder
  const heroImages = ["/hero1.jpg", "/hero2.jpg"];
  const [currentSlide, setCurrentSlide] = useState(0);

  // Fetch Live Products from MongoDB API
  useEffect(() => {
    async function fetchLiveProducts() {
      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
        }
      } catch (err) {
        console.error("Failed to load products on home page:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLiveProducts();
  }, []);

  // Auto Slide Change between images (Every 4 Seconds)
  useEffect(() => {
    if (heroImages.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [heroImages.length]);

  // Sticky Green Category Navigation Items
  const navCategories = [
    { title: "Home", icon: "🏠", href: "/" },
    { title: "All Categories", icon: "田", href: "/categories" },
    { title: "Grocery", icon: "🌾", href: "/shop?category=grocery" },
    { title: "Fashion", icon: "👕", href: "/shop?category=fashion" },
    { title: "Cosmetics", icon: "🧴", href: "/shop?category=cosmetics" },
    { title: "Beauty Care", icon: "🪷", href: "/shop?category=beauty" },
    { title: "Health & Medicine", icon: "💊", href: "/shop?category=health" },
    { title: "Electronics", icon: "📺", href: "/shop?category=electronics" },
    { title: "Home & Kitchen", icon: "🍳", href: "/shop?category=kitchen" },
    { title: "Offers", icon: "🏷️", href: "/offers" },
    { title: "My Orders", icon: "📋", href: "/client/orders" },
  ];

  // Shop by Category List
  const categories = [
    {
      title: "Grocery & Food",
      href: "/shop?category=grocery",
      img: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80",
      bg: "bg-[#F3F8EC] border-[#E2EED3]",
    },
    {
      title: "Clothing & Fashion",
      href: "/shop?category=fashion",
      img: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&auto=format&fit=crop&q=80",
      bg: "bg-[#FFF5EC] border-[#FFE4D1]",
    },
    {
      title: "Cosmetics",
      href: "/shop?category=cosmetics",
      img: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80",
      bg: "bg-[#FFF0F3] border-[#FFDBE2]",
    },
    {
      title: "Beauty Care",
      href: "/shop?category=beauty",
      img: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80",
      bg: "bg-[#F3EEFF] border-[#E4D7FF]",
    },
    {
      title: "Health & Medicine",
      href: "/shop?category=health",
      img: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80",
      bg: "bg-[#EBF7F8] border-[#D0F0F3]",
    },
    {
      title: "Home & Kitchen",
      href: "/shop?category=kitchen",
      img: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop&q=80",
      bg: "bg-[#FFF9EC] border-[#FFEEC8]",
    },
  ];

  // Feature Badges
  const features = [
    {
      icon: "🚚",
      title: "Fast Home Delivery",
      desc: "Get your products delivered safely to your doorstep.",
    },
    {
      icon: "🛡️",
      title: "100% Original Products",
      desc: "Guaranteed authentic & fresh quality items.",
    },
    {
      icon: "💳",
      title: "Secure Cash & Online Payment",
      desc: "Pay via bKash, Nagad, Rocket or Cash on Delivery.",
    },
    {
      icon: "🎁",
      title: "24-Level Cashback Rewards",
      desc: "Earn points and cashback bonuses on every order.",
    },
  ];

  // Testimonials / Reviews
  const reviews = [
    {
      name: "Tanvir Ahmed",
      city: "Dhaka",
      rating: 5,
      text: "Bright Smart Shop থেকে অর্ডার করে খুব দ্রুত ডেলিভারি পেয়েছি। চাল ও তেলের গুণমান চমৎকার!",
    },
    {
      name: "Nusrat Jahan",
      city: "Chittagong",
      rating: 5,
      text: "কসমোটিক্স ও বিউটি প্রোডাক্টগুলো একদম অরিজিনাল। কাস্টমার সার্ভিসও অনেক ভালো।",
    },
    {
      name: "Rafiqul Islam",
      city: "Sylhet",
      rating: 5,
      text: "ক্যাশব্যাক রিওয়ার্ড পয়েন্ট সিস্টেমটা খুব চমৎকার। কেনাকাটা করে বোনাস পয়েন্টও পাওয়া যায়!",
    },
  ];

  const handleMobileCategoryChange = (e) => {
    const href = e.target.value;
    if (href) {
      router.push(href);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-gray-800 flex flex-col justify-between">
      
      {/* 1. STICKY GREEN CATEGORY NAVIGATION BAR */}
      <nav className="bg-[#00875A] text-white py-2.5 px-4 sm:px-8 shadow-md border-b border-emerald-800/30 sticky top-16 sm:top-20 z-40 backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto">
          
          {/* MOBILE VIEW DROPDOWN SELECT */}
          <div className="block lg:hidden w-full">
            <div className="relative flex items-center">
              <select
                onChange={handleMobileCategoryChange}
                defaultValue="/"
                className="w-full bg-[#00704A] text-white font-black text-sm py-2.5 px-4 pr-10 rounded-xl border border-emerald-500/40 focus:outline-none appearance-none cursor-pointer"
              >
                {navCategories.map((cat, idx) => (
                  <option key={idx} value={cat.href} className="bg-[#00875A] text-white font-bold py-1">
                    {cat.icon} {cat.title}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 pointer-events-none text-white text-xs">
                ▼
              </div>
            </div>
          </div>

          {/* DESKTOP VIEW HORIZONTAL BUTTONS */}
          <div 
            className="hidden lg:flex items-center gap-3 overflow-x-auto whitespace-nowrap"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>

            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00704A] text-white font-black text-sm hover:bg-[#005e3e] shadow-xs transition-all cursor-pointer"
            >
              <span className="text-base">🏠</span>
              <span>Home</span>
            </Link>

            {navCategories.slice(1, -1).map((cat, idx) => (
              <Link
                key={idx}
                href={cat.href}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl hover:bg-[#00704A] text-emerald-50 hover:text-white font-extrabold text-xs sm:text-sm transition-all cursor-pointer"
              >
                <span className="text-base sm:text-lg">{cat.icon}</span>
                <span>{cat.title}</span>
              </Link>
            ))}

            <Link
              href="/client/orders"
              className="hover:text-emerald-200 flex items-center gap-2 font-black text-xs sm:text-sm transition-colors ml-auto pl-3"
            >
              <span className="text-base sm:text-lg">📋</span>
              <span>My Orders</span>
            </Link>
          </div>

        </div>
      </nav>

      {/* MAIN BODY CONTENT */}
      <main className="w-full space-y-12 py-8">
        
        {/* 2. FULL VIEW HERO SLIDER BANNER */}
        <section className="max-w-[1400px] mx-auto px-4 sm:px-8">
          <div className="relative w-full h-[240px] sm:h-[380px] md:h-[460px] lg:h-[520px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-gray-100 bg-white">
            
            {heroImages.map((img, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                  index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
                }`}
              >
                <img
                  src={img}
                  alt={`Hero Banner ${index + 1}`}
                  className="w-full h-full object-contain bg-white"
                />
              </div>
            ))}

            {/* Slider Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-black/20 backdrop-blur-xs px-3 py-1 rounded-full">
              {heroImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`h-2.5 rounded-full transition-all cursor-pointer ${
                    i === currentSlide ? "bg-[#00875A] w-6" : "bg-white/80 w-2.5"
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>

          </div>
        </section>

        {/* 3. SHOP BY CATEGORY */}
        <section className="max-w-[1400px] mx-auto px-4 sm:px-8 space-y-6">
          <div className="flex items-center justify-between border-l-6 border-[#F25C05] pl-4">
            <h2 className="text-2xl sm:text-3xl font-black text-[#00875A] tracking-tight">
              Shop by Category
            </h2>
            <Link
              href="/categories"
              className="text-sm sm:text-base font-black text-[#00875A] hover:text-[#00704A] hover:underline flex items-center gap-1.5 transition-all"
            >
              <span>View All Categories</span>
              <span className="text-lg">›</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5 sm:gap-6">
            {categories.map((cat, idx) => (
              <Link
                key={idx}
                href={cat.href}
                className={`${cat.bg} border-2 rounded-3xl p-4 flex flex-col items-center justify-between transition-all duration-300 hover:-translate-y-2 hover:shadow-xl cursor-pointer group min-h-[210px] sm:min-h-[230px] w-full`}
              >
                <div className="w-full h-32 sm:h-36 rounded-2xl overflow-hidden my-1 flex items-center justify-center bg-white shadow-2xs p-1.5">
                  <img
                    src={cat.img}
                    alt={cat.title}
                    className="w-full h-full object-cover rounded-xl group-hover:scale-110 transition-transform duration-500"
                  />
                </div>

                <div className="w-full flex items-center justify-between pt-3 border-t border-black/10 mt-2">
                  <span className="text-xs sm:text-sm font-black text-gray-900 truncate">
                    {cat.title}
                  </span>
                  <span className="text-sm sm:text-base font-black text-gray-400 group-hover:text-[#00875A] group-hover:translate-x-1 transition-all">
                    ›
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 4. POPULAR PRODUCTS (Catalog populated by Admin MongoDB Uploads) */}
        <section className="max-w-[1400px] mx-auto px-4 sm:px-8 space-y-6">
          <div className="flex items-center justify-between border-l-6 border-[#F25C05] pl-4">
            <h2 className="text-2xl sm:text-3xl font-black text-[#00875A] tracking-tight">
              Popular Products
            </h2>
            <Link
              href="/shop"
              className="text-sm sm:text-base font-black text-[#00875A] hover:text-[#00704A] hover:underline flex items-center gap-1.5 transition-all"
            >
              <span>View All Products</span>
              <span className="text-lg">›</span>
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12 text-sm font-bold text-[#00875A] animate-pulse">
              Loading live products from MongoDB...
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((p) => (
                <div
                  key={p._id || p.id}
                  className="bg-white rounded-3xl p-5 border border-gray-100 shadow-2xs hover:shadow-lg transition-all flex flex-col justify-between relative group"
                >
                  {p.originalPrice > p.price && (
                    <span className="absolute top-4 right-4 bg-rose-500 text-white text-[11px] font-black px-2.5 py-0.5 rounded-md shadow-2xs z-10">
                      SAVE ৳{p.originalPrice - p.price}
                    </span>
                  )}

                  <div className="w-full h-48 bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden my-2 group-hover:scale-105 transition-transform">
                    <img
                      src={p.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80"}
                      alt={p.title}
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  </div>

                  <div className="space-y-1 my-2">
                    <span className="text-[10px] font-bold text-[#00875A] uppercase tracking-wider block">
                      {p.category}
                    </span>
                    <h3 className="font-black text-base text-gray-900 line-clamp-1">
                      {p.title}
                    </h3>
                    {p.description && (
                      <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-gray-100 space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-black text-gray-900">৳ {p.price}</span>
                      {p.originalPrice && (
                        <span className="text-xs text-gray-400 line-through">৳ {p.originalPrice}</span>
                      )}
                    </div>

                    <button
                      onClick={() =>
                        addToCart({
                          id: p._id || p.id,
                          title: p.title,
                          price: p.price,
                          image: p.image,
                          points: 5.0,
                        })
                      }
                      className="w-full py-2.5 bg-[#00875A] hover:bg-[#00704A] active:scale-95 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>🛒 Add to Cart</span>
                    </button>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-3xl border border-gray-100 shadow-2xs">
              <p className="text-xs font-bold text-gray-500">
                No active products in MongoDB store catalog yet.
              </p>
            </div>
          )}
        </section>

        {/* 5. PROMOTIONAL BANNERS SECTION */}
        <section className="max-w-[1400px] mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Banner 1 */}
            <div className="bg-gradient-to-r from-[#00875A] to-emerald-800 rounded-3xl p-8 text-white flex flex-col justify-between min-h-[220px] shadow-md relative overflow-hidden group">
              <div className="space-y-2 z-10">
                <span className="bg-white/20 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  DAILY GROCERY SPECIAL
                </span>
                <h3 className="text-2xl font-black max-w-xs leading-snug">
                  Fresh Grocery & Daily Essentials Best Price!
                </h3>
                <p className="text-xs text-emerald-100 font-medium">
                  Up to 20% discount on daily kitchen products.
                </p>
              </div>
              <div className="pt-4 z-10">
                <Link
                  href="/shop?category=grocery"
                  className="inline-block bg-[#F25C05] hover:bg-[#D95000] text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-xs transition-all"
                >
                  Shop Grocery Now →
                </Link>
              </div>
              <div className="absolute right-4 bottom-2 text-8xl opacity-20 pointer-events-none group-hover:scale-110 transition-transform">
                🌾
              </div>
            </div>

            {/* Banner 2 */}
            <div className="bg-gradient-to-r from-[#F25C05] to-orange-700 rounded-3xl p-8 text-white flex flex-col justify-between min-h-[220px] shadow-md relative overflow-hidden group">
              <div className="space-y-2 z-10">
                <span className="bg-white/20 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  NEW FASHION & COSMETICS
                </span>
                <h3 className="text-2xl font-black max-w-xs leading-snug">
                  Trending Clothing & Beauty Collections
                </h3>
                <p className="text-xs text-orange-100 font-medium">
                  Explore top brands and guaranteed original products.
                </p>
              </div>
              <div className="pt-4 z-10">
                <Link
                  href="/shop?category=fashion"
                  className="inline-block bg-[#00875A] hover:bg-[#00704A] text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-xs transition-all"
                >
                  Explore Fashion →
                </Link>
              </div>
              <div className="absolute right-4 bottom-2 text-8xl opacity-20 pointer-events-none group-hover:scale-110 transition-transform">
                👕
              </div>
            </div>

          </div>
        </section>

        {/* 6. TRUST BADGES / FEATURES GRID */}
        <section className="max-w-[1400px] mx-auto px-4 sm:px-8">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-2xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className="text-4xl bg-emerald-50 p-3 rounded-2xl border border-emerald-100 flex-shrink-0">
                    {feat.icon}
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-gray-900">
                      {feat.title}
                    </h4>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. CUSTOMER TESTIMONIALS / REVIEWS */}
        <section className="max-w-[1400px] mx-auto px-4 sm:px-8 space-y-6">
          <div className="flex items-center justify-between border-l-6 border-[#F25C05] pl-4">
            <h2 className="text-2xl sm:text-3xl font-black text-[#00875A] tracking-tight">
              What Our Customers Say
            </h2>
            <span className="text-xs font-bold text-gray-400">
              Trusted by 5,000+ happy shoppers
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((rev, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex text-amber-500 text-sm">
                    {"★".repeat(rev.rating)}
                  </div>
                  <p className="text-xs font-medium text-gray-600 leading-relaxed italic">
                    "{rev.text}"
                  </p>
                </div>
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="font-extrabold text-gray-900">{rev.name}</span>
                  <span className="text-gray-400 font-bold">{rev.city}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>

    </div>
  );
}