import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronRight } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { resolveImageUrl } from '../api/index.js'

const CATEGORY_IMAGES = {
  package: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=200&auto=format&fit=crop&q=80',
  grocery: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80',
  'grocery & daily essentials': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80',
  'হিজাব': 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=200&auto=format&fit=crop&q=80',
  fashion: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=200&auto=format&fit=crop&q=80',
  'fashion & accessories': 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=200&auto=format&fit=crop&q=80',
  offers: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=200&auto=format&fit=crop&q=80',
  cosmetics: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&auto=format&fit=crop&q=80',
  'beauty care': 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=200&auto=format&fit=crop&q=80',
  'beauty & cosmetics': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&auto=format&fit=crop&q=80',
  'health & medicine': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&auto=format&fit=crop&q=80',
  'health & personal care': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&auto=format&fit=crop&q=80',
  'baby care': 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=200&auto=format&fit=crop&q=80',
  electronics: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=200&auto=format&fit=crop&q=80',
  'electronics & gadgets': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=200&auto=format&fit=crop&q=80',
  'home & kitchen': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=200&auto=format&fit=crop&q=80',
  'dietary supplement': 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=200&auto=format&fit=crop&q=80',
  'all products': 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=200&auto=format&fit=crop&q=80',
}

// ওয়েবসাইটের ইনবিল্ট ক্যাটাগরিগুলো
const INBUILT_CATEGORIES = [
  { name: 'Grocery & Daily Essentials', slug: 'grocery-daily-essentials' },
  { name: 'Beauty & Cosmetics', slug: 'beauty-cosmetics' },
  { name: 'Home & Kitchen', slug: 'home-kitchen' },
  { name: 'Fashion & Accessories', slug: 'fashion-accessories' },
  { name: 'Health & Personal Care', slug: 'health-personal-care' },
  { name: 'Baby Care', slug: 'baby-care' },
  { name: 'Electronics & Gadgets', slug: 'electronics-gadgets' },
  { name: 'Dietary Supplement', slug: 'dietary-supplement' },
  { name: 'All products', slug: 'all-products' },
]

export default function Categories() {
  const { categories } = useApp()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const cats = useMemo(() => {
    const dbList = Array.isArray(categories) ? categories : []
    const seen = new Set()
    const merged = []

    const addUnique = (c) => {
      const name = String(c.name || c.categoryName || c.category || c || '').trim()
      const slug = String(c.slug || '').trim().toLowerCase()
      const nameLower = name.toLowerCase()

      if (!name || nameLower === 'all') return
      if (seen.has(nameLower) || (slug && seen.has(slug))) return

      seen.add(nameLower)
      if (slug) seen.add(slug)
      merged.push(typeof c === 'string' ? { name } : c)
    }

    // প্রথমে অ্যাপ/ডাটাবেজের ক্যাটাগরিগুলো থাকবে
    dbList.forEach(addUnique)

    // এরপর ওয়েবসাইটের ইনবিল্ট ক্যাটাগরিগুলো যুক্ত হবে (ডুপ্লিকেট বাদ দিয়ে)
    INBUILT_CATEGORIES.forEach(addUnique)

    if (!query.trim()) return merged
    return merged.filter((c) =>
      String(c.name || c.categoryName || '').toLowerCase().includes(query.toLowerCase())
    )
  }, [categories, query])

  return (
    <div className="px-4 py-3 space-y-4">
      <div className="relative">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products..."
          className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[#006E32]"
        />
      </div>

      <div>
        <h2 className="text-base font-extrabold text-slate-900 border-l-4 border-[#006E32] pl-2.5 mb-3">
          All Categories
        </h2>

        <div className="space-y-2.5">
          {cats.map((c, i) => {
            const name = c.name || c.categoryName || c.category || 'Category'
            const img = c.image
              ? resolveImageUrl(c.image)
              : (CATEGORY_IMAGES[String(name).toLowerCase()] || CATEGORY_IMAGES.grocery)

            return (
              <button
                key={c._id || c.slug || i}
                onClick={() => navigate(`/category/${encodeURIComponent(name)}`)}
                className="w-full bg-white rounded-2xl border border-slate-100 p-3 flex items-center justify-between shadow-2xs active:scale-[0.99] transition"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 shrink-0">
                    <img
                      src={img}
                      alt={name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = 'https://placehold.co/96x96/E8F5E9/007A4D?text=BSS' }}
                    />
                  </div>
                  <span className="text-sm font-bold text-slate-800">{name}</span>
                </div>
                <ChevronRight size={18} className="text-slate-400" />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}