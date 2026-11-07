import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronRight } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'

export default function Categories() {
  const { categories, products } = useApp()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const cats = useMemo(() => {
    const source = categories.length
      ? categories
      : (() => {
          const set = new Map()
          products.forEach(p => {
            const n = p.categoryName || p.category
            if (n) set.set(n, (set.get(n) || 0) + 1)
          })
          return Array.from(set.entries()).map(([name, count]) => ({ _id: name, name, count }))
        })()
    return query ? source.filter(c => String(c.name || c.categoryName || '').toLowerCase().includes(query.toLowerCase())) : source
  }, [categories, products, query])

  return (
    <div className="px-4 py-3 space-y-4">
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search categories..."
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-brand-green"
        />
      </div>

      <div className="space-y-2">
        {cats.map((c, i) => {
          const name = c.name || c.categoryName || c.category || 'Category'
          const count = c.count != null ? c.count : products.filter(p => (p.categoryName || p.category) === name).length
          return (
            <button
              key={c._id || i}
              onClick={() => navigate(`/category/${encodeURIComponent(name)}`)}
              className="w-full card p-3 flex items-center justify-between active:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-green-light text-brand-green flex items-center justify-center font-bold text-sm">
                  {name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-800">{name}</p>
                  <p className="text-xs text-slate-400">{count} product{count !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-300" />
            </button>
          )
        })}
        {cats.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No categories found.</p>}
      </div>
    </div>
  )
}
