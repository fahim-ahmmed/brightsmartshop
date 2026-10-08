import Link from "next/link";
import { notFound } from "next/navigation";
import { dbConnect } from "@/lib/db";
import Product from "@/models/Product";
import ProductPurchase from "@/features/shop/components/ProductPurchase";
import AssistantWidget from "@/features/assistant/AssistantWidget";

// Dynamic Metadata
export async function generateMetadata({ params }) {
  const { slug } = await params;
  await dbConnect();
  const product = await Product.findOne({ slug }).lean();

  if (!product) {
    return { title: "Product Not Found | Bright Smart Shop" };
  }

  return {
    title: `${product.name} | Bright Smart Shop`,
    description: product.description || `Buy ${product.name} at best price from Bright Smart Shop.`,
  };
}

export default async function ProductDetailPage({ params }) {
  const { slug } = await params;
  await dbConnect();

  const rawProduct = await Product.findOne({ slug }).lean();

  if (!rawProduct) {
    notFound();
  }

  const product = JSON.parse(JSON.stringify(rawProduct));

  // Related Products Fetching
  const rawRelated = await Product.find({
    category: product.category,
    _id: { $ne: product._id },
  })
    .limit(4)
    .lean();

  const relatedProducts = JSON.parse(JSON.stringify(rawRelated));

  return (
    <main className="min-h-screen bg-gray-50/50 text-gray-800 font-sans pb-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-10">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
          <Link href="/" className="hover:text-emerald-600 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-emerald-600 transition-colors">
            Shop
          </Link>
          <span>/</span>
          <Link
            href={`/category/${product.category}`}
            className="hover:text-emerald-600 transition-colors capitalize"
          >
            {product.category?.replace(/-/g, " ")}
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium truncate max-w-[200px] sm:max-w-xs">
            {product.name}
          </span>
        </nav>

        {/* Main Product Display Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 lg:p-10">
          <ProductPurchase product={product} />
        </div>

        {/* Product Details & Specifications Tab */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
              Product Details & Specifications
            </h2>
          </div>
          <div className="prose prose-emerald max-w-none text-gray-600 text-sm sm:text-base leading-relaxed whitespace-pre-line">
            {product.description || (
              <p className="text-gray-400 italic">
                No extra description available for this product package. Rest assured, all items provided by Bright Smart Shop are 100% genuine and farm-fresh.
              </p>
            )}
          </div>
        </div>

        {/* Service Benefits Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
            <div className="text-3xl">🚚</div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">Fast Delivery</h4>
              <p className="text-xs text-gray-500 mt-0.5">Quick delivery right at your door</p>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
            <div className="text-3xl">💰</div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">Cash on Delivery</h4>
              <p className="text-xs text-gray-500 mt-0.5">Pay after inspecting product</p>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
            <div className="text-3xl">☑️</div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">100% Genuine</h4>
              <p className="text-xs text-gray-500 mt-0.5">Authentic quality guaranteed</p>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
            <div className="text-3xl">🎁</div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">Earn Points</h4>
              <p className="text-xs text-gray-500 mt-0.5">Get reward points with every order</p>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <section className="space-y-6 pt-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                Related Products
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                More items from the same category you might like
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {relatedProducts.map((item) => (
                <Link
                  key={item._id}
                  href={`/product/${item.slug}`}
                  className="group bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="relative w-full h-48 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center">
                      <img
                        src={item.image || "/hero1.jpg"}
                        alt={item.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <h4 className="font-semibold text-gray-800 text-sm group-hover:text-emerald-600 transition-colors line-clamp-2">
                      {item.name}
                    </h4>
                  </div>

                  <div className="pt-3 border-t border-gray-50 mt-3 flex items-center justify-between">
                    <div>
                      <span className="text-base font-bold text-emerald-700">
                        ৳{item.price}
                      </span>
                      {item.originalPrice && (
                        <span className="text-xs text-gray-400 line-through ml-2">
                          ৳{item.originalPrice}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                      View
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

      </div>

      <AssistantWidget />
    </main>
  );
}