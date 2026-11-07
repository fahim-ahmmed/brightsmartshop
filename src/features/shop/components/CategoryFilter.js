"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function CategoryFilter({ categories = [] }) {
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("all");

  // Filter Categories by Search Term
  const filteredCategories = categories.filter((cat) => {
    const matchesSearch = cat.name.toLowerCase().includes(search.toLowerCase());
    
    if (selectedTag === "packages") {
      return matchesSearch && (cat.slug.includes("package") || cat.slug.includes("gift"));
    }
    if (selectedTag === "daily") {
      return matchesSearch && (cat.slug.includes("grocery") || cat.slug.includes("kitchen") || cat.slug.includes("health"));
    }
    if (selectedTag === "lifestyle") {
      return matchesSearch && (cat.slug.includes("beauty") || cat.slug.includes("fashion") || cat.slug.includes("service"));
    }
    
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Search Bar & Filter Buttons */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search Box */}
        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
        </div>

        {/* Quick Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: "all", label: "All Categories" },
            { id: "daily", label: "Daily Essentials" },
            { id: "packages", label: "Packages & Gifts" },
            { id: "lifestyle", label: "Lifestyle & Beauty" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTag(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedTag === tab.id
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

      </div>

      {/* Category Grid */}
      {filteredCategories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredCategories.map((cat, idx) => (
            <Link
              key={cat.slug || idx}
              href={`/category/${cat.slug}`}
              className="group bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all duration-300 flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-2xl group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-sm">
                  {cat.icon || "📦"}
                </div>
                <span className="text-xs font-semibold text-gray-400 group-hover:text-emerald-600 transition-colors">
                  {cat.productCount || 0} {cat.productCount === 1 ? "Item" : "Items"}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 text-lg group-hover:text-emerald-700 transition-colors line-clamp-1">
                  {cat.name}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Quality guaranteed items for {cat.name.toLowerCase()}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-gray-50 text-xs font-bold text-emerald-600 group-hover:text-emerald-800">
                <span>Browse Products</span>
                <span className="text-base transition-transform group-hover:translate-x-1">→</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 space-y-3">
          <div className="text-3xl">🔎</div>
          <h3 className="font-bold text-gray-800 text-base">No Categories Found</h3>
          <p className="text-xs text-gray-500">Try searching with a different term.</p>
        </div>
      )}
    </div>
  );
}