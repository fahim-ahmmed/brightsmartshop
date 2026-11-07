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
  const [sort, setSort] = useState('default') // default | low | high | points

  const decoded = decodeURIComponent(name)

  const list = useMemo(() => {
    let l = products.filter(p => {
      const cat = String(p.categoryName || p.category || '')
      return cat.toLowerCase() === decoded.toLowerCase()
    })
    if (query) l = l.filter(p => String(p.title).toLowerCase().includes(query.toLowerCase()))
    if (sort === 'low') l = [...l].sort((a, b) => a.price - b.price)
    if (sort === 'high') l = [...l].sort((a, b) => b.price - a.price)
    if (sort === 'points') l = [...l].sort((a, b) => (b.points || 0) - (a.points || 0))
    return l
  }, [products, decoded, query, sort])

  const sortLabel = { default: 'Default', low: 'Price: Low to High', high: 'Price: High to Low', points: 'Top Points' }[sort]

  return (
    <div className="px-4 py-3 space-y-4">
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search in ${decoded}...`}
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-brand-green"
        />
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-1.5 bg-brand-green-light text-brand-green px-3 py-1.5 rounded-full text-xs font-medium">
          <span className="truncate max-w-[60vw]">{decoded}</span>
          <button onClick={() => navigate('/categories')} className="ml-1" aria-label="Clear category">
            <X size={14} />
          </button>
        </div>
        <button onClick={() => setSort('default')} className="flex items-center gap-1 text-xs text-slate-600 px-3 py-1.5 bg-white border border-slate-200 rounded-full">
          <SlidersHorizontal size={13} /> Filter
        </button>
        <button
          onClick={() => {
            const order = ['default', 'low', 'high', 'points']
            setSort(order[(order.indexOf(sort) + 1) % order.length])
          }}
          className="flex items-center gap-1 text-xs text-slate-600 px-3 py-1.5 bg-white border border-slate-200 rounded-full"
        >
          <ArrowUpDown size={13} /> {sortLabel}
        </button>
      </div>

      <p className="text-xs text-slate-500">{list.length} product{list.length !== 1 ? 's' : ''}</p>

      {list.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-10">No products in this category.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {list.map(p => <ProductCard key={p._id} product={p} />)}
        </div>
      )}
    </div>
  )
}
