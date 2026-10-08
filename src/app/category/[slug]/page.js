import Link from "next/link";
import { dbConnect } from "@/lib/db";
import Product from "@/models/Product";
import Category from "@/models/Category";
import AssistantWidget from "@/features/assistant/AssistantWidget";

export async function generateMetadata({ params }) {
  try {
    const resolvedParams = await params;
    const slug = resolvedParams?.slug || "";
    const formattedTitle = slug.replace(/-/g, " ");
    return {
      title: `${formattedTitle.charAt(0).toUpperCase() + formattedTitle.slice(1)} | Bright Smart Shop`,
      description: `Explore top quality products under ${formattedTitle} category at Bright Smart Shop.`,
    };
  } catch (err) {
    return {
      title: "Category | Bright Smart Shop",
    };
  }
}

export default async function CategoryPage({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug || "";

  let products = [];
  let categoryName = slug.replace(/-/g, " ");

  try {
    await dbConnect();

    // 1. Fetch category details safely
    const category = await Category.findOne({ slug }).lean();
    if (category?.name) {
      categoryName = category.name;
    }

    // 2. Build Query (Matching by slug or category ID)
    const query = {
      $or: [
        { category: slug },
        ...(category ? [{ category: category._id }] : [])
      ]
    };

    const rawProducts = await Product.find(query).sort({ createdAt: -1 }).lean();
    products = JSON.parse(JSON.stringify(rawProducts));
  } catch (error) {
    console.error("Error fetching category products:", error);
  }

  return (
    <main className="min-h-screen bg-gray-50/50 text-gray-800 font-sans pb-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
        
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
          <Link href="/" className="hover:text-emerald-600 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/categories" className="hover:text-emerald-600 transition-colors">
            Categories
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium capitalize">
            {categoryName}
          </span>
        </nav>

        {/* Category Header */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-md border border-emerald-100">
              Category
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight capitalize mt-2">
              {categoryName}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Showing {products.length} {products.length === 1 ? "product" : "products"} available in this category
            </p>
          </div>

          <Link
            href="/shop"
            className="px-5 py-2.5 bg-gray-100 hover:bg-emerald-600 hover:text-white text-gray-700 font-semibold text-sm rounded-xl transition-all w-fit"
          >
            Explore All Products
          </Link>
        </div>

        {/* Product Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <Link
                key={product._id}
                href={`/product/${product.slug}`}
                className="group bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="relative w-full h-48 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center p-2">
                    <img
                      src={product.image || "/hero1.jpg"}
                      alt={product.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="font-semibold text-gray-800 text-sm group-hover:text-emerald-600 transition-colors line-clamp-2">
                    {product.name}
                  </h3>
                </div>

                <div className="pt-3 border-t border-gray-50 mt-3 flex items-center justify-between">
                  <div>
                    <span className="text-base font-bold text-emerald-700">
                      ৳{product.price}
                    </span>
                    {product.originalPrice && (
                      <span className="text-xs text-gray-400 line-through ml-2">
                        ৳{product.originalPrice}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    View
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center space-y-4">
            <div className="text-4xl">📦</div>
            <h3 className="text-lg font-bold text-gray-800">No products found in this category</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              We haven't added any products to this category yet. Check back soon or browse other available categories.
            </p>
            <div className="pt-2">
              <Link
                href="/shop"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-sm transition-all inline-block"
              >
                Browse Shop
              </Link>
            </div>
          </div>
        )}

      </div>

      <AssistantWidget />
    </main>
  );
}