import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Grid3x3, User } from 'lucide-react'

const tabs = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/categories', label: 'Categories', icon: Grid3x3 },
  { to: '/me', label: 'Me', icon: User },
]

export default function BottomNav() {
  const location = useLocation()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 flex">
      {tabs.map(t => {
        const active = location.pathname === t.to
        const Icon = t.icon
        return (
          <Link
            key={t.to}
            to={t.to}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 ${active ? 'text-brand-green' : 'text-slate-400'}`}
          >
            <Icon size={22} />
            <span className="text-[11px] font-medium">{t.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
