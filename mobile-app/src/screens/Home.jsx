import React, { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import ProductCard from '../components/ProductCard.jsx'
import { resolveImageUrl } from '../api/index.js'
import { BssLogo } from '../components/Header.jsx'

const CATEGORY_IMAGES = {
  grocery: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80',
  'হিজাব': 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=200&auto=format&fit=crop&q=80',
  fashion: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=200&auto=format&fit=crop&q=80',
  offers: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=200&auto=format&fit=crop&q=80',
  cosmetics: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&auto=format&fit=crop&q=80',
  'beauty care': 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=200&auto=format&fit=crop&q=80',
  package: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=200&auto=format&fit=crop&q=80',
}

export default function Home() {
  const { products, categories, banners, loading } = useApp()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [activeSlide, setActiveSlide] = useState(0)

  const packageProducts = useMemo(
    () => products.filter(p =>
      p.isComboPackage ||
      p.isPackage ||
      String(p.category).toLowerCase().includes('package') ||
      String(p.category).includes('প্যাকেজ')
    ),
    [products]
  )

  const popularProducts = useMemo(
    () => products.length > 0 ? products : [],
    [products]
  )

  const filtered = query.trim()
    ? products.filter(p => String(p.title).toLowerCase().includes(query.toLowerCase()))
    : null

  const slideBanners = useMemo(() => {
    if (Array.isArray(banners) && banners.length > 0) {
      return banners.map((b, i) => ({
        _id: b._id || i,
        image: resolveImageUrl(b.image || b.imageUrl || b.url),
        title: b.title || 'Bright Smart Shop',
        subtitle: b.subtitle || 'Smart Shopping, Better Living',
      }))
    }
    return [
      {
        _id: 'hero-1',
        image: 'https://brightsmartshop24.com/hero1.jpg',
        fallbackImage: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&auto=format&fit=crop&q=80',
        title: 'ঈদ ও বিশেষ ফ্যাশন কালেকশন',
        subtitle: 'সেরা মানের শাড়ি, পাঞ্জাবি ও ফ্যামিলি প্যাকেজ',
      },
      {
        _id: 'hero-2',
        image: 'https://brightsmartshop24.com/banner1.jpg',
        fallbackImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80',
        title: 'মেগা ফ্যামিলি প্যাকেজ',
        subtitle: 'সব দরকারী পণ্য এক সাথে সাশ্রয়ী মূল্যে!',
      },
    ]
  }, [banners])

  useEffect(() => {
    if (slideBanners.length <= 1) return
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % slideBanners.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [slideBanners.length])

  const homeCategories = useMemo(() => {
    const list = categories.filter(c => String(c.name || c).toLowerCase() !== 'all')
    return list.slice(0, 6)
  }, [categories])

  return (
    <div className="px-4 pt-3 pb-6 space-y-5">
      {/* Search Bar */}
      <div className="relative">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products..."
          className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#007A4D] shadow-2xs"
        />
      </div>

      {filtered ? (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-extrabold text-slate-900 border-l-4 border-[#007A4D] pl-2.5">
              Search Results
            </h2>
            <span className="text-xs text-slate-500 font-medium">{filtered.length} products</span>
          </div>
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
              <p className="text-sm text-slate-500">No matching products found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filtered.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          )}
        </section>
      ) : (
        <>
          {/* Promotional Banner Slider (Matches 03 Home.pdf) */}
          <section className="relative rounded-2xl overflow-hidden shadow-xs border border-slate-100 bg-gradient-to-r from-[#E8F5E9] via-white to-orange-50">
            <div className="relative h-44 w-full">
              {slideBanners.map((b, i) => (
                <div
                  key={b._id || i}
                  className={`absolute inset-0 transition-opacity duration-500 ${i === activeSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                >
                  <img
                    src={b.image}
                    alt={b.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      if (b.fallbackImage && e.target.src !== b.fallbackImage) {
                        e.target.src = b.fallbackImage
                      }
                    }}
                  />
                  <div className="absolute top-3 right-3 bg-white/95 px-2.5 py-1 rounded-xl shadow-xs">
                    <BssLogo size="sm" />
                  </div>
                </div>
              ))}
            </div>

            {/* Slider Dots */}
            <div className="flex items-center justify-center gap-1.5 py-2 bg-white">
              {slideBanners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSlide(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === activeSlide ? 'w-5 bg-[#007A4D]' : 'w-1.5 bg-slate-300'
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </section>

          {/* Shop by Category (Matches 03 Home.pdf 3x2 Image Grid) */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-extrabold text-slate-900 border-l-4 border-[#007A4D] pl-2.5 leading-none">
                Shop by Category
              </h2>
              <button
                onClick={() => navigate('/categories')}
                className="text-xs text-[#007A4D] font-bold hover:underline"
              >
                See all
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {homeCategories.map((c, i) => {
                const name = c.name || c.categoryName || c.category || 'Category'
                const catImg = c.image
                  ? resolveImageUrl(c.image)
                  : (CATEGORY_IMAGES[String(name).toLowerCase()] || CATEGORY_IMAGES.grocery)

                return (
                  <button
                    key={c._id || i}
                    onClick={() => navigate(`/category/${encodeURIComponent(name)}`)}
                    className="bg-white rounded-2xl border border-slate-100 p-2.5 flex flex-col items-center justify-center gap-2 shadow-2xs active:scale-95 transition"
                  >
                    <div className="w-14 h-12 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center">
                      <img
                        src={catImg}
                        alt={name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = 'https://placehold.co/100x80/E8F5E9/007A4D?text=BSS' }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-800 truncate w-full text-center">
                      {name}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Package Products / কম্বো প্যাকেজ Section */}
          {packageProducts.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-extrabold text-slate-900 border-l-4 border-[#007A4D] pl-2.5 leading-none">
                  Package Products <span className="text-xs text-slate-500 font-semibold">(কম্বো প্যাকেজ)</span>
                </h2>
                <span className="text-xs text-slate-400 font-medium">
                  {packageProducts.length} {packageProducts.length === 1 ? 'product' : 'products'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {packageProducts.map(p => <ProductCard key={p._id} product={p} />)}
              </div>
            </section>
          )}

          {/* Popular Products Section (Matches 03 Home.pdf) */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-extrabold text-slate-900 border-l-4 border-[#007A4D] pl-2.5 leading-none">
                Popular Products
              </h2>
              <span className="text-xs text-slate-400 font-medium">
                {popularProducts.length} {popularProducts.length === 1 ? 'product' : 'products'}
              </span>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl h-72 animate-pulse border border-slate-100 p-3" />
                ))}
              </div>
            ) : popularProducts.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center border border-slate-100">
                <p className="text-sm text-slate-500">No products available right now.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {popularProducts.map(p => <ProductCard key={p._id} product={p} />)}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}