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
    originalPrice: {
      type: Number,
      default: 0,
    },
    points: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      enum: [
        "Grocery",
        "Fashion",
        "Cosmetics",
        "Beauty Care",
        "Health & Medicine",
        "Electronics",
        "Home & Kitchen",
        "Offers",
      ],
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