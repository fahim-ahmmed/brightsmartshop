"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";

const DEFAULT_MAIN_CATEGORIES = [
  { name: "Grocery", slug: "grocery", icon: "🌾", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80" },
  { name: "Fashion", slug: "fashion", icon: "👕", image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&q=80" },
  { name: "Cosmetics", slug: "cosmetics", icon: "🧴", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80" },
  { name: "Beauty Care", slug: "beauty-care", icon: "🪷", image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80" },
  { name: "Health & Medicine", slug: "health-medicine", icon: "💊", image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80" },
  { name: "Electronics", slug: "electronics", icon: "📺", image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&q=80" },
  { name: "Home & Kitchen", slug: "home-kitchen", icon: "🍳", image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=400&q=80" },
];

// 🟢 আনলিমিটেড ব্রাউজার ডাটাবেস (IndexedDB) + মেমোরি হেল্পার
const IDB_NAME = "BSS_INSTANT_DB";
const IDB_STORE = "store_cache";

function openIDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) return reject("No IDB");
    const req = window.indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveToIDB(key, val) {
  try {
    if (typeof window !== "undefined") {
      window.__BSS_CACHE__ = window.__BSS_CACHE__ || {};
      window.__BSS_CACHE__[key] = val;
      try { localStorage.setItem(`bss_${key}`, JSON.stringify(val)); } catch (e) {}
    }
    const db = await openIDB();
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(val, key);
  } catch (e) {}
}

async function getFromIDB(key) {
  try {
    const db = await openIDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const req = tx.objectStore(IDB_STORE).get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

function getSyncCache(key) {
  if (typeof window === "undefined") return null;
  if (window.__BSS_CACHE__?.[key]?.length > 0) return window.__BSS_CACHE__[key];
  try {
    const item = localStorage.getItem(`bss_${key}`) || sessionStorage.getItem(`bss_${key}`);
    if (item) {
      const parsed = JSON.parse(item);
      window.__BSS_CACHE__ = window.__BSS_CACHE__ || {};
      window.__BSS_CACHE__[key] = parsed;
      return parsed;
    }
  } catch (e) {}
  return null;
}

export default function HomePage() {
  const router = useRouter();
  const cartContext = useCart();
  const addToCart = cartContext?.addToCart || (() => {});

  const initialProds = getSyncCache("products");

  const [products, setProducts] = useState(initialProds || []);
  const [heroBanners, setHeroBanners] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mainCategories, setMainCategories] = useState(DEFAULT_MAIN_CATEGORIES);

  useEffect(() => {
    DEFAULT_MAIN_CATEGORIES.forEach((cat) => {
      router.prefetch(`/category/${cat.slug}`);
    });

    // ১. প্রথমেই IndexedDB থেকে ৫ মিলিসেকেন্ডে প্রোডাক্ট তুলে আনা (যদি বড় ছবির কারণে localStorage-এ না থাকে)
    async function loadInstantFromBrowserDB() {
      if (!initialProds || initialProds.length === 0) {
        const idbProds = await getFromIDB("products");
        if (idbProds && idbProds.length > 0) {
          window.__BSS_CACHE__ = window.__BSS_CACHE__ || {};
          window.__BSS_CACHE__.products = idbProds;
          setProducts(idbProds);
        }
      }
      const idbCats = await getFromIDB("categories");
      if (idbCats && idbCats.length > 0) {
        window.__BSS_CACHE__ = window.__BSS_CACHE__ || {};
        window.__BSS_CACHE__.categories = idbCats;
        mergeMainCategories(idbCats);
      }
    }

    function mergeMainCategories(allCats) {
      const dbMainCats = allCats.filter((c) => !c.parentCategory && !c.parentSlug);
      const merged = DEFAULT_MAIN_CATEGORIES.map((defCat) => {
        const found = dbMainCats.find(
          (dbCat) =>
            dbCat.slug?.toLowerCase() === defCat.slug ||
            dbCat.name?.toLowerCase() === defCat.name.toLowerCase()
        );
        return found ? { ...defCat, ...found, slug: defCat.slug } : defCat;
      });

      const extraCats = dbMainCats.filter(
        (dbCat) =>
          !DEFAULT_MAIN_CATEGORIES.some(
            (defCat) =>
              defCat.slug === dbCat.slug?.toLowerCase() ||
              defCat.name.toLowerCase() === dbCat.name?.toLowerCase()
          )
      );
      setMainCategories([...merged, ...extraCats]);
    }

    // ২. ব্যাকগ্রাউন্ডে সার্ভারের সাথে সাইলেন্ট সিংক
    async function syncWithServer() {
      try {
        const [prodRes, catRes, bannerRes] = await Promise.all([
          fetch("/api/admin/products"),
          fetch("/api/categories"),
          fetch("/api/admin/banners"),
        ]);

        if (prodRes.ok) {
          const prodData = await prodRes.json();
          const prodList = prodData.products || [];
          setProducts(prodList);
          saveToIDB("products", prodList);
        }

        if (catRes.ok) {
          const catData = await catRes.json();
          const allCats = catData.categories || catData || [];
          saveToIDB("categories", allCats);
          mergeMainCategories(allCats);
        }

        if (bannerRes.ok) {
          const bannerData = await bannerRes.json();
          const activeBanners = (bannerData.banners || []).filter((b) => b.isActive);
          setHeroBanners(activeBanners);
        }
      } catch (err) {
        console.error("Background sync error:", err);
      }
    }

    loadInstantFromBrowserDB();
    syncWithServer();
  }, [router]);

  const displayBanners =
    heroBanners.length > 0
      ? heroBanners
      : [
          { image: "/hero1.jpg", link: "/category/grocery", title: "Hero Banner 1" },
          { image: "/hero2.jpg", link: "/category/fashion", title: "Hero Banner 2" },
        ];

  useEffect(() => {
    if (displayBanners.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % displayBanners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [displayBanners.length]);

  const handleAddToCartOnly = (product) => {
    addToCart({
      id: product._id || product.id,
      title: product.title,
      price: product.price,
      points: Math.floor(Number(product.points || product.point || 0)),
      unit: product.unit || product.weight || "1 Pcs",
      image: product.image,
    });
  };

  const handleBuyNow = (product) => {
    const params = new URLSearchParams({
      id: product._id || product.id || "",
      title: product.title || "",
      price: product.price || 0,
      point: Math.floor(Number(product.points || product.point || 0)),
    });
    router.push(`/checkout?${params.toString()}`);
  };

  const navCategories = [
    { title: "Home", icon: "🏠", href: "/" },
    { title: "All Categories", icon: "田", href: "/categories" },
    ...DEFAULT_MAIN_CATEGORIES.map((c) => ({
      title: c.name,
      icon: c.icon,
      href: `/category/${c.slug}`,
    })),
    { title: "Offers", icon: "🏷️", href: "/offers" },
  ];

  const catColors = [
    "bg-[#F3F8EC] border-[#E2EED3]",
    "bg-[#FFF5EC] border-[#FFE4D1]",
    "bg-[#FFF0F3] border-[#FFDBE2]",
    "bg-[#F3EEFF] border-[#E4D7FF]",
    "bg-[#EBF7F8] border-[#D0F0F3]",
    "bg-[#FFF9EC] border-[#FFEEC8]",
    "bg-[#EEF2FF] border-[#E0E7FF]",
  ];

  // যদি অ্যাডমিন থেকে কোনো প্রোডাক্ট Popular সিলেক্ট করা থাকে তবে সেগুলো দেখাবে, না থাকলে সব প্রোডাক্টই সাথে সাথে দেখাবে
  const popularFiltered = products.filter((p) => Boolean(p.isPopular));
  const popularProducts = popularFiltered.length > 0 ? popularFiltered : products;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-gray-800 flex flex-col justify-between">
      <nav className="bg-[#00875A] text-white py-2.5 px-4 sm:px-8 shadow-md border-b border-emerald-800/30 sticky top-16 sm:top-20 z-40">
        <div className="max-w-[1400px] mx-auto">
          <div className="block lg:hidden w-full">
            <select
              onChange={(e) => e.target.value && router.push(e.target.value)}
              defaultValue="/"
              className="w-full bg-[#00704A] text-white font-black text-sm py-2.5 px-4 rounded-xl border border-emerald-500/40 focus:outline-none cursor-pointer"
            >
              {navCategories.map((cat, idx) => (
                <option key={idx} value={cat.href} className="bg-[#00875A] text-white font-bold">
                  {cat.icon} {cat.title}
                </option>
              ))}
            </select>
          </div>

          <div className="hidden lg:flex items-center justify-center gap-2 xl:gap-3 overflow-x-auto whitespace-nowrap">
            {navCategories.map((cat, idx) => (
              <Link
                key={idx}
                href={cat.href}
                prefetch={true}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-extrabold text-xs sm:text-sm transition-all cursor-pointer ${
                  idx === 0
                    ? "bg-[#00704A] text-white shadow-xs"
                    : "hover:bg-[#00704A] text-emerald-50 hover:text-white"
                }`}
              >
                <span className="text-base">{cat.icon}</span>
                <span>{cat.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <main className="w-full space-y-12 py-8">
        <section className="max-w-[1400px] mx-auto px-4 sm:px-8">
          <div className="relative w-full h-[240px] sm:h-[380px] md:h-[460px] lg:h-[520px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-gray-100 bg-white">
            {displayBanners.map((banner, index) => (
              <div
                key={banner._id || index}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                  index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
                }`}
              >
                <Link href={banner.link || "/category/grocery"}>
                  <img
                    src={banner.image}
                    alt={banner.title || `Banner ${index + 1}`}
                    className="w-full h-full object-contain bg-white cursor-pointer"
                  />
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-[1400px] mx-auto px-4 sm:px-8 space-y-6">
          <div className="flex items-center justify-between border-l-6 border-[#F25C05] pl-4">
            <h2 className="text-2xl sm:text-3xl font-black text-[#00875A] tracking-tight">
              Shop by Category
            </h2>
            <Link
              href="/categories"
              className="text-sm sm:text-base font-black text-[#00875A] hover:text-[#00704A] hover:underline flex items-center gap-1.5"
            >
              <span>View All Categories</span>
              <span className="text-lg">›</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 sm:gap-5">
            {mainCategories.map((cat, idx) => {
              const colorClass = catColors[idx % catColors.length];
              const catSlug = cat.slug || cat._id;

              return (
                <Link
                  key={cat._id || cat.slug || idx}
                  href={`/category/${catSlug}`}
                  prefetch={true}
                  className={`${colorClass} border-2 rounded-3xl p-3.5 flex flex-col items-center justify-between transition-all duration-300 hover:-translate-y-2 hover:shadow-xl cursor-pointer group min-h-[195px] w-full`}
                >
                  <div className="w-full h-28 sm:h-32 rounded-2xl overflow-hidden my-1 flex items-center justify-center bg-white shadow-2xs p-1.5">
                    <img
                      src={cat.image || "/hero1.jpg"}
                      alt={cat.name}
                      className="w-full h-full object-contain rounded-xl group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="w-full flex items-center justify-between pt-2.5 border-t border-black/10 mt-2">
                    <span className="text-xs font-black text-gray-900 truncate">
                      {cat.name}
                    </span>
                    <span className="text-sm font-black text-gray-400 group-hover:text-[#00875A] group-hover:translate-x-1 transition-all">
                      ›
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* POPULAR PRODUCTS (কোনো লোডিং স্পিনার ছাড়া তাৎক্ষণিক প্রদর্শন) */}
        <section className="max-w-[1400px] mx-auto px-4 sm:px-8 space-y-6">
          <div className="flex items-center justify-between border-l-6 border-[#F25C05] pl-4">
            <h2 className="text-2xl sm:text-3xl font-black text-[#00875A] tracking-tight">
              Popular Products
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {popularProducts.map((p) => {
              const prodId = p._id || p.id;
              const oldPrice = Number(p.discountPrice || p.originalPrice || 0);
              const sellPrice = Number(p.price || 0);
              const saveAmount = oldPrice > sellPrice ? oldPrice - sellPrice : 0;

              return (
                <div
                  key={prodId}
                  className="bg-white rounded-3xl p-4 border border-gray-200/80 shadow-2xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
                >
                  {saveAmount > 0 && (
                    <span className="absolute top-3 left-3 bg-rose-500 text-white text-[10px] font-black px-2.5 py-1 rounded-xl shadow-xs z-10 uppercase tracking-wider">
                      SAVE ৳{saveAmount}
                    </span>
                  )}
                  <Link
                    href={`/shop/${prodId}`}
                    className="w-full h-44 sm:h-52 bg-gray-50 rounded-2xl overflow-hidden flex items-center justify-center p-2 mb-3 relative group-hover:bg-gray-100/85 transition-colors block"
                  >
                    <img
                      src={p.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80"}
                      alt={p.title}
                      loading="eager"
                      decoding="async"
                      className="w-full h-full object-contain rounded-xl group-hover:scale-105 transition-transform duration-300"
                    />
                  </Link>
                  <div className="space-y-1 mb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-[#00875A] uppercase tracking-wider block">
                        {p.subCategoryName || p.subCategory || p.categoryName || p.category || "General"}
                      </span>
                      <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                        📦 {p.unit || p.weight || "1 Pcs"}
                      </span>
                    </div>
                    <Link href={`/shop/${prodId}`}>
                      <h3 className="font-extrabold text-xs sm:text-sm text-gray-900 line-clamp-1 group-hover:text-[#00875A] hover:underline">
                        {p.title}
                      </h3>
                    </Link>
                  </div>
                  <div className="pt-2 border-t border-gray-100 mb-2.5 flex items-center justify-between px-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-black text-gray-900">৳{sellPrice}</span>
                      {saveAmount > 0 && (
                        <span className="text-[11px] text-gray-400 line-through font-bold">
                          ৳{oldPrice}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-gray-700">
                      +{Math.floor(Number(p.points || p.point || 0))} Points
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleAddToCartOnly(p)}
                      className="py-2.5 bg-emerald-100 hover:bg-emerald-200 text-[#00875A] font-extrabold text-[11px] rounded-xl transition-all cursor-pointer text-center"
                    >
                      🛒 Cart
                    </button>
                    <button
                      onClick={() => handleBuyNow(p)}
                      className="py-2.5 bg-[#00875A] hover:bg-[#00704A] text-white font-black text-[11px] rounded-xl transition-all cursor-pointer shadow-xs text-center"
                    >
                      ⚡ Buy Now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}