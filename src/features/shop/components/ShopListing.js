"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function ShopListing({ products = [], categories = [] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL Params State Sync
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "all");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [stock, setStock] = useState(searchParams.get("stock") || "any");
  const [sort, setSort] = useState(searchParams.get("sort") || "latest");
  const [featured, setFeatured] = useState(searchParams.get("featured") === "true");

  const defaultCategories = [
    { name: "Grocery & Daily Essentials", slug: "grocery-daily-essentials" },
    { name: "Beauty & Cosmetics", slug: "beauty-cosmetics" },
    { name: "Home & Kitchen", slug: "home-kitchen" },
    { name: "Fashion & Accessories", slug: "fashion-accessories" },
    { name: "Health & Personal Care", slug: "health-personal-care" },
    { name: "Baby Care", slug: "baby-care" },
    { name: "Electronics & Gadgets", slug: "electronics-gadgets" },
    { name: "Dietary Suppliment", slug: "dietary-suppliment" },
    { name: "Gifts & Package", slug: "gifts-package" },
    { name: "Beauty Service", slug: "beauty-service" },
  ];

  const categoryOptions = categories.length > 0 ? categories : defaultCategories;

  // Apply Filter Action
  const handleFilter = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();

    if (search.trim()) params.set("search", search.trim());
    if (category && category !== "all") params.set("category", category);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (stock && stock !== "any") params.set("stock", stock);
    if (sort) params.set("sort", sort);
    if (featured) params.set("featured", "true");

    router.push(`/shop?${params.toString()}`);
  };

  // Reset Filter Action
  const handleReset = () => {
    setSearch("");
    setCategory("all");
    setMinPrice("");
    setMaxPrice("");
    setStock("any");
    setSort("latest");
    setFeatured(false);
    router.push("/shop");
  };

  return (
    <div className="space-y-8">
      
      {/* Professional Filter Box Container */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 transition-all hover:border-emerald-200">
        <form onSubmit={handleFilter} className="space-y-4">
          
          {/* Filter Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            
            {/* 1. Search Box */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search products or SKU"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
            </div>

            {/* 2. Categories Select */}
            <div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all cursor-pointer"
              >
                <option value="all">All categories</option>
                {categoryOptions.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Min Price */}
            <div>
              <input
                type="number"
                placeholder="Min price"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
              />
            </div>

            {/* 4. Max Price */}
            <div>
              <input
                type="number"
                placeholder="Max price"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
              />
            </div>

            {/* 5. Stock Select */}
            <div>
              <select
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all cursor-pointer"
              >
                <option value="any">Any stock</option>
                <option value="in-stock">In Stock</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>
            </div>

            {/* 6. Sorting Select */}
            <div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all cursor-pointer"
              >
                <option value="latest">Latest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>

          </div>

          {/* Bottom Actions Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-gray-100">
            
            {/* Featured Checkbox */}
            <label className="flex items-center gap-2.5 cursor-pointer text-sm font-semibold text-gray-700 select-none hover:text-emerald-700 transition-colors">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
              />
              <span>Featured Products Only</span>
            </label>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {(search || category !== "all" || minPrice || maxPrice || stock !== "any" || featured) && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 text-xs font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                >
                  Reset
                </button>
              )}
              
              <button
                type="submit"
                className="flex-1 sm:flex-none px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm rounded-xl shadow-sm hover:shadow transition-all"
              >
                Filter
              </button>
            </div>

          </div>

        </form>
      </div>

      {/* Product Display Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link
              key={product._id}
              href={`/product/${product.slug}`}
              className="group bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="relative w-full h-48 bg-gray-50/80 rounded-xl overflow-hidden flex items-center justify-center p-3">
                  <img
                    src={product.image || "/hero1.jpg"}
                    alt={product.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                  {product.isFeatured && (
                    <span className="absolute top-2 left-2 bg-amber-500 text-white font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md shadow-xs">
                      Featured
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-800 text-sm group-hover:text-emerald-600 transition-colors line-clamp-2">
                  {product.name}
                </h3>
              </div>

              <div className="pt-3 border-t border-gray-50 mt-3 flex items-center justify-between">
                <div>
                  <span className="text-base font-extrabold text-emerald-700">
                    ৳{product.price}
                  </span>
                  {product.originalPrice && (
                    <span className="text-xs text-gray-400 line-through ml-2">
                      ৳{product.originalPrice}
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  View
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center space-y-3 shadow-xs">
          <div className="text-4xl">🔎</div>
          <h3 className="text-lg font-bold text-gray-800">No products found</h3>
          <p className="text-xs text-gray-500">Try adjusting your filter options to find what you are looking for.</p>
        </div>
      )}

    </div>
  );
}