import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ShoppingBag, Heart, MapPin,
  User, Truck, FileText, RefreshCw, Phone, LogOut, ChevronRight
} from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: ShoppingBag, label: 'My Orders', path: '/orders' },
  { icon: Heart, label: 'My Wishlist', path: '/wishlist' },
  { icon: Truck, label: 'Track Order', path: '/orders' },
  { icon: User, label: 'Profile', path: '/profile' },
  { icon: MapPin, label: 'Address', path: '/address' },
  { icon: FileText, label: 'Shipping Policy', path: '/shipping' },
  { icon: RefreshCw, label: 'Return & Refund', path: '/refund' },
  { icon: Phone, label: 'Contact Us', path: '/contact' },
]

export default function MeHub() {
  const { user, logout, cart, wishlist } = useApp()
  const navigate = useNavigate()

  const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const go = (path) => {
    if (path === '/profile' || path === '/address' || path === '/shipping' || path === '/refund' || path === '/contact') {
      alert('Coming soon')
      return
    }
    navigate(path)
  }

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Profile card */}
      <div className="card p-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-brand-green text-white font-bold text-xl flex items-center justify-center">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-800 truncate">{user?.name || 'Customer'}</p>
            <p className="text-sm text-slate-500 truncate">{user?.phone || user?.email || '—'}</p>
          </div>
        </div>
        <div className="flex mt-4 border-t border-slate-100 pt-4">
          {[
            { label: 'Orders', value: '—' },
            { label: 'Wishlist', value: wishlist.length },
            { label: 'Cart', value: cart.reduce((s, i) => s + i.quantity, 0) },
          ].map(s => (
            <div key={s.label} className="flex-1 text-center">
              <p className="text-lg font-bold text-brand-green">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Menu */}
      <div className="card overflow-hidden">
        {menuItems.map((item, i) => {
          const Icon = item.icon
          return (
            <button
              key={item.label}
              onClick={() => go(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 active:bg-slate-50 ${i !== menuItems.length - 1 ? 'border-b border-slate-100' : ''}`}
            >
              <Icon size={18} className="text-brand-green shrink-0" />
              <span className="flex-1 text-left text-sm font-medium text-slate-800">{item.label}</span>
              <ChevronRight size={16} className="text-slate-300" />
            </button>
          )
        })}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full card px-4 py-3.5 flex items-center gap-3 text-red-500"
      >
        <LogOut size={18} />
        <span className="text-sm font-medium">Log out</span>
      </button>
    </div>
  )
}
