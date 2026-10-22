import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Product title is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    price: {
      type: Number,
      required: [true, "Selling price is required"],
      min: 0,
    },
    buyingPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    costPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    originalPrice: {
      type: Number,
      default: 0,
    },
    discountPrice: {
      type: Number,
      default: 0,
    },
    points: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    categoryName: {
      type: String,
      default: "",
    },
    subCategory: {
      type: String,
      default: "",
      trim: true,
    },
    subCategoryName: {
      type: String,
      default: "",
    },
    unit: {
      type: String,
      default: "1 Pcs",
    },
    description: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: "📦",
    },
    stock: {
      type: Number,
      default: 100,
    },
    // 🟢 হোমপেজের Popular Products সেকশনে দেখানোর ফিল্ড
    isPopular: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPermanent: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Product || mongoose.model("Product", ProductSchema);