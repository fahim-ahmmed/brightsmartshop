import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Trophy, Layers, ShoppingBag,
  Users, Wallet, UserCheck, Heart,
  Gift, ShoppingCart, PackageCheck, LogOut
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

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  // স্ক্রিনশট ২-এর মতো ৪-কলামের গোল আইকন গ্রিড মেনু
  const gridMenuItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      onClick: () => navigate('/dashboard?tab=overview'),
      badge: null,
    },
    {
      icon: Trophy,
      label: '24 Levels',
      onClick: () => navigate('/dashboard?tab=levels'),
      badge: level > 0 ? `L${level}` : null,
    },
    {
      icon: Layers,
      label: 'My IDs (M/P)',
      onClick: () => navigate('/dashboard?tab=packages'),
      badge: ownPackages > 0 ? ownPackages : null,
    },
    {
      icon: Wallet,
      label: 'Withdraw',
      onClick: () => navigate('/dashboard?tab=withdraw'),
      badge: null,
    },
    {
      icon: ShoppingBag,
      label: 'My Orders',
      onClick: () => navigate('/orders'),
      badge: totalOrders > 0 ? totalOrders : null,
    },
    {
      icon: Users,
      label: 'My Sponsors',
      onClick: () => navigate('/dashboard?tab=sponsors'),
      badge: totalSponsors > 0 ? totalSponsors : null,
    },
    {
      icon: UserCheck,
      label: 'My Account',
      onClick: () => navigate('/dashboard?tab=account'),
      badge: null,
    },
    {
      icon: Heart,
      label: 'Wishlist',
      onClick: () => navigate('/wishlist'),
      badge: wishlist.length > 0 ? wishlist.length : null,
    },
    {
      icon: Gift,
      label: 'Request Item',
      onClick: () => navigate('/wishlist?tab=request'),
      badge: null,
    },
    {
      icon: PackageCheck,
      label: 'Packages',
      onClick: () => navigate('/category/Package'),
      badge: null,
    },
    {
      icon: ShoppingCart,
      label: 'My Cart',
      onClick: () => navigate('/cart'),
      badge: cartCount > 0 ? cartCount : null,
    },
    {
      icon: LogOut,
      label: 'Logout',
      onClick: handleLogout,
      badge: null,
      isDanger: true,
    },
  ]

  return (
    <div className="px-4 py-4 space-y-4 font-sans text-gray-800">
      {/* Top User Profile Card */}
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

        {/* Reserve & Balance Strip */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className="px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 font-black text-xs rounded-2xl flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold text-emerald-700">
              💎 Reserve
            </span>
            <span className="text-xs text-[#00875A]">{reserve} / 40 Pts</span>
          </div>

          <div
            onClick={() => navigate('/dashboard?tab=withdraw')}
            className="px-3.5 py-2.5 bg-[#00875A] text-white font-black text-xs rounded-2xl shadow-xs flex items-center justify-between cursor-pointer active:scale-95 transition"
          >
            <span className="bg-emerald-700/80 px-2 py-0.5 rounded text-[10px] uppercase font-bold text-emerald-100">
              Balance
            </span>
            <span className="text-xs">৳{wallet.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* 4-Column Circular Icon Grid Menu (Matches Screenshot 2) */}
      <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-xs">
        <div className="mb-4 pb-2 border-b border-gray-100 flex items-center justify-between">
          <span className="text-[11px] font-black text-[#00875A] uppercase tracking-widest">
            CLIENT PORTAL MENU
          </span>
          <span className="text-[10px] font-bold text-gray-400">Tap to open</span>
        </div>

        <div className="grid grid-cols-4 gap-x-2 gap-y-5">
          {gridMenuItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick}
                className="flex flex-col items-center justify-start group active:scale-90 transition-transform"
              >
                <div
                  className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-2xs ${
                    item.isDanger
                      ? 'bg-rose-50 border border-rose-200/80 text-rose-600 group-hover:bg-rose-100'
                      : 'bg-[#FAF3E3] border border-[#EFE0BE] text-[#B88933] group-hover:bg-[#E8F5E9] group-hover:border-[#00875A]/30 group-hover:text-[#00875A]'
                  }`}
                >
                  <Icon size={22} strokeWidth={1.9} />

                  {item.badge !== null && (
                    <span className="absolute -top-1 -right-1 bg-[#E11D48] text-white text-[10px] font-black rounded-full min-w-[20px] h-[20px] px-1 flex items-center justify-center shadow-xs border-2 border-white">
                      {item.badge}
                    </span>
                  )}
                </div>

                <span
                  className={`mt-2 text-[11px] font-bold text-center leading-tight line-clamp-2 ${
                    item.isDanger ? 'text-rose-600' : 'text-gray-700'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Reserve Points & Main Chain Tracker Cards */}
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