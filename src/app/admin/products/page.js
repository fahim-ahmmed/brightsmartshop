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
    stock: "",
    description: "",
  });

  const [imagePreview, setImagePreview] = useState("");

  // 1. Fetch real products from database on page load
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

  // 2. Local device image convert to Base64 preview
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

  // 3. Publish product to Database
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
        stock: Number(form.stock || 10),
        image: imagePreview || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80",
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

  // 4. Delete product
  const handleDeleteProduct = async (id) => {
    if (confirm("Are you sure you want to permanently delete this product?")) {
      try {
        const res = await fetch(`/api/admin/products?id=${id}`, { method: "DELETE" });
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
    <div className="space-y-8 font-sans text-slate-100">
      
      {/* Top Banner */}
      <div className="bg-[#1E293B] p-6 rounded-3xl border border-slate-800 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-white">Upload & Live Product Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Product will save to MongoDB and appear live on store catalog immediately.
          </p>
        </div>
        <button
          onClick={loadProducts}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
        >
          🔄 Refresh List ({products.length})
        </button>
      </div>

      {/* Upload Form */}
      <div className="bg-[#1E293B] p-6 rounded-3xl border border-slate-800 shadow-xl space-y-6">
        <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
          Publish New Product
        </h2>

        <form onSubmit={handleAddProduct} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-xs font-bold text-slate-300">Product Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Miniket Rice 5kg"
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-xs font-bold text-slate-300">Category *</label>
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
            <label className="text-xs font-bold text-slate-300">Price (৳) *</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="e.g. 390"
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Original Price (৳)</label>
            <input
              type="number"
              value={form.originalPrice}
              onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
              placeholder="e.g. 420"
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Stock Quantity</label>
            <input
              type="number"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              placeholder="e.g. 50"
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Local Image File</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none cursor-pointer file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:bg-emerald-600 file:text-white file:font-bold file:text-xs hover:file:bg-emerald-500"
            />
          </div>

          <div className="space-y-1.5 lg:col-span-4">
            <label className="text-xs font-bold text-slate-300">Product Description *</label>
            <textarea
              rows="3"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Write product specifications and details..."
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl p-4 text-xs text-white focus:outline-none focus:border-emerald-500 leading-relaxed"
            />
          </div>

          {imagePreview && (
            <div className="flex items-center gap-3 lg:col-span-2">
              <img src={imagePreview} alt="Preview" className="w-12 h-12 rounded-xl object-cover border border-emerald-500" />
              <span className="text-[10px] text-emerald-400 font-bold">Image Attached</span>
            </div>
          )}

          <div className="lg:col-span-4 flex justify-end pt-2">
            <button
              type="submit"
              disabled={publishing}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer"
            >
              {publishing ? "Publishing to Database..." : "🚀 Publish Product Live"}
            </button>
          </div>
        </form>
      </div>

      {/* Live Catalog List */}
      <div className="bg-[#1E293B] p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
          Live Published Products in Store ({products.length})
        </h3>

        {loading ? (
          <p className="text-xs text-emerald-400 py-8 text-center font-bold animate-pulse">
            Loading products from MongoDB...
          </p>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <div key={p._id || p.id} className="p-4 bg-[#0F172A] rounded-2xl border border-slate-800 flex flex-col justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3">
                  <img src={p.image || "📦"} alt={p.title} className="w-12 h-12 rounded-xl object-cover bg-slate-800 shrink-0" />
                  <div>
                    <h4 className="font-bold text-xs text-white line-clamp-1">{p.title}</h4>
                    <p className="text-[10px] text-emerald-400 font-bold">{p.category} • ৳{p.price}</p>
                  </div>
                </div>

                {p.description && (
                  <p className="text-[11px] text-slate-400 line-clamp-2 bg-slate-900/60 p-2.5 rounded-xl">
                    {p.description}
                  </p>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => handleDeleteProduct(p._id || p.id)}
                    className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Delete Product
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-10 text-center italic">
            No active products found in database. Use the form above to publish your first product!
          </p>
        )}
      </div>

    </div>
  );
}