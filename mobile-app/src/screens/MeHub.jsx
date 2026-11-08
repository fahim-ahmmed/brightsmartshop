import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Award, Layers, Users, Wallet,
  ShoppingBag, Heart, UserCheck, LogOut, ChevronRight
} from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { api, resolveImageUrl } from '../api/index.js'

export default function MeHub() {
  const { user, setUser, logout, cartCount, wishlist } = useApp()
  const navigate = useNavigate()
  const [dashData, setDashData] = useState(null)

  useEffect(() => {
    let active = true
    const uid = user?._id || user?.id || ''
    const phone = user?.phone || user?.mobile || ''
    ;(async () => {
      try {
        const dRes = await api.getDashboardStats(uid, phone, user?.email || '')
        if (active && dRes) {
          setDashData(dRes)
          if (dRes.user) {
            setUser({
              ...user,
              ...dRes.user,
              id: dRes.user.referralCode || dRes.user.id || user?.id,
              referralCode: dRes.user.referralCode || dRes.user.id || user?.referralCode,
              profileImage: dRes.user.profileImage || user?.profileImage || '',
            })
          }
        }
      } catch (e) {
        console.error(e)
      }
    })()
    return () => { active = false }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const stats = dashData?.stats || {}
  const u = dashData?.user || user || {}
  const level = Number(stats.currentLevel || 0)
  const mainLevel = Number(stats.mainLevel ?? level)
  const designation = stats.designation || 'New Member'
  const wallet = Number(stats.walletBalance || 0)
  const reserve = Number(stats.reservePoints || 0)
  const pointsNeeded = 40 - (reserve % 40)
  const reserveProgressPercent = Math.min(100, ((reserve % 40) / 40) * 100)

  const totalPackagesAfterMe = Number(stats.accumulatedPackages || 0)
  const currentStepPackages = Number(stats.currentStepPackages || 0)
  const nextLevelTargetPackages = Number(stats.nextLevelTarget || 3)
  const packagesNeededForNextLevel = Math.max(0, nextLevelTargetPackages - currentStepPackages)

  const myChainNodes = dashData?.myChainNodes || []
  const ownPackages = myChainNodes.length || Number(stats.totalPackages || 0)
  const totalOrders = Number(stats.totalOrders || 0)
  const totalSponsors = Number(stats.totalSponsors || (dashData?.sponsorList?.length ?? 0))

  const avatarUrl = resolveImageUrl(u.profileImage || u.image || user?.profileImage)
  const bssId = u.referralCode || u.id || user?.referralCode || 'BSS-20260001'

  const clientMenuItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard Overview',
      sub: `${designation} (Level ${level})`,
      path: '/dashboard?tab=overview',
    },
    {
      icon: Award,
      label: 'My Level & 24-Level Breakdown',
      sub: 'Check designation, targets & incentives',
      path: '/dashboard?tab=levels',
    },
    {
      icon: Layers,
      label: 'My Main ID (M) & Product IDs (P)',
      sub: `${ownPackages} Global Chain Account IDs`,
      path: '/dashboard?tab=packages',
    },
    {
      icon: ShoppingBag,
      label: 'My Orders & Invoices (PDF)',
      sub: `${totalOrders} purchases`,
      path: '/orders',
    },
    {
      icon: Users,
      label: 'My Sponsor List & Referral Link',
      sub: `${totalSponsors} direct sponsored members`,
      path: '/dashboard?tab=sponsors',
    },
    {
      icon: Wallet,
      label: 'Payment & Withdraw Wallet',
      sub: `৳${wallet.toFixed(2)} available (bKash, Nagad, Bank)`,
      path: '/dashboard?tab=withdraw',
    },
    {
      icon: UserCheck,
      label: 'My Account & Profile',
      sub: 'Photo, Personal Info, Sponsor & Password',
      path: '/dashboard?tab=account',
    },
    {
      icon: Heart,
      label: 'My Wishlist & Product Request',
      sub: `${wishlist.length} saved items`,
      path: '/wishlist',
    },
  ]

  return (
    <div className="px-4 py-4 space-y-4 font-sans text-gray-800">
      {/* User Top Profile Card (With Real Profile Photo & BSS-ID) */}
      <div className="bg-white rounded-3xl border border-gray-100 p-4 shadow-xs space-y-4">
        <div className="flex items-center gap-3.5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-xl flex items-center justify-center shadow-sm overflow-hidden border-2 border-[#00875A] shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={u.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{(u.name || 'U')[0].toUpperCase()}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="font-black text-base text-gray-900 truncate">
              {u.name || 'Customer'}
            </h2>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              ID:{' '}
              <span className="font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {bssId}
              </span>
            </p>
            <p className="text-[11px] font-bold text-[#00875A] mt-1">
              {designation} (Level {level < 10 ? `0${level}` : level})
            </p>
          </div>
        </div>

        {/* Reserve & Balance Strip (Matches Website Dashboard Header) */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className="px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 font-black text-xs rounded-2xl flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold text-emerald-700">
              💎 Reserve
            </span>
            <span className="text-xs text-[#00875A]">{reserve} / 40 Pts</span>
          </div>

          <div
            onClick={() => navigate('/dashboard?tab=withdraw')}
            className="px-3.5 py-2.5 bg-[#00875A] text-white font-black text-xs rounded-2xl shadow-xs flex items-center justify-between cursor-pointer"
          >
            <span className="bg-emerald-700/80 px-2 py-0.5 rounded text-[10px] uppercase font-bold text-emerald-100">
              Balance
            </span>
            <span className="text-xs">৳{wallet.toFixed(2)}</span>
          </div>
        </div>

        {/* Orders | Wishlist | Cart Quick Row (Matches 11 Me.pdf) */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
          <button
            onClick={() => navigate('/orders')}
            className="bg-gray-50 rounded-2xl py-2 text-center"
          >
            <p className="text-sm font-black text-gray-900">{totalOrders}</p>
            <p className="text-[10px] text-gray-500 font-bold">Orders</p>
          </button>
          <button
            onClick={() => navigate('/wishlist')}
            className="bg-gray-50 rounded-2xl py-2 text-center"
          >
            <p className="text-sm font-black text-gray-900">{wishlist.length}</p>
            <p className="text-[10px] text-gray-500 font-bold">Wishlist</p>
          </button>
          <button
            onClick={() => navigate('/cart')}
            className="bg-gray-50 rounded-2xl py-2 text-center"
          >
            <p className="text-sm font-black text-gray-900">{cartCount}</p>
            <p className="text-[10px] text-gray-500 font-bold">Cart</p>
          </button>
        </div>
      </div>

      {/* Website Client Dashboard Menu List */}
      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-xs">
        <div className="px-4 py-3 bg-gray-50/70 border-b border-gray-100">
          <span className="text-[10px] font-black text-[#00875A] uppercase tracking-widest">
            CLIENT PORTAL MENU
          </span>
        </div>
        {clientMenuItems.map((item, i) => {
          const Icon = item.icon
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 text-left active:bg-slate-50 transition ${
                i !== clientMenuItems.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-[#E8F5E9] text-[#00875A] flex items-center justify-center shrink-0">
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-extrabold text-gray-900">{item.label}</p>
                <p className="text-[11px] text-gray-500 truncate">{item.sub}</p>
              </div>
              <ChevronRight size={16} className="text-gray-400 shrink-0" />
            </button>
          )
        })}

        <button
          onClick={() => { logout(); navigate('/') }}
          className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left border-t border-gray-100 text-rose-600 active:bg-rose-50 transition"
        >
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <LogOut size={18} />
          </div>
          <span className="flex-1 text-xs font-extrabold">Log out</span>
          <ChevronRight size={16} className="text-rose-300" />
        </button>
      </div>

      {/* Website Reserve Points & Main Chain Tracker Dual Cards right inside Me Page */}
      <div className="space-y-3.5">
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white p-5 rounded-3xl border border-emerald-400/30 shadow-md space-y-2.5">
          <div className="flex justify-between items-center text-[11px] font-extrabold">
            <span className="text-emerald-300 uppercase tracking-wider">
              💎 RESERVE POINTS (রিজার্ভ পয়েন্ট)
            </span>
            <span className="bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 px-2.5 py-0.5 rounded-full">
              {reserve} / 40 Points
            </span>
          </div>
          <p className="text-xs text-emerald-100 leading-relaxed">
            আপনার রিজার্ভে বর্তমানে{' '}
            <span className="text-amber-300 font-black">{reserve} পয়েন্ট</span> জমা আছে। আর মাত্র{' '}
            <span className="text-white font-black underline">{pointsNeeded} পয়েন্ট</span> হলেই স্বয়ংক্রিয়ভাবে ১টি নতুন প্যাকেজ আইডি (Man/Product ID) তৈরি হয়ে চেইনে যুক্ত হবে!
          </p>
          <div className="w-full h-2.5 bg-slate-950/70 rounded-full border border-emerald-700 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${reserveProgressPercent}%` }}
            />
          </div>
        </div>

        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-5 rounded-3xl border border-emerald-500/30 shadow-md space-y-2.5">
          <div className="flex justify-between items-center text-[11px] font-extrabold">
            <span className="text-emerald-400 uppercase tracking-wider">
              🎯 MAIN CHAIN TRACKER (LEVEL {mainLevel})
            </span>
            <span className="text-gray-300">
              {currentStepPackages} / {nextLevelTargetPackages} Pkg
            </span>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">
            আপনার মেইন আইডির পর মোট{' '}
            <span className="text-emerald-400 font-black">{totalPackagesAfterMe} টি</span> প্যাকেজ সেল হয়েছে। পরবর্তী লেভেলের (Level {Math.min(24, mainLevel + 1)}) জন্য নতুন{' '}
            <span className="text-amber-300 font-black">
              {currentStepPackages}/{nextLevelTargetPackages} টি
            </span>{' '}
            পূর্ণ হয়েছে (আর{' '}
            <span className="text-white font-black underline">{packagesNeededForNextLevel} টি</span> বাকি)।
          </p>
          <div className="w-full h-2.5 bg-slate-950 rounded-full border border-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (currentStepPackages / (nextLevelTargetPackages || 1)) * 100)}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}