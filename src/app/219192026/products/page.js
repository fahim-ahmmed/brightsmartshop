"use client";

import React, { useState, useEffect } from "react";

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  const clientCategories = [
    "Grocery & Daily Essentials",
    "Beauty & Cosmetics",
    "Home & Kitchen",
    "Fashion & Accessories",
    "Health & Personal Care",
    "Baby Care",
    "Electronics & Gadgets",
    "Dietary Supplement",
    "Gifts & Package",
    "Ready Service",
  ];

  const [form, setForm] = useState({
    title: "",
    category: clientCategories[0],
    price: "",
    originalPrice: "",
    discountPrice: "", // 🟢 আগের দাম / কাটা দামের ফিল্ড
    points: 0, // অটোমেটিক হিসেব হবে
    unit: "1 Pcs",
    stock: "",
    description: "",
  });

  const [imagePreview, setImagePreview] = useState("");

  // 🟢 ১. অটোমেটিক রিওয়ার্ড পয়েন্ট ক্যালকুলেশন (Profit / 2.25)
  useEffect(() => {
    const sellPrice = parseFloat(form.price) || 0;
    const buyPrice = parseFloat(form.originalPrice) || 0;

    // প্রফিট হিসাব (Selling Price - Buying Price)
    const profit = sellPrice - buyPrice;

    if (profit > 0) {
      const calculatedPoints = profit / 2.25;
      setForm((prev) => ({
        ...prev,
        points: Number(calculatedPoints.toFixed(2)),
      }));
    } else {
      setForm((prev) => ({ ...prev, points: 0 }));
    }
  }, [form.price, form.originalPrice]);

  // 2. Fetch real products from database on page load
  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error("Failed to load products", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // 3. Local device image convert to Base64 preview
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 4. Publish product to Database
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!form.title || !form.price) {
      alert("Please enter product title and price");
      return;
    }

    setPublishing(true);

    try {
      const payload = {
        ...form,
        price: Number(form.price),
        originalPrice: Number(form.originalPrice || form.price),
        costPrice: Number(form.originalPrice || 0), // ব্যাকএন্ডে বাইং প্রাইস পাঠানো হচ্ছে
        discountPrice: Number(form.discountPrice || 0), // 🟢 ডাটাবেসে ডিসকাউন্ট প্রাইস পাঠানো হচ্ছে
        points: Number(form.points || 0),
        unit: form.unit || "1 Pcs",
        stock: Number(form.stock || 10),
        image:
          imagePreview ||
          "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80",
      };

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("🎉 Product Published Live in Database!");
        setForm({
          title: "",
          category: clientCategories[0],
          price: "",
          originalPrice: "",
          discountPrice: "", // 🟢 ফর্ম রিসেট
          points: 0,
          unit: "1 Pcs",
          stock: "",
          description: "",
        });
        setImagePreview("");
        loadProducts(); // Instantly refresh product list
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.message || "Failed to publish product"}`);
      }
    } catch (err) {
      console.error("Product upload error", err);
      alert("Failed to connect to backend server.");
    } finally {
      setPublishing(false);
    }
  };

  // 5. Delete product
  const handleDeleteProduct = async (id) => {
    if (confirm("Are you sure you want to permanently delete this product?")) {
      try {
        const res = await fetch(`/api/admin/products?id=${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          alert("Product deleted successfully");
          loadProducts();
        }
      } catch (err) {
        console.error("Delete failed", err);
      }
    }
  };

  return (
    <div className="space-y-8 font-sans text-slate-100 max-w-7xl mx-auto pb-12">
      
      {/* Top Banner & Stats Summary */}
      <div className="bg-[#1E293B] p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div>
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">
            ADMIN INVENTORY
          </span>
          <h1 className="text-2xl font-black text-white">
            Upload & Live Product Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Product will save to MongoDB and appear live on store catalog immediately.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#0F172A] px-4 py-2 rounded-2xl border border-slate-700 text-center">
            <span className="text-[10px] font-bold text-slate-400 block">Total Active</span>
            <span className="text-sm font-black text-emerald-400">{products.length} Items</span>
          </div>

          <button
            onClick={loadProducts}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
          >
            🔄 Refresh List
          </button>
        </div>
      </div>

      {/* Upload Form */}
      <div className="bg-[#1E293B] p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
        <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
          <span>📦</span> Publish New Product
        </h2>

        <form
          onSubmit={handleAddProduct}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-xs font-bold text-slate-300">
              Product Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Miniket Rice 5kg / Luxury Hijab"
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-xs font-bold text-slate-300">
              Category *
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {clientCategories.map((cat, idx) => (
                <option key={idx} value={cat} className="bg-[#0F172A] text-white py-1">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              Price (৳) [Selling Price] *
            </label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="e.g. 500"
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              Original Price (৳) [Buying Price] *
            </label>
            <input
              type="number"
              value={form.originalPrice}
              onChange={(e) =>
                setForm({ ...form, originalPrice: e.target.value })
              }
              placeholder="e.g. 400"
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
              required
            />
          </div>

          {/* 🟢 Discount Price Field (আগের দাম / কাটা দাম) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              Discount Price (৳) [আগের দাম/কাটা দাম]
            </label>
            <input
              type="number"
              value={form.discountPrice}
              onChange={(e) =>
                setForm({ ...form, discountPrice: e.target.value })
              }
              placeholder="e.g. 600"
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
            />
          </div>

          {/* 🌟 Auto Calculated Reward Points Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-amber-400 flex items-center gap-1">
              <span>🌟 Reward Points (Auto) *</span>
            </label>
            <input
              type="number"
              readOnly
              value={form.points}
              placeholder="Auto calculated"
              className="w-full bg-[#0B132B] border border-amber-500/50 text-amber-400 font-black rounded-xl px-4 py-3 text-xs focus:outline-none cursor-not-allowed shadow-inner"
            />
          </div>

          {/* Unit / Weight Format */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <span>📦 Unit / Weight (গ্রাম/পিস/লিটার) *</span>
            </label>
            <input
              type="text"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              placeholder="e.g. 500 Gm / 1 Liter / 1 Pcs / 1 Kg"
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              Stock Quantity
            </label>
            <input
              type="number"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              placeholder="e.g. 50"
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-xs font-bold text-slate-300">
              Local Image File
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none cursor-pointer file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:bg-emerald-600 file:text-white file:font-bold file:text-xs hover:file:bg-emerald-500"
            />
          </div>

          <div className="space-y-1.5 lg:col-span-4">
            <label className="text-xs font-bold text-slate-300">
              Product Description *
            </label>
            <textarea
              rows="3"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Write product specifications and details..."
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl p-4 text-xs text-white focus:outline-none focus:border-emerald-500 leading-relaxed"
            />
          </div>

          {imagePreview && (
            <div className="flex items-center gap-3 lg:col-span-2">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-12 h-12 rounded-xl object-cover border border-emerald-500"
              />
              <span className="text-[10px] text-emerald-400 font-bold">
                Image Attached
              </span>
            </div>
          )}

          <div className="lg:col-span-4 flex justify-end pt-2">
            <button
              type="submit"
              disabled={publishing}
              className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer"
            >
              {publishing
                ? "Publishing to Database..."
                : "🚀 Publish Product Live"}
            </button>
          </div>
        </form>
      </div>

      {/* Live Catalog Preview Section */}
      <div className="bg-[#1E293B] p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white">
              Live Published Products Preview
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Currently showing all running products loaded from MongoDB database.
            </p>
          </div>
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold">
            Total: {products.length} Active
          </span>
        </div>

        {loading ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-emerald-400 font-bold animate-pulse">
              Loading products from MongoDB...
            </p>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((p) => (
              <div
                key={p._id || p.id}
                className="p-4 bg-[#0F172A] rounded-2xl border border-slate-800/80 hover:border-emerald-500/40 transition-all flex flex-col justify-between gap-4 shadow-md group"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-16 h-16 bg-slate-800 rounded-xl overflow-hidden shrink-0 border border-slate-700 flex items-center justify-center p-1">
                    <img
                      src={p.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80"}
                      alt={p.title}
                      className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wide block truncate">
                      {p.category || "General"}
                    </span>
                    <h4 className="font-extrabold text-xs text-white line-clamp-1">
                      {p.title}
                    </h4>

                    {/* 🟢 প্রাইস এবং কাটা ডিসকাউন্ট প্রাইস */}
                    <div className="flex items-baseline gap-2 pt-0.5">
                      <span className="text-sm font-black text-emerald-400">৳{p.price}</span>
                      {Number(p.discountPrice) > 0 && (
                        <span className="text-slate-400 line-through text-xs font-bold">
                          ৳{p.discountPrice}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Badges Row */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] bg-amber-500/10 text-amber-300 px-2.5 py-1 rounded-lg border border-amber-500/30 font-bold">
                    🌟 +{p.points || p.point || 0} Pts
                  </span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 font-bold">
                    📦 {p.unit || p.weight || "1 Pcs"}
                  </span>
                  <span className="text-[10px] bg-sky-500/10 text-sky-300 px-2.5 py-1 rounded-lg border border-sky-500/30 font-bold ml-auto">
                    Stock: {p.stock || 0}
                  </span>
                </div>

                {p.description && (
                  <p className="text-[11px] text-slate-400 line-clamp-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800/50 leading-relaxed">
                    {p.description}
                  </p>
                )}

                <div className="flex justify-between items-center pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-500 font-mono">
                    ID: {(p._id || p.id || "").toString().slice(-6)}
                  </span>
                  <button
                    onClick={() => handleDeleteProduct(p._id || p.id)}
                    className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-[#0F172A] rounded-2xl border border-slate-800/80 space-y-3">
            <div className="text-4xl">📭</div>
            <p className="text-xs text-slate-400 font-bold">
              No active products found in database. Use the form above to publish your first product!
            </p>
          </div>
        )}
      </div>

    </div>
  );
}