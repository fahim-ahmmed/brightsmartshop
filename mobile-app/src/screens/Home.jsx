import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronRight } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import ProductCard from '../components/ProductCard.jsx'

export default function Home() {
  const { products, categories, banners, loading, loadCatalog } = useApp()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const packageProducts = useMemo(
    () => products.filter(p => p.isComboPackage || p.isPackage || String(p.category).toLowerCase() === 'package' || String(p.categoryName).toLowerCase() === 'package'),
    [products],
  )
  const popularProducts = useMemo(
    () => products.filter(p => !(p.isComboPackage || p.isPackage || String(p.category).toLowerCase() === 'package' || String(p.categoryName).toLowerCase() === 'package')),
    [products],
  )

  const filtered = query
    ? products.filter(p => String(p.title).toLowerCase().includes(query.toLowerCase()))
    : null

  const bannerList = Array.isArray(banners) && banners.length
    ? banners
    : [
        { _id: 'b1', title: 'Welcome to Bright Smart Shop', subtitle: 'Smart Shopping, Better Living', image: '' },
      ]

  return (
    <div className="px-4 py-3 space-y-5">
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products..."
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-brand-green"
        />
      </div>

      {filtered ? (
        <section>
          <h2 className="text-sm font-semibold text-slate-700 mb-2">Search results ({filtered.length})</h2>
          {filtered.length === 0
            ? <p className="text-sm text-slate-400">No products found.</p>
            : <div className="grid grid-cols-2 gap-3">{filtered.map(p => <ProductCard key={p._id} product={p} />)}</div>}
        </section>
      ) : (
        <>
          <section className="-mx-4 px-4 overflow-x-auto no-scrollbar">
            <div className="flex gap-3 snap-x snap-mandatory">
              {bannerList.map((b, i) => (
                <div
                  key={b._id || i}
                  className="snap-center shrink-0 w-[85%] h-32 rounded-2xl bg-gradient-to-br from-brand-green to-emerald-600 text-white p-4 flex flex-col justify-center"
                >
                  <p className="font-bold text-base">{b.title || 'Bright Smart Shop'}</p>
                  <p className="text-white/85 text-xs mt-1">{b.subtitle || 'Smart Shopping, Better Living'}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-slate-800">Shop by Category</h2>
              <button onClick={() => navigate('/categories')} className="text-xs text-brand-green font-medium flex items-center">See all <ChevronRight size={14} /></button>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {(categories.length ? categories : [{ name: 'All', _id: 'all' }]).map((c, i) => {
                const name = c.name || c.categoryName || c.category || 'Category'
                return (
                  <button
                    key={c._id || i}
                    onClick={() => navigate(`/category/${encodeURIComponent(name)}`)}
                    className="shrink-0 bg-brand-green-light text-brand-green px-3 py-1.5 rounded-full text-xs font-medium"
                  >
                    {name}
                  </button>
                )
              })}
            </div>
          </section>

          {packageProducts.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-slate-800">Package Products <span className="text-slate-400 font-normal">/ কম্বো প্যাকেজ</span></h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {packageProducts.map(p => <ProductCard key={p._id} product={p} />)}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-sm font-semibold text-slate-800 mb-2">Popular Products</h2>
            {loading ? (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="card h-64 animate-pulse bg-slate-100" />
                ))}
              </div>
            ) : popularProducts.length === 0 ? (
              <p className="text-sm text-slate-400">No products available.</p>
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
