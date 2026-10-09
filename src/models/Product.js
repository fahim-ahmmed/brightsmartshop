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
      unique: true,
      lowercase: true,
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: 0,
    },
    points: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
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
    // Permanent retention flag (চিরস্থায়ী সংরক্ষণের জন্য)
    isActive: {
      type: Boolean,
      default: true,
    },
    isPermanent: {
      type: Boolean,
      default: true, // এটি নিশ্চিত করবে প্রোডাক্ট রেকর্ড স্থায়ী থাকবে
    },
  },
  {
    timestamps: true, // প্রোডাক্ট আপলোডের তারিখ ও সময় স্থায়ীভাবে থাকবে
  }
);

export default mongoose.models.Product || mongoose.model("Product", ProductSchema);