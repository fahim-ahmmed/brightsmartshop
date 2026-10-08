import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI/DATABASE_URL missing in environment variables!");
  process.exit(1);
}

// 1. Define Schemas
const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
});

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  category: { type: String, required: true },
  image: { type: String },
  isFeatured: { type: Boolean, default: false },
  stock: { type: Number, default: 100 },
  description: { type: String },
  unit: { type: String, default: "1 pack" },
});

const Category = mongoose.models.Category || mongoose.model("Category", CategorySchema);
const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);

// 2. New Grocery & Package Categories
const newCategories = [
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

// 3. New Grocery & Package Products
const newProducts = [
  {
    name: "Standard Family Monthly Grocery Package",
    slug: "standard-family-monthly-grocery-package",
    price: 4500,
    originalPrice: 5000,
    category: "gifts-package",
    image: "/hero1.jpg",
    isFeatured: true,
    description: "Includes Miniket Rice (10kg), Soyabean Oil (5L), Masoor Dal (2kg), Sugar (2kg), Salt (1kg).",
  },
  {
    name: "Mini Monthly Ration Pack",
    slug: "mini-monthly-ration-pack",
    price: 2200,
    originalPrice: 2500,
    category: "gifts-package",
    image: "/hero2.jpg",
    isFeatured: true,
    description: "Essential grocery pack for small families and students.",
  },
  {
    name: "Premium Organic Fresh Grocery Box",
    slug: "premium-organic-fresh-grocery-box",
    price: 3500,
    originalPrice: 3800,
    category: "grocery-daily-essentials",
    image: "/hero3.jpg",
    isFeatured: true,
    description: "Farm-fresh organic vegetables, pure mustard oil, and spices.",
  },
  {
    name: "Fortified Soyabean Oil 5 Litre",
    slug: "fortified-soyabean-oil-5-litre",
    price: 810,
    originalPrice: 850,
    category: "grocery-daily-essentials",
    image: "/hero1.jpg",
    isFeatured: true,
  },
  {
    name: "Premium Miniket Rice 25 KG",
    slug: "premium-miniket-rice-25-kg",
    price: 1750,
    originalPrice: 1850,
    category: "grocery-daily-essentials",
    image: "/hero2.jpg",
    isFeatured: true,
  },
  {
    name: "Deshi Red Lentil (Masoor Dal) 1 KG",
    slug: "deshi-red-lentil-masoor-dal-1-kg",
    price: 140,
    originalPrice: 150,
    category: "grocery-daily-essentials",
    image: "/hero3.jpg",
    isFeatured: false,
  },
  {
    name: "Organic Mustard Oil (Pure Ghani) 1 Litre",
    slug: "organic-mustard-oil-pure-ghani-1-litre",
    price: 320,
    originalPrice: 350,
    category: "grocery-daily-essentials",
    image: "/hero1.jpg",
    isFeatured: true,
  },
  {
    name: "Skincare Essentials Beauty Combo",
    slug: "skincare-essentials-beauty-combo",
    price: 1250,
    originalPrice: 1500,
    category: "beauty-cosmetics",
    image: "/hero2.jpg",
    isFeatured: true,
  },
  {
    name: "Baby Care Hygiene & Wellness Kit",
    slug: "baby-care-hygiene-wellness-kit",
    price: 1800,
    originalPrice: 2000,
    category: "baby-care",
    image: "/hero3.jpg",
    isFeatured: false,
  },
  {
    name: "Multivitamin Dietary Supplements (60 Capsules)",
    slug: "multivitamin-dietary-supplements-60-capsules",
    price: 950,
    originalPrice: 1100,
    category: "dietary-suppliment",
    image: "/hero1.jpg",
    isFeatured: false,
  },
];

async function seedDatabase() {
  try {
    console.log("⏳ Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ MongoDB Connected Successfully.");

    // CLEAR OLD TECH DATA
    console.log("🧹 Wiping out old products & categories...");
    await Category.deleteMany({});
    await Product.deleteMany({});
    console.log("✅ Old Database Cleared!");

    // SEED NEW DATA
    console.log("🌱 Seeding new Grocery & Package Categories...");
    await Category.insertMany(newCategories);

    console.log("🌱 Seeding new Shop Products...");
    await Product.insertMany(newProducts);

    console.log("🎉 Database Successfully Seeded with Bright Smart Shop Products!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error Seeding Database:", error);
    process.exit(1);
  }
}

seedDatabase();