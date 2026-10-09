"use client";

import React, { useState } from "react";

export default function AdminDashboardPage() {
  // Product Upload State
  const [productForm, setProductForm] = useState({
    title: "",
    category: "grocery",
    price: "",
    originalPrice: "",
    stock: "",
    discount: "",
    imageUrl: "",
    description: "",
  });

  const [products, setProducts] = useState([
    {
      id: "prod-1",
      title: "ACI Pure Miniket Rice 5kg",
      category: "Grocery & Food",
      price: 390,
      originalPrice: 420,
      stock: 45,
      imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80",
    },
    {
      id: "prod-2",
      title: "Men's Casual Cotton Shirt",
      category: "Clothing & Fashion",
      price: 850,
      originalPrice: 1100,
      stock: 20,
      imageUrl: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&q=80",
    },
  ]);

  // Wishlist Requests Demo Data
  const [wishlistRequests] = useState([
    { id: "req-1", user: "Tanvir Ahmed", product: "Fresh Soybean Oil 5L", category: "Grocery", date: "Oct 09, 2026", status: "High Demand" },
    { id: "req-2", user: "Nusrat Jahan", product: "L'Oreal Face Serum", category: "Cosmetics", date: "Oct 08, 2026", status: "Pending Stock" },
  ]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProductForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!productForm.title || !productForm.price) {
      alert("Please enter product title and price");
      return;
    }

    const newProd = {
      id: `prod-${Date.now()}`,
      title: productForm.title,
      category: productForm.category,
      price: Number(productForm.price),
      originalPrice: Number(productForm.originalPrice || productForm.price),
      stock: Number(productForm.stock || 10),
      imageUrl: productForm.imageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80",
    };

    setProducts([newProd, ...products]);
    setProductForm({
      title: "",
      category: "grocery",
      price: "",
      originalPrice: "",
      stock: "",
      discount: "",
      imageUrl: "",
      description: "",
    });

    alert("Product added successfully to website!");
  };

  const handleDeleteProduct = (id) => {
    if (confirm("Are you sure you want to delete this product?")) {
      setProducts(products.filter((p) => p.id !== id));
    }
  };

  const stats = [
    { label: "Total Customers", value: "3", sub: "Registered users", icon: "👥", bg: "bg-[#1E293B] border-slate-700" },
    { label: "Active Orders", value: "0", sub: "0 waiting confirmation", icon: "📋", bg: "bg-[#1E293B] border-slate-700" },
    { label: "Delivered Sales", value: "৳0.00", sub: "Total revenue", icon: "💰", bg: "bg-[#1E293B] border-slate-700" },
    { label: "Pending Withdrawals", value: "৳0.00", sub: "0 requests", icon: "💳", bg: "bg-[#1E293B] border-slate-700" },
    { label: "Wishlist Requests", value: wishlistRequests.length.toString(), sub: "Customer demands", icon: "❤️", bg: "bg-[#1E293B] border-slate-700" },
    { label: "Live Products", value: products.length.toString(), sub: "In shop catalog", icon: "📦", bg: "bg-[#1E293B] border-slate-700" },
  ];

  return (
    <div className="space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#1E293B] p-6 rounded-3xl border border-slate-800 shadow-lg">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Admin Overview & Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage live products, view customer wishlist requests, and control platform metrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black rounded-xl">
            System Live ●
          </span>
        </div>
      </div>

      {/* 1. Overview Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((card, idx) => (
          <div key={idx} className={`${card.bg} p-5 rounded-3xl border shadow-md flex flex-col justify-between min-h-[120px]`}>
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
              <span>{card.label}</span>
              <span className="text-base">{card.icon}</span>
            </div>
            <div className="my-2">
              <span className="text-2xl font-black text-white">{card.value}</span>
            </div>
            <span className="text-[10px] text-slate-400">{card.sub}</span>
          </div>
        ))}
      </div>

      {/* 2. Product Upload Form (Add Products according to Categories) */}
      <div className="bg-[#1E293B] p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
        <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">INVENTORY CONTROL</span>
            <h2 className="text-xl font-black text-white">Add New Product by Category</h2>
          </div>
          <span className="text-xs text-slate-400">Products will remain live until deleted</span>
        </div>

        <form onSubmit={handleAddProduct} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Product Title *</label>
            <input
              type="text"
              name="title"
              value={productForm.title}
              onChange={handleInputChange}
              placeholder="e.g. ACI Pure Rice 5kg"
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Category *</label>
            <select
              name="category"
              value={productForm.category}
              onChange={handleInputChange}
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="Grocery & Food">Grocery & Food</option>
              <option value="Clothing & Fashion">Clothing & Fashion</option>
              <option value="Cosmetics">Cosmetics</option>
              <option value="Beauty Care">Beauty Care</option>
              <option value="Health & Medicine">Health & Medicine</option>
              <option value="Home & Kitchen">Home & Kitchen</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Price (৳) *</label>
            <input
              type="number"
              name="price"
              value={productForm.price}
              onChange={handleInputChange}
              placeholder="e.g. 390"
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Original Price (৳)</label>
            <input
              type="number"
              name="originalPrice"
              value={productForm.originalPrice}
              onChange={handleInputChange}
              placeholder="e.g. 420"
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Stock Quantity</label>
            <input
              type="number"
              name="stock"
              value={productForm.stock}
              onChange={handleInputChange}
              placeholder="e.g. 50"
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1.5 lg:col-span-3">
            <label className="text-xs font-bold text-slate-300">Image URL</label>
            <input
              type="text"
              name="imageUrl"
              value={productForm.imageUrl}
              onChange={handleInputChange}
              placeholder="https://images.unsplash.com/..."
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="lg:col-span-4 flex justify-end pt-2">
            <button
              type="submit"
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
            >
              ➕ Publish Product
            </button>
          </div>

        </form>
      </div>

      {/* 3. Wishlist Customer Demands & Requests Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Wishlist Demands */}
        <div className="lg:col-span-6 bg-[#1E293B] p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest block">CUSTOMER INTEREST</span>
              <h3 className="text-lg font-bold text-white">Wishlist Requests</h3>
            </div>
            <span className="text-xs bg-rose-500/20 text-rose-400 px-2.5 py-1 rounded-full font-extrabold">
              {wishlistRequests.length} Demands
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold text-[10px] uppercase">
                  <th className="py-2.5">User</th>
                  <th className="py-2.5">Product Wanted</th>
                  <th className="py-2.5">Category</th>
                  <th className="py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {wishlistRequests.map((req) => (
                  <tr key={req.id}>
                    <td className="py-3 font-bold text-white">{req.user}</td>
                    <td className="py-3 text-slate-300 font-medium">{req.product}</td>
                    <td className="py-3 text-emerald-400 font-bold">{req.category}</td>
                    <td className="py-3 text-right">
                      <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 rounded-full font-black text-[10px]">
                        {req.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Products List */}
        <div className="lg:col-span-6 bg-[#1E293B] p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">STORE CATALOG</span>
              <h3 className="text-lg font-bold text-white">Live Uploaded Products</h3>
            </div>
            <span className="text-xs text-slate-400 font-bold">{products.length} Products</span>
          </div>

          <div className="space-y-3">
            {products.map((p) => (
              <div key={p.id} className="p-3 bg-[#0F172A] rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img src={p.imageUrl} alt={p.title} className="w-12 h-12 rounded-xl object-cover" />
                  <div>
                    <h4 className="font-bold text-xs text-white line-clamp-1">{p.title}</h4>
                    <p className="text-[10px] text-emerald-400 font-bold">{p.category} • ৳{p.price}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteProduct(p.id)}
                  className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}