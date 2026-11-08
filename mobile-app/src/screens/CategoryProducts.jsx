import React, { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Search, SlidersHorizontal, ArrowUpDown, X } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import ProductCard from '../components/ProductCard.jsx'

export default function CategoryProducts() {
  const { name } = useParams()
  const navigate = useNavigate()
  const { products } = useApp()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('default')

  const decoded = decodeURIComponent(name || '')

  const list = useMemo(() => {
    let l = products.filter(p => {
      const cat = String(p.categoryName || p.category || '').toLowerCase()
      const target = decoded.toLowerCase()
      if (target === 'package') {
        return p.isComboPackage || p.isPackage || cat.includes('package') || cat.includes('প্যাকেজ')
      }
      return cat === target || cat.includes(target)
    })
    if (query.trim()) {
      l = l.filter(p => String(p.title).toLowerCase().includes(query.toLowerCase()))
    }
    if (sort === 'low') l = [...l].sort((a, b) => a.price - b.price)
    if (sort === 'high') l = [...l].sort((a, b) => b.price - a.price)
    if (sort === 'points') l = [...l].sort((a, b) => (b.points || 0) - (a.points || 0))
    return l
  }, [products, decoded, query, sort])

  const sortLabel = {
    default: 'Default',
    low: 'Low to High',
    high: 'High to Low',
    points: 'Top Points',
  }[sort]

  return (
    <div className="px-4 py-3 space-y-3.5">
      <div className="relative">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products..."
          className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[#006E32]"
        />
      </div>

      <div className="flex items-center justify-between pt-1">
        <h1 className="text-base font-extrabold text-slate-900">{decoded}</h1>
        <span className="text-xs text-slate-400 font-medium">
          {list.length} {list.length === 1 ? 'product' : 'products'}
        </span>
      </div>

      {/* Filter & Sort Bar (Matches 05 Category products.pdf) */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="flex items-center gap-1 text-xs font-bold text-slate-700 px-3 py-1.5 bg-white border border-slate-200 rounded-full">
          <SlidersHorizontal size={13} /> Filter
        </span>

        <span className="inline-flex items-center gap-1.5 bg-[#E8F5E9] text-[#006E32] px-3 py-1.5 rounded-full text-xs font-bold">
          {decoded}
          <button onClick={() => navigate('/categories')} aria-label="Remove filter">
            <X size={13} />
          </button>
        </span>

        <button
          onClick={() => navigate('/categories')}
          className="text-xs text-slate-400 font-semibold hover:text-slate-600"
        >
          Clear all
        </button>

        <button
          onClick={() => {
            const order = ['default', 'low', 'high', 'points']
            setSort(order[(order.indexOf(sort) + 1) % order.length])
          }}
          className="ml-auto flex items-center gap-1 text-xs font-semibold text-slate-700 px-3 py-1.5 bg-white border border-slate-200 rounded-full"
        >
          <ArrowUpDown size={13} /> Sort: {sortLabel}
        </button>
      </div>

      <p className="text-xs text-slate-400">
        Showing {list.length} of {list.length} {list.length === 1 ? 'product' : 'products'}
      </p>

      {list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
          <p className="text-sm text-slate-500">No products available in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {list.map(p => <ProductCard key={p._id} product={p} />)}
        </div>
      )}
    </div>
  )
}