import React from 'react'
import { Minus, Plus } from 'lucide-react'

export default function QuantitySelector({ value, onChange, min = 1, compact = false }) {
  const dec = () => onChange(Math.max(min, value - 1))
  const inc = () => onChange(value + 1)
  return (
    <div className="inline-flex items-center bg-slate-100 rounded-full p-1 gap-2">
      <button
        type="button"
        onClick={dec}
        className={`${compact ? 'w-7 h-7' : 'w-8 h-8'} rounded-full bg-white shadow-2xs flex items-center justify-center text-slate-700 active:scale-90 transition`}
        aria-label="Decrease quantity"
      >
        <Minus size={14} />
      </button>
      <span className="min-w-[2ch] text-center text-xs font-extrabold text-slate-800">{value}</span>
      <button
        type="button"
        onClick={inc}
        className={`${compact ? 'w-7 h-7' : 'w-8 h-8'} rounded-full bg-white shadow-2xs flex items-center justify-center text-slate-700 active:scale-90 transition`}
        aria-label="Increase quantity"
      >
        <Plus size={14} />
      </button>
    </div>
  )
}