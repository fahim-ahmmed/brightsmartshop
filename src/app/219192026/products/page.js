"use client";

import React, { useState, useEffect } from "react";

const DEFAULT_MAIN_CATEGORIES = [
  { name: "Grocery", slug: "grocery" },
  { name: "Fashion", slug: "fashion" },
  { name: "Cosmetics", slug: "cosmetics" },
  { name: "Beauty Care", slug: "beauty-care" },
  { name: "Health & Medicine", slug: "health-medicine" },
  { name: "Electronics", slug: "electronics" },
  { name: "Home & Kitchen", slug: "home-kitchen" },
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  const [form, setForm] = useState({
    title: "",
    category: "grocery",
    subCategory: "",
    price: "",
    originalPrice: "",
    discountPrice: "",
    points: 0,
    unit: "1 Pcs",
    stock: "",
    description: "",
    isPopular: false,
    isComboPackage: false,
  });

  const [imagePreview, setImagePreview] = useState("");

  // 🟢 Edit Modal State
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    category: "",
    subCategory: "",
    price: "",
    buyingPrice: "",
    points: 0,
    unit: "1 Pcs",
    stock: "",
    description: "",
    isPopular: false,
    isComboPackage: false,
  });
  const [editImage, setEditImage] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const norm = (str) =>
    str ? String(str).trim().toLowerCase().replace(/[\s_-]+/g, "") : "";

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || data || []);
      }
    } catch (err) {
      console.error("Failed to load categories", err);
    }
  };

  const dbMainCats = categories.filter((c) => !c.parentCategory && !c.parentSlug);
  const mainCategories = [
    ...DEFAULT_MAIN_CATEGORIES,
    ...dbMainCats.filter(
      (dbCat) =>
        !DEFAULT_MAIN_CATEGORIES.some(
          (def) => norm(def.slug) === norm(dbCat.slug) || norm(def.name) === norm(dbCat.name)
        )
    ),
  ];

  const currentMainCatObj = [
    ...DEFAULT_MAIN_CATEGORIES,
    ...categories,
  ].find(
    (c) =>
      norm(c.slug) === norm(form.category) ||
      norm(c.name) === norm(form.category) ||
      String(c._id) === String(form.category)
  );

  const subCategories = categories.filter((c) => {
    const parentVal = c.parentCategory || c.parentSlug || "";
    if (!parentVal) return false;

    const matchingDbMain = categories.find(
      (mc) => norm(mc.slug) === norm(form.category) || norm(mc.name) === norm(form.category)
    );

    const validTargets = [
      norm(form.category),
      norm(currentMainCatObj?.slug),
      norm(currentMainCatObj?.name),
      norm(matchingDbMain?._id),
    ].filter(Boolean);

    return validTargets.includes(norm(parentVal));
  });

  // 🟢 নির্দিষ্ট ক্যাটাগরির সাব-ক্যাটাগরি বের করা (Edit মডালের জন্য)
  const getSubCategoriesFor = (catValue) => {
    const mainObj = [...DEFAULT_MAIN_CATEGORIES, ...categories].find(
      (c) =>
        norm(c.slug) === norm(catValue) ||
        norm(c.name) === norm(catValue) ||
        String(c._id) === String(catValue)
    );

    return categories.filter((c) => {
      const parentVal = c.parentCategory || c.parentSlug || "";
      if (!parentVal) return false;

      const matchingDbMain = categories.find(
        (mc) => norm(mc.slug) === norm(catValue) || norm(mc.name) === norm(catValue)
      );

      const validTargets = [
        norm(catValue),
        norm(mainObj?.slug),
        norm(mainObj?.name),
        norm(matchingDbMain?._id),
      ].filter(Boolean);

      return validTargets.includes(norm(parentVal));
    });
  };

  const editSubCategories = getSubCategoriesFor(editForm.category);

  useEffect(() => {
    const sellPrice = parseFloat(form.price) || 0;
    const buyPrice = parseFloat(form.originalPrice) || 0;
    const profit = sellPrice - buyPrice;

    if (profit > 0) {
      const calculatedPoints = Math.floor(profit / 3.50);
      setForm((prev) => ({ ...prev, points: calculatedPoints }));
    } else {
      setForm((prev) => ({ ...prev, points: 0 }));
    }
  }, [form.price, form.originalPrice]);

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
    fetchCategories();
    loadProducts();
  }, []);

  // 🟢 ছবি আপলোডের সময় স্বয়ংক্রিয়ভাবে আল্ট্রা-ফাস্ট WebP ফরম্যাটে কম্প্রেস করার ফাংশন
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_SIZE = 550; // ই-কমার্স কার্ডের জন্য পারফেক্ট এইচডি সাইজ
        let width = img.width;
        let height = img.height;

        if (width > height && width > MAX_SIZE) {
          height = Math.round((height * MAX_SIZE) / width);
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width = Math.round((width * MAX_SIZE) / height);
          height = MAX_SIZE;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // 75% কোয়ালিটিতে WebP কম্প্রেশন (৩ MB ছবি হয়ে যাবে মাত্র ২৫ KB!)
        const compressedBase64 = canvas.toDataURL("image/webp", 0.75);
        setImagePreview(compressedBase64);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!form.title || !form.price || !form.category) {
      alert("Please enter product title, price and select category");
      return;
    }

    setPublishing(true);

    try {
      const selectedSubObj = subCategories.find(
        (s) => norm(s.slug) === norm(form.subCategory) || norm(s.name) === norm(form.subCategory)
      );

      const payload = {
        ...form,
        category: currentMainCatObj?.slug || form.category.toLowerCase(),
        categoryName: currentMainCatObj?.name || form.category,
        subCategory: selectedSubObj?.slug || form.subCategory.toLowerCase() || "",
        subCategoryName: selectedSubObj?.name || form.subCategory || "",
        price: Number(form.price),
        originalPrice: Number(form.originalPrice || form.price),
        costPrice: Number(form.originalPrice || 0),
        buyingPrice: Number(form.originalPrice || 0),
        discountPrice: Number(form.discountPrice || 0),
        points: Math.floor(Number(form.points || 0)),
        unit: form.unit || "1 Pcs",
        stock: Number(form.stock || 100),
        isPopular: Boolean(form.isPopular),
        isComboPackage: Boolean(form.isComboPackage),
        image: imagePreview || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80",
      };

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        if (typeof window !== "undefined") {
          window.__BSS_CACHE__ = { products: null, categories: null, banners: null };
          try { sessionStorage.removeItem("bss_products"); } catch (e) {}
        }

        alert("🎉 Product Published Live in Database!");
        setForm({
          title: "",
          category: form.category,
          subCategory: "",
          price: "",
          originalPrice: "",
          discountPrice: "",
          points: 0,
          unit: "1 Pcs",
          stock: "",
          description: "",
          isPopular: false,
          isComboPackage: false,
        });
        setImagePreview("");
        loadProducts();
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.message || "Failed to publish product"}`);
      }
    } catch (err) {
      alert("Failed to connect to backend server.");
    } finally {
      setPublishing(false);
    }
  };

  const handleTogglePopular = async (product) => {
    const newStatus = !product.isPopular;
    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product._id, isPopular: newStatus }),
      });
      if (res.ok) {
        if (typeof window !== "undefined") {
          window.__BSS_CACHE__ = { products: null, categories: null, banners: null };
          try { sessionStorage.removeItem("bss_products"); } catch (e) {}
        }
        loadProducts();
      }
    } catch (err) {
      console.error("Failed to toggle popular status:", err);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (confirm("Are you sure you want to permanently delete this product?")) {
      const res = await fetch(`/api/admin/products?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        if (typeof window !== "undefined") {
          window.__BSS_CACHE__ = { products: null, categories: null, banners: null };
          try { sessionStorage.removeItem("bss_products"); } catch (e) {}
        }
        loadProducts();
      }
    }
  };

  // 🟢 Edit: প্রোডাক্টের বর্তমান ডিটেইলস দিয়ে ফর্ম প্রি-ফিল করা
  const handleStartEdit = (product) => {
    setEditingProduct(product);
    setEditForm({
      title: product.title || "",
      category: product.category || "",
      subCategory: product.subCategory || "",
      price: product.price ?? "",
      buyingPrice: product.buyingPrice ?? product.costPrice ?? product.originalPrice ?? "",
      points: Math.floor(Number(product.points || 0)),
      unit: product.unit || "1 Pcs",
      stock: product.stock ?? "",
      description: product.description || "",
      isPopular: Boolean(product.isPopular),
      isComboPackage: Boolean(product.isComboPackage),
    });
    setEditImage(product.image || "");
  };

  const closeEditModal = () => {
    if (savingEdit) return;
    setEditingProduct(null);
    setEditImage("");
  };

  // 🟢 Edit মডালে দাম বদলালে পয়েন্ট রি-ক্যালকুলেট: (selling - buying) / 3.50
  const handleEditChange = (field, value) => {
    setEditForm((prev) => {
      const next = { ...prev, [field]: value };

      if (field === "price" || field === "buyingPrice") {
        const sell = parseFloat(next.price) || 0;
        const buy = parseFloat(next.buyingPrice) || 0;
        const profit = sell - buy;
        next.points = profit > 0 ? Math.floor(profit / 3.50) : 0;
      }

      return next;
    });
  };

  // 🟢 Edit মডালের ছবি — আগের মতোই WebP কম্প্রেশন
  const handleEditFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_SIZE = 550;
        let width = img.width;
        let height = img.height;

        if (width > height && width > MAX_SIZE) {
          height = Math.round((height * MAX_SIZE) / width);
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width = Math.round((width * MAX_SIZE) / height);
          height = MAX_SIZE;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        setEditImage(canvas.toDataURL("image/webp", 0.75));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // 🟢 সেভ → PATCH → লাইভ সাইটে সাথে সাথে আপডেট
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (!editForm.title || !editForm.price || !editForm.category) {
      alert("Please enter product title, price and select category");
      return;
    }

    setSavingEdit(true);

    try {
      const selectedSubObj = editSubCategories.find(
        (s) =>
          norm(s.slug) === norm(editForm.subCategory) ||
          norm(s.name) === norm(editForm.subCategory)
      );

      const mainObj = [...DEFAULT_MAIN_CATEGORIES, ...categories].find(
        (c) =>
          norm(c.slug) === norm(editForm.category) ||
          norm(c.name) === norm(editForm.category) ||
          String(c._id) === String(editForm.category)
      );

      const payload = {
        id: editingProduct._id,
        title: editForm.title,
        category: mainObj?.slug || editForm.category,
        categoryName: mainObj?.name || editForm.category,
        subCategory: selectedSubObj?.slug || editForm.subCategory || "",
        subCategoryName: selectedSubObj?.name || editForm.subCategory || "",
        price: Number(editForm.price),
        buyingPrice: Number(editForm.buyingPrice || 0),
        costPrice: Number(editForm.buyingPrice || 0),
        points: Math.floor(Number(editForm.points || 0)),
        unit: editForm.unit || "1 Pcs",
        stock: Number(editForm.stock || 0),
        description: editForm.description || "",
        image: editImage || editingProduct.image || "",
        isPopular: Boolean(editForm.isPopular),
        isComboPackage: Boolean(editForm.isComboPackage),
      };

      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // ব্রাউজার ক্যাশ রিফ্রেশ → হোমপেজে নতুন দাম/ডিটেইলস সাথে সাথে দেখাবে
        if (typeof window !== "undefined") {
          window.__BSS_CACHE__ = { products: null, categories: null, banners: null };
          try { sessionStorage.removeItem("bss_products"); } catch (e) {}
          try { localStorage.removeItem("bss_products"); } catch (e) {}
        }

        // লোকাল স্টেটেও সাথে সাথে আপডেট (রিলোডের অপেক্ষা ছাড়াই)
        setProducts((prev) =>
          prev.map((p) =>
            String(p._id) === String(editingProduct._id)
              ? { ...p, ...(data.product || payload) }
              : p
          )
        );

        alert("✅ Product updated & live!");
        setEditingProduct(null);
        setEditImage("");
        loadProducts();
      } else {
        alert(`Error: ${data.message || "Failed to update product"}`);
      }
    } catch (err) {
      alert("Failed to connect to backend server.");
    } finally {
      setSavingEdit(false);
    }
  };

  const popularCount = products.filter((p) => p.isPopular).length;
  const comboCount = products.filter((p) => p.isComboPackage).length;

  return (
    <div className="space-y-8 font-sans text-slate-100 max-w-7xl mx-auto pb-12">
      <div className="bg-[#1E293B] p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div>
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">ADMIN INVENTORY</span>
          <h1 className="text-2xl font-black text-white">Upload & Live Product Management</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-[#0F172A] px-4 py-2 rounded-2xl border border-amber-500/30 text-center">
            <span className="text-[10px] font-bold text-slate-400 block">Homepage Popular</span>
            <span className="text-sm font-black text-amber-400">🔥 {popularCount} Items</span>
          </div>
          <button
            onClick={() => { fetchCategories(); loadProducts(); }}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl cursor-pointer"
          >
            🔄 Refresh List
          </button>
        </div>
      </div>

      <div className="bg-[#1E293B] p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
        <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3">📦 Publish New Product</h2>

        <form onSubmit={handleAddProduct} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-xs font-bold text-slate-300">Product Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Luxury Hijab Collection"
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Main Category *</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value, subCategory: "" })}
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white cursor-pointer"
              required
            >
              {mainCategories.map((cat, idx) => (
                <option key={cat._id || cat.slug || idx} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-emerald-400">Sub-Category *</label>
            <select
              value={form.subCategory}
              onChange={(e) => setForm({ ...form, subCategory: e.target.value })}
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white cursor-pointer"
            >
              <option value="">-- Select Sub-Category --</option>
              {subCategories.map((sub) => (
                <option key={sub._id} value={sub.slug || sub.name}>
                  ↳ {sub.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Price (৳) [Selling Price] *</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="e.g. 500"
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white font-bold"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Buying Price (৳) *</label>
            <input
              type="number"
              value={form.originalPrice}
              onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
              placeholder="e.g. 400"
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white font-bold"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Discount Price (৳) [আগের কাটা দাম]</label>
            <input
              type="number"
              value={form.discountPrice}
              onChange={(e) => setForm({ ...form, discountPrice: e.target.value })}
              placeholder="e.g. 600"
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-amber-400">🌟 Reward Points (পূর্ণ সংখ্যা) *</label>
            <input
              type="number"
              readOnly
              value={form.points}
              className="w-full bg-[#0B132B] border border-amber-500/50 text-amber-400 font-black rounded-xl px-4 py-3 text-xs cursor-not-allowed"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-emerald-400">📦 Unit / Weight *</label>
            <input
              type="text"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              placeholder="1 Pcs / 1 Kg"
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white font-bold"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Stock Quantity</label>
            <input
              type="number"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              placeholder="e.g. 50"
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white"
            />
          </div>

          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-xs font-bold text-slate-300">Local Image File</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:bg-emerald-600 file:text-white file:font-bold cursor-pointer"
            />
          </div>

          <div className="lg:col-span-4 bg-[#0F172A] border-2 border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <label className="text-sm font-black text-amber-400 flex items-center gap-2 cursor-pointer">
                <span>🔥 হোম পেজের "Popular Products" সেকশনে দেখাবেন?</span>
              </label>
              <p className="text-[11px] text-slate-400">
                "হ্যাঁ" সিলেক্ট করলে প্রোডাক্টটি সরাসরি হোমপেজের Popular Products-এ দেখাবে। "না" থাকলে এটি শুধু নির্দিষ্ট ক্যাটাগরি ও সাব-ক্যাটাগরি পেজে থাকবে।
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setForm({ ...form, isPopular: true })}
                className={`px-5 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer border ${
                  form.isPopular
                    ? "bg-amber-500 text-slate-950 border-amber-400 shadow-lg"
                    : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                }`}
              >
                ✅ হ্যাঁ, হোমপেজে দেখান
              </button>

              <button
                type="button"
                onClick={() => setForm({ ...form, isPopular: false })}
                className={`px-5 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer border ${
                  !form.isPopular
                    ? "bg-emerald-600 text-white border-emerald-500 shadow-lg"
                    : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                }`}
              >
                📁 না, শুধু ক্যাটাগরিতে রাখুন
              </button>
            </div>
          </div>

          <div className="lg:col-span-4 bg-[#0F172A] border-2 border-emerald-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <label className="text-sm font-black text-emerald-400 flex items-center gap-2 cursor-pointer">
                <span>🎁 কম্বো প্যাকেজ / Package Product</span>
              </label>
              <p className="text-[11px] text-slate-400">
                টিক দিলে প্রোডাক্টটি হোমপেজের নতুন "Package Products" সেকশনে দেখাবে।
              </p>
            </div>

            <label className="flex items-center gap-3 shrink-0 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={!!form.isComboPackage}
                onChange={(e) => setForm({ ...form, isComboPackage: e.target.checked })}
                className="w-5 h-5 accent-emerald-500 cursor-pointer"
              />
              <span
                className={`px-5 py-2.5 rounded-xl font-black text-xs border ${
                  form.isComboPackage
                    ? "bg-emerald-600 text-white border-emerald-500"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                }`}
              >
                {form.isComboPackage ? "✅ প্যাকেজ সেকশনে আছে" : "📁 প্যাকেজে নেই"}
              </span>
            </label>
          </div>

          <div className="space-y-1.5 lg:col-span-4">
            <label className="text-xs font-bold text-slate-300">Product Description</label>
            <textarea
              rows="2"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl p-4 text-xs text-white"
            />
          </div>

          <div className="lg:col-span-4 flex justify-end">
            <button
              type="submit"
              disabled={publishing}
              className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg cursor-pointer"
            >
              {publishing ? "Publishing..." : "🚀 Publish Product Live"}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-[#1E293B] p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
        <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-4">
          Live Published Products ({products.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((p) => (
            <div
              key={p._id}
              className={`p-4 bg-[#0F172A] rounded-2xl border flex flex-col justify-between gap-3 transition-all ${
                p.isPopular ? "border-amber-500/60 shadow-md" : "border-slate-800"
              }`}
            >
              <div className="flex items-start gap-3">
                <img src={p.image} alt={p.title} className="w-14 h-14 rounded-xl object-cover bg-white p-1" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-black text-emerald-400 uppercase">{p.category}</span>
                    {p.subCategory && (
                      <span className="text-[9px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md">
                        ↳ {p.subCategory}
                      </span>
                    )}
                    {p.isPopular && (
                      <span className="text-[9px] font-black bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full">
                        🔥 POPULAR
                      </span>
                    )}
                    {p.isComboPackage && (
                      <span className="text-[9px] font-black bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full">
                        🎁 PACKAGE
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-xs text-white mt-0.5 truncate">{p.title}</h4>
                  <span className="text-sm font-black text-emerald-400">৳{p.price}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-800 gap-2">
                <button
                  type="button"
                  onClick={() => handleTogglePopular(p)}
                  className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all cursor-pointer border ${
                    p.isPopular
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500 hover:text-slate-950"
                      : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                  }`}
                >
                  {p.isPopular ? "🔥 হোমপেজে আছে (বাদ দিন)" : "➕ হোমপেজে দিন"}
                </button>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(p)}
                    className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-600 text-emerald-300 hover:text-white text-xs font-bold rounded-lg cursor-pointer border border-emerald-500/30"
                  >
                    ✏️ Edit
                  </button>

                  <button
                    onClick={() => handleDeleteProduct(p._id)}
                    className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white text-xs font-bold rounded-lg cursor-pointer"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🟢 EDIT PRODUCT MODAL — ডিটেইলস এডিট করলেই লাইভ সাইটে আপডেট */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-3xl bg-[#1E293B] border border-slate-700 rounded-3xl shadow-2xl my-6">
            <div className="flex items-center justify-between gap-3 p-5 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">
                  EDIT PRODUCT
                </span>
                <h3 className="text-lg font-black text-white truncate max-w-[240px] sm:max-w-md">
                  {editingProduct.title || "Product"}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white font-black cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-300">Product Title *</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => handleEditChange("title", e.target.value)}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Main Category *</label>
                <select
                  value={editForm.category}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, category: e.target.value, subCategory: "" }))
                  }
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white cursor-pointer"
                  required
                >
                  <option value="">-- Select Category --</option>
                  {[...DEFAULT_MAIN_CATEGORIES, ...dbMainCats]
                    .filter(
                      (c, i, arr) =>
                        arr.findIndex((x) => norm(x.slug || x.name) === norm(c.slug || c.name)) === i
                    )
                    .map((cat, idx) => (
                      <option key={cat._id || cat.slug || idx} value={cat.slug || cat.name}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-emerald-400">Sub-Category</label>
                <select
                  value={editForm.subCategory}
                  onChange={(e) => handleEditChange("subCategory", e.target.value)}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white cursor-pointer"
                >
                  <option value="">-- Select Sub-Category --</option>
                  {editSubCategories.map((sub) => (
                    <option key={sub._id} value={sub.slug || sub.name}>
                      ↳ {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Selling Price (৳) *</label>
                <input
                  type="number"
                  min="0"
                  value={editForm.price}
                  onChange={(e) => handleEditChange("price", e.target.value)}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white font-bold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Buying Price (৳)</label>
                <input
                  type="number"
                  min="0"
                  value={editForm.buyingPrice}
                  onChange={(e) => handleEditChange("buyingPrice", e.target.value)}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-amber-400">🌟 Reward Points (auto: profit ÷ 3.50)</label>
                <input
                  type="number"
                  readOnly
                  value={editForm.points}
                  className="w-full bg-[#0B132B] border border-amber-500/50 text-amber-400 font-black rounded-xl px-4 py-3 text-xs cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={editForm.stock}
                  onChange={(e) => handleEditChange("stock", e.target.value)}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-emerald-400">📦 Unit / Weight</label>
                <input
                  type="text"
                  value={editForm.unit}
                  onChange={(e) => handleEditChange("unit", e.target.value)}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white font-bold"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-300">Product Image</label>
                <div className="flex items-center gap-3">
                  {editImage && (
                    <img
                      src={editImage}
                      alt={editForm.title}
                      className="w-14 h-14 rounded-xl object-cover bg-white p-1 shrink-0"
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEditFileChange}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:bg-emerald-600 file:text-white file:font-bold cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-300">Product Description</label>
                <textarea
                  rows="3"
                  value={editForm.description}
                  onChange={(e) => handleEditChange("description", e.target.value)}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl p-4 text-xs text-white"
                />
              </div>

              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-3 bg-[#0F172A] border border-amber-500/40 rounded-2xl p-4 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!!editForm.isPopular}
                    onChange={(e) => handleEditChange("isPopular", e.target.checked)}
                    className="w-5 h-5 accent-amber-500 cursor-pointer"
                  />
                  <span className="text-xs font-black text-amber-400">
                    🔥 Popular Products-এ দেখান
                  </span>
                </label>

                <label className="flex items-center gap-3 bg-[#0F172A] border border-emerald-500/40 rounded-2xl p-4 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!!editForm.isComboPackage}
                    onChange={(e) => handleEditChange("isComboPackage", e.target.checked)}
                    className="w-5 h-5 accent-emerald-500 cursor-pointer"
                  />
                  <span className="text-xs font-black text-emerald-400">
                    🎁 Combo / Package Product
                  </span>
                </label>
              </div>

              <div className="sm:col-span-2 flex justify-end gap-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={savingEdit}
                  className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-7 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg cursor-pointer"
                >
                  {savingEdit ? "Saving..." : "💾 Save & Update Live"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}