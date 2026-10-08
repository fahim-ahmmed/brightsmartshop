import Link from "next/link";
import { dbConnect } from "@/lib/db";
import Product from "@/models/Product";
import Category from "@/models/Category";
import ShopListing from "@/features/shop/components/ShopListing";
import AssistantWidget from "@/features/assistant/AssistantWidget";

export const metadata = {
  title: "Shop | Bright Smart Shop",
  description: "Explore all products, grocery packages, and daily essentials with custom filtering at Bright Smart Shop.",
};

export default async function ShopPage({ searchParams }) {
  await dbConnect();
  const params = await searchParams;

  const search = params?.search || "";
  const category = params?.category || "all";
  const minPrice = params?.minPrice ? Number(params.minPrice) : 0;
  const maxPrice = params?.maxPrice ? Number(params.maxPrice) : Infinity;
  const featured = params?.featured === "true";

  // Build MongoDB Query
  const query = { isActive: { $ne: false } };

  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  if (category && category !== "all") {
    query.category = category;
  }

  if (minPrice > 0 || maxPrice < Infinity) {
    query.price = {};
    if (minPrice > 0) query.price.$gte = minPrice;
    if (maxPrice < Infinity) query.price.$lte = maxPrice;
  }

  if (featured) {
    query.isFeatured = true;
  }

  // Fetch Products & Categories
  const [rawProducts, rawCategories] = await Promise.all([
    Product.find(query).sort({ createdAt: -1 }).lean(),
    Category.find({ isActive: { $ne: false } }).lean(),
  ]);

  const products = JSON.parse(JSON.stringify(rawProducts));
  const categories = JSON.parse(JSON.stringify(rawCategories));

  return (
    <main className="min-h-screen bg-gray-50/50 text-gray-800 font-sans pb-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* Title */}
        <div>
          <h1 className="text-xl font-medium text-gray-700">The shop</h1>
        </div>

        {/* Filter Bar & Product Grid */}
        <ShopListing products={products} categories={categories} />

      </div>

      <AssistantWidget />
    </main>
  );
}