import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { api, resolveImageUrl } from '../api/index.js'

const BANGLADESH_BANKS = [
  'Sonali Bank PLC',
  'Janata Bank PLC',
  'Agrani Bank PLC',
  'Rupali Bank PLC',
  'Pubali Bank PLC',
  'Islami Bank Bangladesh PLC',
  'BRAC Bank PLC',
  'Dutch-Bangla Bank PLC (DBBL)',
  'Eastern Bank PLC (EBL)',
  'City Bank PLC',
  'United Commercial Bank PLC (UCB)',
  'Prime Bank PLC',
  'Dhaka Bank PLC',
  'Mutual Trust Bank PLC (MTB)',
  'NCC Bank PLC',
  'National Bank Limited',
  'Mercantile Bank PLC',
  'One Bank PLC',
  'Southeast Bank PLC',
  'Social Islami Bank PLC (SIBL)',
  'Al-Arafah Islami Bank PLC',
  'First Security Islami Bank PLC',
  'EXIM Bank PLC',
  'Shahjalal Islami Bank PLC',
  'Standard Bank PLC',
  'Jamuna Bank PLC',
  'Bank Asia PLC',
  'Trust Bank PLC',
  'South Bangla Agriculture and Commerce (SBAC) Bank',
  'NRB Bank PLC',
  'Global Islami Bank PLC',
  'Union Bank PLC',
  'Midland Bank PLC',
  'Modhumoti Bank PLC',
  'Meghna Bank PLC',
  'Community Bank Bangladesh PLC',
  'Bengal Commercial Bank PLC',
  'Citizens Bank PLC',
  'Standard Chartered Bank',
  'HSBC Bangladesh',
]

const TABS = [
  { key: 'overview', label: 'Dashboard' },
  { key: 'levels', label: '24 Levels' },
  { key: 'packages', label: 'My IDs (M/P)' },
  { key: 'sponsors', label: 'Sponsors' },
  { key: 'withdraw', label: 'Withdraw' },
  { key: 'account', label: 'My Account' },
]

const ensureBssFormat = (val) => {
  if (!val) return ''
  const s = String(val).trim()
  if (!s || s === 'SYSTEM-TOP' || s === 'None') return ''
  return s.toUpperCase().startsWith('BSS-') ? s.toUpperCase() : `BSS-${s}`
}

export default function Dashboard() {
  const { user, setUser } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const queryTab = new URLSearchParams(location.search).get('tab') || 'overview'

  const [activeTab, setActiveTab] = useState(queryTab)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copiedLink, setCopiedLink] = useState(false)

  // Withdraw States (Matches src/app/client/withdraw/page.js)
  const [walletBalance, setWalletBalance] = useState(0)
  const [paymentType, setPaymentType] = useState('mobile')
  const [mobileMethod, setMobileMethod] = useState('bKash')
  const [mobileNumber, setMobileNumber] = useState('')
  const [bankName, setBankName] = useState(BANGLADESH_BANKS[0])
  const [accountName, setAccountName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [branchName, setBranchName] = useState('')
  const [routingNumber, setRoutingNumber] = useState('')
  const [swiftCode, setSwiftCode] = useState('')
  const [amount, setAmount] = useState('')
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false)
  const [withdrawMsg, setWithdrawMsg] = useState({ type: '', text: '' })

  // Account States (Matches src/app/client/account/page.js)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' })
  const [formData, setFormData] = useState({
    name: user?.name || '',
    mobile: user?.mobile || user?.phone || '',
    address: user?.address || '',
    profileImage: user?.profileImage || user?.image || '',
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' })

  useEffect(() => {
    setActiveTab(queryTab)
  }, [queryTab])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const uid = user?._id || user?.id || ''
        const phone = user?.phone || user?.mobile || ''
        const res = await api.getDashboardStats(uid, phone, user?.email || '')
        if (active && res) {
          setData(res)
          setWalletBalance(Number(res.stats?.walletBalance || 0))
          if (res.user) {
            const fetchedImg = res.user.profileImage || res.user.image || user?.profileImage || ''
            setFormData({
              name: res.user.name || user?.name || '',
              mobile: res.user.mobile || res.user.phone || user?.phone || '',
              address: res.user.address || user?.address || '',
              profileImage: fetchedImg,
            })
            setUser({
              ...user,
              ...res.user,
              profileImage: fetchedImg,
            })
          }
        }
      } catch (e) {
        console.error(e)
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const stats = data?.stats || {}
  const u = data?.user || user || {}
  const currentLevel = Number(stats.currentLevel || 0)
  const mainLevel = Number(stats.mainLevel ?? currentLevel)
  const currentDesignation = stats.designation || 'New Member'
  const reservePoints = Number(stats.reservePoints || 0)
  const pointsNeeded = 40 - (reservePoints % 40)
  const reserveProgressPercent = Math.min(100, ((reservePoints % 40) / 40) * 100)

  const totalPackagesAfterMe = Number(stats.accumulatedPackages || 0)
  const currentStepPackages = Number(stats.currentStepPackages || 0)
  const nextLevelTargetPackages = Number(stats.nextLevelTarget || 3)
  const packagesNeededForNextLevel = Math.max(0, nextLevelTargetPackages - currentStepPackages)

  const showExtraPackageCard = Boolean(stats.isExtraStage || currentLevel >= 9 || mainLevel >= 9)
  const extraTargetLevel = Number(stats.extraTargetLevel || Math.min(24, Math.max(10, currentLevel + 1)))
  const extraStepPackages = Number(stats.extraStepPackages || 0)
  const extraNextLevelTarget = Number(stats.extraNextLevelTarget || 10)
  const extraPackagesNeeded = Math.max(0, extraNextLevelTarget - extraStepPackages)
  const extraPackagesReceived = Number(stats.extraPackagesReceived || 0)
  const extraProgressPercent = Math.min(100, (extraStepPackages / (extraNextLevelTarget || 1)) * 100)

  const myChainNodes = data?.myChainNodes || []
  const sponsorList = data?.sponsorList || stats.sponsorsList || []
  const serverLevelTable = data?.levelTable || []
  const bssId = ensureBssFormat(u.referralCode || u.id || user?.referralCode) || 'BSS-20260001'
  const sponsorCode = ensureBssFormat(u.sponsorCode || u.referredBy)
  const avatarUrl = resolveImageUrl(
    isEditingProfile ? formData.profileImage : (u.profileImage || formData.profileImage)
  )

  const statsCards = [
    {
      label: 'Reserve Points',
      value: `${reservePoints} Pts`,
      subtext: `আর ${pointsNeeded} পয়েন্ট হলেই নতুন প্যাকেজ আইডি`,
      icon: '💎',
      bg: 'bg-[#ECFDF5] text-emerald-900 border-[#A7F3D0]',
    },
    {
      label: 'Total Package (IDs)',
      value: (myChainNodes.length || stats.totalPackages || 0).toString(),
      subtext: '40 Pts = 1 Package ID',
      icon: '✦',
      bg: 'bg-[#FFFBE6] text-amber-900 border-[#FFF5C2]',
    },
    {
      label: 'Total orders',
      value: (stats.totalOrders || 0).toString(),
      subtext: 'All-time purchases',
      icon: '📍',
      bg: 'bg-[#EBF5FF] text-sky-900 border-[#D6E8FF]',
    },
    {
      label: 'Network Packages',
      value: totalPackagesAfterMe.toString(),
      subtext: `মেইন চেইন ধাপে জমা: ${currentStepPackages} / ${nextLevelTargetPackages}`,
      icon: '👥',
      bg: 'bg-[#F3E8FF] text-purple-900 border-[#E9D5FF]',
    },
    {
      label: currentDesignation,
      value: `Level ${currentLevel < 10 ? `0${currentLevel}` : currentLevel}`,
      subtext: `পরবর্তী মেইন ধাপের জন্য আরো ${packagesNeededForNextLevel} টি প্যাকেজ প্রয়োজন`,
      icon: '🏆',
      bg: 'bg-[#FFFBE6] text-amber-900 border-[#FFF5C2]',
    },
    {
      label: 'Wallet balance',
      value: `৳ ${walletBalance.toFixed(2)}`,
      subtext: 'Level cashback earnings',
      icon: '৳',
      bg: 'bg-[#F3E8FF] text-purple-900 border-[#E9D5FF]',
    },
    {
      label: 'Total Sponsor',
      value: sponsorList.length.toString(),
      subtext: 'Direct sponsored member',
      icon: '👁️',
      bg: 'bg-[#EBF5FF] text-sky-900 border-[#D6E8FF]',
    },
  ]

  // WebP 400px Profile Photo Compression (Matches src/app/client/account/page.js)
  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_SIZE = 400
        let width = img.width
        let height = img.height
        if (width > height && width > MAX_SIZE) {
          height = Math.round((height * MAX_SIZE) / width)
          width = MAX_SIZE
        } else if (height > MAX_SIZE) {
          width = Math.round((width * MAX_SIZE) / height)
          height = MAX_SIZE
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        const compressedBase64 = canvas.toDataURL('image/webp', 0.75)
        setFormData(prev => ({ ...prev, profileImage: compressedBase64 }))
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  }

  const handleProfileSave = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    setProfileMsg({ type: '', text: '' })
    try {
      await api.updateProfile({
        ...formData,
        phone: formData.mobile,
        userId: u._id || user?._id || bssId,
        id: bssId,
      })
      const updated = {
        ...user,
        ...u,
        name: formData.name,
        mobile: formData.mobile,
        phone: formData.mobile,
        address: formData.address,
        profileImage: formData.profileImage,
      }
      setUser(updated)
      setData(prev => prev ? { ...prev, user: { ...prev.user, ...updated } } : prev)
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' })
      setIsEditingProfile(false)
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update profile.' })
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePasswordSave = async (e) => {
    e.preventDefault()
    setPasswordSaving(true)
    setPasswordMsg({ type: '', text: '' })
    const { currentPassword, newPassword, confirmPassword } = passwordData
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'সবগুলো পাসওয়ার্ড ফিল্ড পূরণ করুন!' })
      setPasswordSaving(false)
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'নতুন পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না!' })
      setPasswordSaving(false)
      return
    }
    try {
      await api.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      })
      setPasswordMsg({ type: 'success', text: 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!' })
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.message || 'পুরাতন পাসওয়ার্ড সঠিক নয়।' })
    } finally {
      setPasswordSaving(false)
    }
  }

  // Real Withdraw Submission (Matches src/app/client/withdraw/page.js)
  const handleWithdrawSubmit = async (e) => {
    e.preventDefault()
    setWithdrawMsg({ type: '', text: '' })
    const numericAmount = Number(amount)

    if (!numericAmount || numericAmount < 100) {
      setWithdrawMsg({ type: 'error', text: 'সর্বনিম্ন ১০০ টাকা বা তার বেশি উইথড্র রিকোয়েস্ট করতে হবে।' })
      return
    }
    if (numericAmount > walletBalance) {
      setWithdrawMsg({ type: 'error', text: 'Insufficient wallet balance.' })
      return
    }

    setSubmittingWithdraw(true)
    const withdrawalData = {
      userId: u._id || user?._id || bssId,
      phone: u.phone || u.mobile || user?.phone || '',
      type: paymentType,
      amount: numericAmount,
      details:
        paymentType === 'mobile'
          ? { method: mobileMethod, mobileNumber }
          : { bankName, accountName, accountNumber, branchName, routingNumber, swiftCode },
    }

    try {
      await api.submitWithdraw(withdrawalData)
      setWithdrawMsg({
        type: 'success',
        text: `Withdrawal request of ৳${numericAmount} submitted successfully!`,
      })
      setAmount('')
      setMobileNumber('')
      setAccountName('')
      setAccountNumber('')
      setBranchName('')
      setRoutingNumber('')
      setSwiftCode('')
      setWalletBalance(prev => prev - numericAmount)
    } catch (err) {
      setWithdrawMsg({ type: 'error', text: err.message || 'Failed to submit request.' })
    } finally {
      setSubmittingWithdraw(false)
    }
  }

  const handleCopyReferralLink = () => {
    const referralUrl = `https://brightsmartshop24.com/register?sponsor=${bssId}`
    navigator.clipboard?.writeText(referralUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 3000)
  }

  return (
    <div className="px-4 py-3 space-y-4 font-sans text-gray-800">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/me')}
          className="inline-flex items-center gap-1 text-sm font-black text-gray-900"
        >
          <ChevronLeft size={18} /> Client Portal
        </button>
        <span className="bg-emerald-50 border border-emerald-200 text-[#00875A] text-xs font-black px-3 py-1 rounded-full">
          {bssId}
        </span>
      </div>

      {/* Horizontal Menu Bar Pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-extrabold transition ${
              activeTab === t.key
                ? 'bg-[#00875A] text-white shadow-xs'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs font-black text-[#00875A] animate-pulse">
          Loading Client Dashboard...
        </div>
      ) : (
        <>
          {/* ================= TAB 1: OVERVIEW ================= */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {showExtraPackageCard && (
                <div className="bg-gradient-to-r from-amber-900 via-orange-900 to-amber-950 text-white p-5 rounded-3xl border border-amber-400/40 shadow-md space-y-2.5">
                  <div className="flex flex-wrap justify-between items-center gap-2 text-[11px] font-extrabold">
                    <span className="text-amber-300 uppercase">
                      ⚡ EXTRA PACKAGE (LEVEL {extraTargetLevel})
                    </span>
                    <span className="bg-amber-500/20 border border-amber-400/40 text-amber-200 px-2.5 py-0.5 rounded-full">
                      জমা: {extraStepPackages} / {extraNextLevelTarget} Extra Pkg (মোট: {extraPackagesReceived})
                    </span>
                  </div>
                  <p className="text-xs text-amber-100 leading-relaxed">
                    আপনি লেভেল ৯ অতিক্রম করেছেন! পরবর্তী{' '}
                    <span className="text-white font-black">Level {extraTargetLevel}</span> কমপ্লিট করার জন্য মোট{' '}
                    <span className="text-amber-300 font-black">{extraNextLevelTarget} টি এক্সট্রা প্যাকেজ</span> প্রয়োজন (আর{' '}
                    <span className="text-white font-black underline">{extraPackagesNeeded} টি</span> লাগবে)।
                  </p>
                  <div className="w-full h-2.5 bg-slate-950/70 rounded-full border border-amber-700 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 via-orange-400 to-emerald-400 rounded-full"
                      style={{ width: `${extraProgressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* 7 Pastel Stats Cards Grid (Matches src/app/client/dashboard/page.js) */}
              <div className="grid grid-cols-2 gap-3">
                {statsCards.map((card, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-3xl border ${card.bg} relative overflow-hidden flex flex-col justify-between min-h-[104px] ${
                      idx === statsCards.length - 1 ? 'col-span-2' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1.5 z-10">
                      <span className="text-xs font-bold">{card.icon}</span>
                      <span className="text-[11px] font-bold opacity-80">{card.label}</span>
                    </div>
                    <div className="text-xl font-black tracking-tight my-1 z-10">{card.value}</div>
                    <div className="text-[10px] opacity-75 font-medium z-10 leading-snug">{card.subtext}</div>
                  </div>
                ))}
              </div>

              {/* Reward Banner Card */}
              <div className="bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 text-white rounded-3xl p-5 shadow-sm flex items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full">
                    YOUR REWARD ACCOUNT
                  </span>
                  <h2 className="text-xl font-black leading-tight">
                    Small steps. Real rewards.
                  </h2>
                  <button
                    onClick={() => setActiveTab('levels')}
                    className="text-xs font-bold underline text-white pt-1"
                  >
                    View 24 Levels Breakdown →
                  </button>
                </div>
                <div className="w-24 h-24 rounded-full border-4 border-white/30 bg-white/10 flex flex-col items-center justify-center text-center p-2 shrink-0">
                  <span className="text-lg font-black">৳{walletBalance.toFixed(0)}</span>
                  <span className="text-[8px] uppercase font-bold">EARNED BONUSES</span>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: 24-LEVEL BREAKDOWN ================= */}
          {activeTab === 'levels' && (
            <div className="bg-white rounded-3xl border border-gray-200 p-4 shadow-xs space-y-3 overflow-x-auto">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <span className="text-[10px] font-black text-[#00875A] uppercase tracking-widest block">
                    LEVEL PROGRESSION
                  </span>
                  <h3 className="text-base font-black text-gray-900">24-Level Benefit Breakdown</h3>
                </div>
                <span className="text-xs font-black bg-emerald-50 text-[#00875A] px-3 py-1 rounded-full border border-emerald-200">
                  Your Level: {currentLevel}
                </span>
              </div>

              <table className="w-full text-[11px] min-w-[520px] text-left">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-2 rounded-l-xl">Level</th>
                    
                    <th className="py-2.5 px-2">Extra Pkg</th>
                    <th className="py-2.5 px-2">Designation</th>
                    <th className="py-2.5 px-2 text-right">Cashback (৳)</th>
                    <th className="py-2.5 px-2">Incentive  </th>
                    <th className="py-2.5 px-2 text-center rounded-r-xl">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {serverLevelTable.map((row) => {
                    const lvl = row.level
                    const reached = currentLevel >= lvl
                    const reqPkg = row.requiredPackages ?? row.requiredNewPurchasers ?? '—'
                    const extraPkg = row.extraPackages ?? row.requiredExtraPackages ?? (lvl >= 10 ? 10 : '—')
                    const taka = row.taka ?? row.bonus ?? row.cashback ?? row.rewardTaka ?? row.amount ?? 0
                    const desig = row.designation || row.rank || row.title || '—'
                    const inc = row.incentive || row.reward || row.tour || row.gift || '—'

                    return (
                      <tr
                        key={lvl}
                        className={reached ? 'bg-emerald-50/60 font-bold text-gray-900' : 'text-gray-600'}
                      >
                        <td className="py-2.5 px-2 font-black text-[#00875A]">Level {lvl}</td>
                        
                        <td className="py-2.5 px-2 font-mono text-amber-700">
                          {lvl >= 10 ? `${extraPkg} Extra` : '—'}
                        </td>
                        <td className="py-2.5 px-2 font-bold">{desig}</td>
                        <td className="py-2.5 px-2 text-right font-black text-emerald-700">
                          ৳{Number(taka).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-2 text-amber-800 font-semibold">{inc}</td>
                        <td className="py-2.5 px-2 text-center">
                          {reached ? (
                            <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-black">
                              ✓ Reached
                            </span>
                          ) : (
                            <span className="text-gray-400 text-[10px]">Locked</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ================= TAB 3: GLOBAL CHAIN ACCOUNTS (M & P IDs) ================= */}
          {activeTab === 'packages' && (
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <span className="text-[10px] font-black text-[#00875A] uppercase tracking-widest block">
                  GLOBAL CHAIN ACCOUNTS (40 PTS = 1 ID)
                </span>
                <h3 className="text-base font-black text-gray-900">
                  আমার মেইন আইডি ও প্রোডাক্ট আইডি তালিকা ({myChainNodes.length} টি)
                </h3>
                <p className="text-xs font-bold text-emerald-700 mt-1">
                  রিজার্ভ জমা: {reservePoints} Pts (আর {pointsNeeded} Pts হলে নতুন আইডি)
                </p>
              </div>

              {myChainNodes.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {myChainNodes.map((node, index) => (
                    <div
                      key={node._id || index}
                      className={`p-4 rounded-2xl border flex items-center justify-between ${
                        node.isManId
                          ? 'bg-emerald-50/70 border-emerald-300'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${
                            node.isManId ? 'bg-[#00875A] text-white' : 'bg-amber-500 text-white'
                          }`}
                        >
                          {node.isManId ? 'Main ID (M)' : 'Product ID (P)'}
                        </span>
                        <div className="text-base font-black text-gray-900 mt-1.5 font-mono">
                          {node.chainAccountId}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-extrabold text-[#00875A]">
                          Level {node.currentLevel || 0}
                        </div>
                        <div className="text-[11px] text-gray-500 font-bold">
                          {node.accumulatedPackages || 0} Pkg
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-4">
                  আপনার এখনো ৪০ পয়েন্ট পূর্ণ হয়নি (বর্তমান রিজার্ভ পয়েন্ট:{' '}
                  <strong className="text-[#00875A]">{reservePoints} Pts</strong>)। ৪০ পয়েন্ট পূর্ণ হলেই এখানে আপনার <strong>Main ID / Product ID</strong> দেখা যাবে।
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 4: MY SPONSOR LIST ================= */}
          {activeTab === 'sponsors' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-3">
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block">
                  MY NETWORK & REFERRALS
                </span>
                <h2 className="text-lg font-black text-gray-900">My Sponsor List</h2>

                <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-2xl flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase block">
                      YOUR SPONSOR / REFERRAL ID
                    </span>
                    <span className="text-base font-black text-emerald-900 font-mono">
                      {bssId}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyReferralLink}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
                  >
                    {copiedLink ? 'Copied Link! ✓' : 'Copy Referral Link 📋'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-white p-3.5 rounded-2xl border border-gray-100 text-center">
                  <span className="text-[9px] font-extrabold text-gray-400 uppercase block">DIRECT</span>
                  <div className="text-base font-black text-emerald-600 mt-0.5">{sponsorList.length}</div>
                </div>
                <div className="bg-white p-3.5 rounded-2xl border border-gray-100 text-center">
                  <span className="text-[9px] font-extrabold text-gray-400 uppercase block">BUYERS</span>
                  <div className="text-base font-black text-sky-600 mt-0.5">
                    {sponsorList.filter(m => m.hasPurchased).length}
                  </div>
                </div>
                <div className="bg-white p-3.5 rounded-2xl border border-gray-100 text-center">
                  <span className="text-[9px] font-extrabold text-gray-400 uppercase block">TEAM PKG</span>
                  <div className="text-base font-black text-purple-600 mt-0.5">
                    {sponsorList.reduce((s, m) => s + (m.packages || 0), 0)}
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-xs overflow-x-auto">
                <h3 className="text-sm font-black text-gray-900 mb-3">Direct Referred Members</h3>
                {sponsorList.length > 0 ? (
                  <table className="w-full text-left text-xs min-w-[420px]">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                        <th className="py-2 px-2">SL</th>
                        <th className="py-2 px-2">ID</th>
                        <th className="py-2 px-2">NAME</th>
                        <th className="py-2 px-2">PHONE</th>
                        <th className="py-2 px-2 text-right">PKG</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {sponsorList.map((member, index) => (
                        <tr key={member.id || index}>
                          <td className="py-2.5 px-2 font-bold text-gray-500">{index + 1}</td>
                          <td className="py-2.5 px-2 font-mono font-black text-emerald-700">
                            {ensureBssFormat(member.id || member.referralCode)}
                          </td>
                          <td className="py-2.5 px-2 font-bold text-gray-900">{member.name}</td>
                          <td className="py-2.5 px-2 font-mono text-gray-600">{member.phone || 'N/A'}</td>
                          <td className="py-2.5 px-2 text-right font-black text-gray-900">
                            {member.packages || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-xs text-gray-400 text-center py-6">
                    No sponsored members yet. Share your Sponsor ID ({bssId})!
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ================= TAB 5: PAYMENT & WITHDRAW ================= */}
          {activeTab === 'withdraw' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block">
                    WITHDRAWAL PORTAL
                  </span>
                  <h2 className="text-lg font-black text-gray-900">Payment & Withdraw</h2>
                </div>
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2.5 rounded-2xl text-right">
                  <span className="text-[9px] font-bold text-emerald-100 uppercase block">
                    AVAILABLE BALANCE
                  </span>
                  <span className="text-base font-black">৳ {walletBalance.toFixed(2)}</span>
                </div>
              </div>

              {withdrawMsg.text && (
                <div
                  className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                    withdrawMsg.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border border-rose-200 text-rose-800'
                  }`}
                >
                  <span>{withdrawMsg.type === 'success' ? '✅' : '⚠️'}</span>
                  <span>{withdrawMsg.text}</span>
                </div>
              )}

              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block">
                    SELECT PAYMENT METHOD *
                  </label>
                  <div className="grid grid-cols-2 gap-2.5 p-1.5 bg-gray-100/80 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setPaymentType('mobile')}
                      className={`py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                        paymentType === 'mobile' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-500'
                      }`}
                    >
                      <span>📱</span>
                      <span>Mobile Banking</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentType('bank')}
                      className={`py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                        paymentType === 'bank' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-500'
                      }`}
                    >
                      <span>🏦</span>
                      <span>Bank Transfer</span>
                    </button>
                  </div>
                </div>

                <form onSubmit={handleWithdrawSubmit} className="space-y-4 text-xs">
                  {paymentType === 'mobile' ? (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="font-bold text-gray-700 uppercase block">
                          Mobile Banking Provider *
                        </label>
                        <div className="grid grid-cols-3 gap-2.5">
                          {[
                            { name: 'bKash', color: 'border-pink-500 text-pink-600 bg-pink-50/50' },
                            { name: 'Nagad', color: 'border-orange-500 text-orange-600 bg-orange-50/50' },
                            { name: 'Rocket', color: 'border-purple-500 text-purple-600 bg-purple-50/50' },
                          ].map((item) => (
                            <button
                              key={item.name}
                              type="button"
                              onClick={() => setMobileMethod(item.name)}
                              className={`py-2.5 rounded-2xl border-2 text-xs font-black transition-all ${
                                mobileMethod === item.name
                                  ? item.color
                                  : 'border-gray-200 text-gray-600 bg-gray-50'
                              }`}
                            >
                              {item.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-gray-700 uppercase block">
                          {mobileMethod} Personal Number *
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="e.g. 017XXXXXXXX"
                          value={mobileNumber}
                          onChange={(e) => setMobileNumber(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-emerald-600"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      <div>
                        <label className="font-bold text-gray-700 uppercase block mb-1">
                          Select Bank Name *
                        </label>
                        <select
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-900"
                        >
                          {BANGLADESH_BANKS.map((b) => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-gray-700 uppercase block mb-1">
                          Account Holder Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Name as per bank account"
                          value={accountName}
                          onChange={(e) => setAccountName(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-gray-700 uppercase block mb-1">
                          Account Number *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Enter full bank account number"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-gray-700 uppercase block mb-1">
                            Branch Name *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Gulshan"
                            value={branchName}
                            onChange={(e) => setBranchName(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-gray-700 uppercase block mb-1">
                            Routing Number *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="9-digit routing"
                            value={routingNumber}
                            onChange={(e) => setRoutingNumber(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="font-bold text-gray-700 uppercase block mb-1">
                          SWIFT Code (optional)
                        </label>
                        <input
                          type="text"
                          placeholder="Bank SWIFT/BIC Code"
                          value={swiftCode}
                          onChange={(e) => setSwiftCode(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5 pt-2 border-t border-gray-100">
                    <label className="font-bold text-gray-700 uppercase block">
                      Withdrawal Amount (৳) *
                    </label>
                    <input
                      type="number"
                      required
                      min="100"
                      placeholder={`Available: ৳${walletBalance.toFixed(2)}`}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-extrabold text-emerald-800 focus:bg-white focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingWithdraw || walletBalance < 100}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all disabled:opacity-50"
                  >
                    {submittingWithdraw ? 'Processing Request...' : 'Submit Withdrawal Request →'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ================= TAB 6: MY ACCOUNT & PROFILE ================= */}
          {activeTab === 'account' && (
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-black text-xl flex items-center justify-center shadow-md overflow-hidden">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{(u.name || 'U')[0].toUpperCase()}</span>
                      )}
                    </div>
                    {isEditingProfile && (
                      <label className="absolute -bottom-1.5 -right-1.5 bg-emerald-600 text-white p-1.5 rounded-full cursor-pointer shadow-md">
                        <span className="text-xs">📷</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  <div>
                    <h2 className="text-base font-black text-gray-900">{u.name}</h2>
                    <p className="text-xs text-gray-500">
                      ID: <span className="font-mono font-black text-emerald-700">{bssId}</span>
                    </p>
                    {isEditingProfile && (
                      <label className="inline-block mt-1 text-[11px] text-emerald-600 font-extrabold cursor-pointer underline">
                        📷 Pick Profile Picture
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {!isEditingProfile && (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="px-3.5 py-2 bg-emerald-600 text-white font-extrabold text-xs rounded-xl"
                  >
                    ✏️ Edit
                  </button>
                )}
              </div>

              {profileMsg.text && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold ${
                    profileMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {profileMsg.text}
                </div>
              )}

              {!isEditingProfile ? (
                <div className="grid grid-cols-1 gap-3 text-xs">
                  <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">FULL NAME</span>
                    <p className="text-sm font-extrabold text-gray-900 mt-0.5">{u.name || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">MOBILE NUMBER</span>
                    <p className="text-sm font-extrabold text-gray-900 font-mono mt-0.5">
                      {u.mobile || u.phone || 'Not provided'}
                    </p>
                  </div>
                  <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-200">
                    <span className="text-[10px] font-black text-emerald-700 uppercase block">MY ID</span>
                    <p className="text-sm font-black text-emerald-900 font-mono mt-0.5">{bssId}</p>
                  </div>
                  <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200">
                    <span className="text-[10px] font-black text-amber-800 uppercase block">
                      SPONSOR CODE (আমাকে যিনি রেফার করেছেন)
                    </span>
                    <p className="text-sm font-black text-gray-900 font-mono mt-0.5">
                      {sponsorCode ? `${sponsorCode} ${u.sponsorName ? `(${u.sponsorName})` : ''}` : 'No Sponsor'}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">DELIVERY ADDRESS</span>
                    <p className="text-sm font-extrabold text-gray-900 mt-0.5">{u.address || 'N/A'}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <form onSubmit={handleProfileSave} className="space-y-3.5 text-xs">
                    <div>
                      <label className="font-bold text-gray-700 uppercase block mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-gray-700 uppercase block mb-1">Mobile Number</label>
                      <input
                        type="tel"
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-gray-700 uppercase block mb-1">Delivery Address *</label>
                      <textarea
                        rows={2}
                        required
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-bold"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="px-4 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="px-5 py-2.5 bg-emerald-600 text-white font-extrabold rounded-xl"
                      >
                        {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                      </button>
                    </div>
                  </form>

                  {/* Password Change Section */}
                  <form onSubmit={handlePasswordSave} className="pt-4 border-t border-dashed border-gray-200 space-y-3 text-xs">
                    <h3 className="font-black text-gray-900 uppercase">Change Password</h3>
                    {passwordMsg.text && (
                      <div
                        className={`p-2.5 rounded-xl font-bold ${
                          passwordMsg.type === 'success'
                            ? 'bg-emerald-50 text-emerald-800'
                            : 'bg-rose-50 text-rose-800'
                        }`}
                      >
                        {passwordMsg.text}
                      </div>
                    )}
                    <input
                      type="password"
                      placeholder="পুরাতন পাসওয়ার্ড (Current Password)"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5"
                    />
                    <input
                      type="password"
                      placeholder="নতুন পাসওয়ার্ড (New Password - min 6 chars)"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5"
                    />
                    <input
                      type="password"
                      placeholder="কনফার্ম পাসওয়ার্ড (Confirm Password)"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5"
                    />
                    <button
                      type="submit"
                      disabled={passwordSaving}
                      className="w-full py-2.5 bg-slate-900 text-white font-extrabold rounded-xl"
                    >
                      {passwordSaving ? 'Updating Password...' : 'Update Password'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}