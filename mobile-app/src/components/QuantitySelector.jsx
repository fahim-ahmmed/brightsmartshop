import React, { useState } from 'react'
import { Minus, Plus } from 'lucide-react'

export default function QuantitySelector({ value, onChange, min = 1 }) {
  const dec = () => onChange(Math.max(min, value - 1))
  const inc = () => onChange(value + 1)
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={dec}
        className="w-9 h-9 rounded-lg border border-slate-300 flex items-center justify-center text-slate-700 active:bg-slate-100"
        aria-label="Decrease quantity"
      >
        <Minus size={16} />
      </button>
      <span className="min-w-[2ch] text-center font-semibold text-slate-800">{value}</span>
      <button
        onClick={inc}
        className="w-9 h-9 rounded-lg border border-slate-300 flex items-center justify-center text-slate-700 active:bg-slate-100"
        aria-label="Increase quantity"
      >
        <Plus size={16} />
      </button>
    </div>
  )
}
