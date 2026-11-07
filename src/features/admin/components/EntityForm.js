"use client";

import React, { useState } from "react";
import { createProductWithFileUpload } from "@/features/admin/actions";

export default function EntityForm({ categories = [] }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [imagePreview, setImagePreview] = useState(null);

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

  // Local Image Selection & Preview Handler
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    const formData = new FormData(e.target);
    const result = await createProductWithFileUpload(formData);

    setLoading(false);

    if (result.success) {
      setMessage({ type: "success", text: result.message });
      setImagePreview(null);
      e.target.reset();
    } else {
      setMessage({ type: "error", text: result.error });
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-100 flex items-center gap-2">
        <span>📷</span> লোকাল ডিভাইস থেকে ছবি সহ নতুন প্রোডাক্ট আপলোড
      </h2>

      {message.text && (
        <div
          className={`p-4 mb-6 rounded-xl text-sm font-semibold ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" encType="multipart/form-data">
        {/* Product Title */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            প্রোডাক্টের নাম / টাইটেল *
          </label>
          <input
            type="text"
            name="name"
            required
            placeholder="যেমন: Standard Family Monthly Grocery Package"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
          />
        </div>

        {/* Category & Price Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              ক্যাটাগরি *
            </label>
            <select
              name="category"
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none bg-white"
            >
              <option value="">ক্যাটাগরি সিলেক্ট করুন</option>
              {categoryOptions.map((cat) => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              বর্তমান মূল্যে (৳) *
            </label>
            <input
              type="number"
              name="price"
              required
              placeholder="যেমন: 4500"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
            />
          </div>
        </div>

        {/* Local File Input Box */}
        <div className="p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-300 space-y-3">
          <label className="block text-sm font-semibold text-gray-800">
            লোকাল কম্পিউটার/মোবাইল থেকে পিক সিলেক্ট করুন
          </label>
          <input
            type="file"
            name="imageFile"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
          />

          {imagePreview && (
            <div className="mt-3 flex items-center gap-3">
              <span className="text-xs text-gray-500 font-medium">প্রিভিউ:</span>
              <img
                src={imagePreview}
                alt="Selected preview"
                className="w-20 h-20 object-cover rounded-xl border border-gray-200 shadow-sm"
              />
            </div>
          )}
        </div>

        {/* Product Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            প্যাকেজ / প্রোডাক্টের বিবরণ
          </label>
          <textarea
            name="description"
            rows="3"
            placeholder="প্রোডাক্টের বিবরণ লিখুন..."
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
          ></textarea>
        </div>

        {/* Featured Switch */}
        <div className="flex items-center gap-3 pt-1">
          <input
            type="checkbox"
            id="isFeatured"
            name="isFeatured"
            value="true"
            className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
          />
          <label htmlFor="isFeatured" className="text-sm font-medium text-gray-800">
            হোমপেজের "Our Packages" বা "Featured Products" সেকশনে দেখাও
          </label>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center disabled:opacity-50"
          >
            {loading ? "ছবি আপলোড ও সেভ হচ্ছে..." : "পিকচার সহ প্রোডাক্ট সেভ করুন"}
          </button>
        </div>
      </form>
    </div>
  );
}