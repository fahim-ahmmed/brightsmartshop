"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";

const MAIN_CATEGORY_TITLES = {
  grocery: "Grocery",
  fashion: "Fashion",
  cosmetics: "Cosmetics",
  "beauty-care": "Beauty Care",
  "health-medicine": "Health & Medicine",
  electronics: "Electronics",
  "home-kitchen": "Home & Kitchen",
};

const norm = (str) =>
  str ? String(str).trim().toLowerCase().replace(/[\s_-]+/g, "") : "";

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

function getSyncCache() {
  if (typeof window === "undefined") return { categories: [], products: [] };
  let categories = window.__BSS_CACHE__?.categories || [];
  let products = window.__BSS_CACHE__?.products || [];

  if (categories.length === 0) {
    try {
      const sCat = localStorage.getItem("bss_categories") || sessionStorage.getItem("bss_categories");
      if (sCat) categories = JSON.parse(sCat);
    } catch (e) {}
  }
  if (products.length === 0) {
    try {
      const sProd = localStorage.getItem("bss_products") || sessionStorage.getItem("bss_products");
      if (sProd) products = JSON.parse(sProd);
    } catch (e) {}
  }
  return { categories, products };
}

export default function CategoryPage({ params }) {
  const resolvedParams = use(params);
  const slug = decodeURIComponent(resolvedParams?.slug || "").trim().toLowerCase();

  const router = useRouter();
  const searchParams = useSearchParams();
  const subQuery = searchParams.get("sub") || "";

  const cartContext = useCart();
  const addToCart = cartContext?.addToCart || (() => {});

  const initial = getSyncCache();
  const [rawCategories, setRawCategories] = useState(initial.categories);
  const [rawProducts, setRawProducts] = useState(initial.products);
  const [selectedSub, setSelectedSub] = useState(subQuery);

  useEffect(() => {
    setSelectedSub(subQuery);
  }, [subQuery]);

  useEffect(() => {
    // ১. ব্রাউজার ডাটাবেস (IndexedDB) থেকে সাথে সাথে লোড
    async function loadFromBrowserDB() {
      if (rawCategories.length === 0) {
        const idbCats = await getFromIDB("categories");
        if (idbCats?.length > 0) setRawCategories(idbCats);
      }
      if (rawProducts.length === 0) {
        const idbProds = await getFromIDB("products");
        if (idbProds?.length > 0) setRawProducts(idbProds);
      }
    }

    // ২. ব্যাকগ্রাউন্ডে সাইলেন্ট আপডেট
    async function backgroundSync() {
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/admin/products"),
        ]);
        if (catRes.ok) {
          const cData = await catRes.json();
          const cList = cData.categories || cData || [];
          setRawCategories(cList);
          saveToIDB("categories", cList);
        }
        if (prodRes.ok) {
          const pData = await prodRes.json();
          const pList = pData.products || pData || [];
          setRawProducts(pList);
          saveToIDB("products", pList);
        }
      } catch (e) {}
    }

    loadFromBrowserDB();
    backgroundSync();
  }, [slug]);

  const currentCat = rawCategories.find(
    (c) => norm(c.slug) === norm(slug) || norm(c.name) === norm(slug)
  );

  const categoryName =
    currentCat?.name || MAIN_CATEGORY_TITLES[slug] || slug.replace(/-/g, " ");

  const parentIds = [
    norm(slug),
    norm(MAIN_CATEGORY_TITLES[slug]),
    norm(currentCat?.name),
    norm(currentCat?.slug),
    norm(currentCat?._id),
  ].filter(Boolean);

  const subCategories = rawCategories.filter((c) => {
    const pCat = norm(c.parentCategory || c.parentSlug);
    return pCat && parentIds.includes(pCat);
  });

  const subCatIds = subCategories
    .flatMap((s) => [norm(s._id), norm(s.name), norm(s.slug)])
    .filter(Boolean);

  const validCategorySet = new Set([...parentIds, ...subCatIds]);

  const allCategoryProducts = rawProducts.filter((p) => {
    const pKeys = [
      p.category,
      p.categoryName,
      p.subCategory,
      p.subCategoryName,
    ]
      .map(norm)
      .filter(Boolean);

    return pKeys.some((k) => validCategorySet.has(k));
  });

  const selectedSubObj = subCategories.find(
    (s) =>
      norm(s.slug) === norm(selectedSub) ||
      norm(s.name) === norm(selectedSub) ||
      norm(s._id) === norm(selectedSub)
  );

  const targetSubTerms = [
    norm(selectedSub),
    norm(selectedSubObj?.slug),
    norm(selectedSubObj?.name),
    norm(selectedSubObj?._id),
  ].filter(Boolean);

  const displayedProducts = selectedSub
    ? allCategoryProducts.filter((p) => {
        const pSubKeys = [
          p.subCategory,
          p.subCategoryName,
          p.subcategory,
          p.sub_category,
        ]
          .map(norm)
          .filter(Boolean);

        const matchesSubField = pSubKeys.some((k) => targetSubTerms.includes(k));
        const matchesTitle = targetSubTerms.some(
          (term) => term.length > 2 && norm(p.title || p.name).includes(term)
        );

        return matchesSubField || matchesTitle;
      })
    : allCategoryProducts;

  const handleSubClick = (subSlug) => {
    setSelectedSub(subSlug);
    const newUrl = subSlug
      ? `/category/${encodeURIComponent(slug)}?sub=${encodeURIComponent(subSlug)}`
      : `/category/${encodeURIComponent(slug)}`;
    window.history.replaceState(null, "", newUrl);
  };

  const handleAddToCartOnly = (product) => {
    addToCart({
      id: product._id || product.id,
      title: product.title || product.name,
      price: product.price,
      points: Math.floor(Number(product.points || product.point || 0)),
      unit: product.unit || product.weight || "1 Pcs",
      image: product.image,
    });
  };

  const handleBuyNow = (product) => {
    const params = new URLSearchParams({
      id: product._id || product.id || "",
      title: product.title || product.name || "",
      price: product.price || 0,
      point: Math.floor(Number(product.points || product.point || 0)),
    });
    router.push(`/checkout?${params.toString()}`);
  };

  return (
    <main className="min-h-screen bg-[#0F172A] text-gray-100 font-sans pb-16">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 pt-5 sm:pt-6 space-y-6 sm:space-y-8">
        
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
          <Link href="/" className="hover:text-emerald-400 transition-colors">Home</Link>
          <span>›</span>
          <button
            onClick={() => handleSubClick("")}
            className="hover:text-emerald-400 transition-colors capitalize cursor-pointer"
          >
            {categoryName}
          </button>
          {selectedSub && (
            <>
              <span>›</span>
              <span className="text-white font-medium capitalize">
                {selectedSubObj?.name || selectedSub.replace(/-/g, " ")}
              </span>
            </>
          )}
        </nav>

        {/* সাব-ক্যাটাগরি কার্ড */}
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">Categories</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-4">
            <button
              type="button"
              onClick={() => handleSubClick("")}
              className={`rounded-2xl overflow-hidden flex flex-col transition-all cursor-pointer border text-left ${
                !selectedSub 
                  ? "border-emerald-500 ring-2 ring-emerald-500/40 bg-slate-800" 
                  : "border-slate-800 bg-[#1E293B]/60 hover:border-slate-600"
              }`}
            >
              <div className="h-[95px] sm:h-[120px] w-full bg-emerald-500/10 flex items-center justify-center">
                <span className="text-3xl">📦</span>
              </div>
              <div className="bg-[#1E293B] p-2.5 sm:p-3 text-center flex-1 flex flex-col justify-center w-full">
                <h4 className="font-bold text-xs sm:text-sm text-white line-clamp-1">All {categoryName}</h4>
                <span className="text-[11px] sm:text-xs text-emerald-400 font-bold mt-0.5">Explore All</span>
              </div>
            </button>

            {subCategories.map((sub) => {
              const subIdentifier = sub.slug || sub.name;
              const isCurrent =
                norm(selectedSub) === norm(subIdentifier) ||
                norm(selectedSub) === norm(sub.name) ||
                norm(selectedSub) === norm(sub._id);
              
              return (
                <button
                  key={sub._id}
                  type="button"
                  onClick={() => handleSubClick(subIdentifier)}
                  className={`rounded-2xl overflow-hidden flex flex-col transition-all cursor-pointer border text-left ${
                    isCurrent 
                      ? "border-emerald-500 ring-2 ring-emerald-500/40 bg-slate-800" 
                      : "border-slate-800 bg-[#1E293B]/60 hover:border-slate-600"
                  }`}
                >
                  <div className="h-[95px] sm:h-[120px] w-full bg-white flex items-center justify-center p-2.5 sm:p-3 relative">
                    <img
                      src={sub.image || "/hero1.jpg"}
                      alt={sub.name}
                      loading="eager"
                      className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                    />
                    {isCurrent && (
                      <span className="absolute top-2 right-2 bg-emerald-500 text-slate-900 text-[9px] font-black px-2 py-0.5 rounded-full uppercase shadow-md">
                        SELECTED
                      </span>
                    )}
                  </div>
                  <div className="bg-[#1E293B] p-2.5 sm:p-3 text-center flex-1 flex flex-col justify-center border-t border-slate-700/50 w-full">
                    <h4 className="font-bold text-xs sm:text-sm text-white line-clamp-1 leading-snug">{sub.name}</h4>
                    <span className="text-[11px] sm:text-xs text-gray-400 mt-0.5">Explore</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Header */}
        <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-4 border-b border-slate-800 pb-3 sm:pb-4">
          <div>
            <h1 className="text-xl sm:text-3xl font-black text-white capitalize">
              {selectedSubObj?.name || (selectedSub ? selectedSub.replace(/-/g, " ") : categoryName)}
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Showing <span className="font-bold text-white">{displayedProducts.length}</span> products
            </p>
          </div>
        </div>

        {/* প্রোডাক্ট গ্রিড (মোবাইল ও ডেস্কটপের জন্য কম্প্যাক্ট ও সিঙ্গেল-লাইন বাটন কার্ড) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-5">
          {displayedProducts.map((p) => {
            const prodId = p._id || p.id;
            const oldPrice = Number(p.discountPrice || p.originalPrice || 0);
            const sellPrice = Number(p.price || 0);
            const saveAmount = oldPrice > sellPrice ? oldPrice - sellPrice : 0;
            const pointsVal = Math.floor(Number(p.points || p.point || 0));

            return (
              <div
                key={prodId}
                className="bg-white rounded-2xl sm:rounded-3xl p-2.5 sm:p-4 border border-gray-200/80 shadow-2xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
              >
                {saveAmount > 0 && (
                  <span className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-rose-500 text-white text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs z-10 uppercase tracking-wider whitespace-nowrap">
                    SAVE ৳{saveAmount}
                  </span>
                )}

                <div>
                  <Link
                    href={`/shop/${prodId}`}
                    className="w-full h-32 sm:h-48 bg-gray-50 rounded-xl sm:rounded-2xl overflow-hidden flex items-center justify-center p-2 mb-2 sm:mb-3 relative group-hover:bg-gray-100/85 transition-colors block"
                  >
                    <img
                      src={p.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80"}
                      alt={p.title || p.name}
                      loading="eager"
                      decoding="async"
                      className="w-full h-full object-contain rounded-lg group-hover:scale-105 transition-transform duration-300"
                    />
                  </Link>

                  <div className="space-y-1 mb-1.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[9px] sm:text-[10px] font-black text-[#00875A] uppercase tracking-wider truncate">
                        {p.subCategoryName || p.subCategory || p.categoryName || categoryName}
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md border border-gray-200 whitespace-nowrap shrink-0">
                        📦 {p.unit || p.weight || "1 Pcs"}
                      </span>
                    </div>

                    <Link href={`/shop/${prodId}`}>
                      <h3 className="font-extrabold text-xs sm:text-sm text-gray-900 truncate group-hover:text-[#00875A] hover:underline">
                        {p.title || p.name}
                      </h3>
                    </Link>
                  </div>
                </div>

                <div>
                  {/* দাম ও পয়েন্ট (এক লাইনে ফিক্সড) */}
                  <div className="pt-2 border-t border-gray-100 mb-2 flex items-center justify-between gap-1">
                    <div className="flex items-baseline gap-1 min-w-0">
                      <span className="text-sm sm:text-base font-black text-gray-900 whitespace-nowrap">
                        ৳{sellPrice}
                      </span>
                      {saveAmount > 0 && (
                        <span className="text-[10px] sm:text-[11px] text-gray-400 line-through font-bold whitespace-nowrap truncate">
                          ৳{oldPrice}
                        </span>
                      )}
                    </div>

                    <span className="text-[9px] sm:text-[11px] font-extrabold text-[#00875A] bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md whitespace-nowrap shrink-0">
                      +{pointsVal} Pts
                    </span>
                  </div>

                  {/* Cart ও Buy Now বাটন (সবসময় সিঙ্গেল লাইনে থাকবে) */}
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddToCartOnly(p)}
                      className="h-8 sm:h-10 px-1.5 bg-emerald-100 hover:bg-emerald-200 text-[#00875A] font-extrabold text-[10px] sm:text-xs rounded-lg sm:rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 whitespace-nowrap"
                    >
                      <span>🛒</span>
                      <span>Cart</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleBuyNow(p)}
                      className="h-8 sm:h-10 px-1.5 bg-[#00875A] hover:bg-[#00704A] text-white font-black text-[10px] sm:text-xs rounded-lg sm:rounded-xl transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1 whitespace-nowrap"
                    >
                      <span>⚡</span>
                      <span>Buy Now</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}