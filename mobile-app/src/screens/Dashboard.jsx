import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Wallet, Package, Users, Gift, TrendingUp, Award } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { api } from '../api/index.js'

// 24-level benefit table. Incentives per spec (English tour names at the named levels).
const LEVEL_TABLE = [
  { level: 1, taka: 100, designation: 'Starter', incentive: '—', package: 1 },
  { level: 2, taka: 200, designation: 'Bronze', incentive: '—', package: 3 },
  { level: 3, taka: 300, designation: 'Bronze', incentive: '—', package: 5 },
  { level: 4, taka: 400, designation: 'Silver', incentive: '—', package: 8 },
  { level: 5, taka: 500, designation: 'Silver', incentive: '—', package: 12 },
  { level: 6, taka: 600, designation: 'Gold', incentive: '—', package: 17 },
  { level: 7, taka: 700, designation: 'Gold', incentive: '—', package: 23 },
  { level: 8, taka: 800, designation: 'Platinum', incentive: '—', package: 30 },
  { level: 9, taka: 900, designation: 'Platinum', incentive: '—', package: 38 },
  { level: 10, taka: 1000, designation: 'Diamond', incentive: '—', package: 47 },
  { level: 11, taka: 1100, designation: 'Diamond', incentive: '—', package: 57 },
  { level: 12, taka: 1200, designation: 'Crown', incentive: '—', package: 68 },
  { level: 13, taka: 1300, designation: 'Crown', incentive: '—', package: 80 },
  { level: 14, taka: 1400, designation: 'Ambassador', incentive: '—', package: 93 },
  { level: 15, taka: 1500, designation: 'Ambassador', incentive: "Cox's Bazar Tour", package: 107 },
  { level: 16, taka: 1600, designation: 'Elite', incentive: '—', package: 122 },
  { level: 17, taka: 1700, designation: 'Elite', incentive: 'Sylhet Jaflong Tour', package: 138 },
  { level: 18, taka: 1800, designation: 'Royal', incentive: '—', package: 155 },
  { level: 19, taka: 1900, designation: 'Royal', incentive: 'Malaysia Tour', package: 173 },
  { level: 20, taka: 2000, designation: 'Legend', incentive: '—', package: 192 },
  { level: 21, taka: 2100, designation: 'Legend', incentive: 'Dubai Tour', package: 212 },
  { level: 22, taka: 2200, designation: 'Titanium', incentive: '—', package: 233 },
  { level: 23, taka: 2300, designation: 'Titanium', incentive: 'Singapore Tour', package: 255 },
  { level: 24, taka: 2400, designation: 'Hall of Fame', incentive: 'Umrah Hajj', package: 278 },
]

export default function Dashboard() {
  const { user } = useApp()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await api.getDashboardStats(user?._id || user?.id || '', user?.phone || '')
        if (active) setData(res)
      } catch (e) {
        if (active) setError('Could not load dashboard data.')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [user])

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="px-4 py-3 border-b border-slate-100 bg-white flex items-center gap-3">
          <button onClick={() => navigate('/me')} aria-label="Back"><ArrowLeft size={22} /></button>
          <h1 className="text-sm font-semibold text-slate-800">Dashboard</h1>
        </header>
        <div className="p-4 space-y-3">
          {[0, 1, 2].map(i => <div key={i} className="card h-28 animate-pulse bg-slate-100" />)}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="px-4 py-3 border-b border-slate-100 bg-white flex items-center gap-3">
          <button onClick={() => navigate('/me')} aria-label="Back"><ArrowLeft size={22} /></button>
          <h1 className="text-sm font-semibold text-slate-800">Dashboard</h1>
        </header>
        <div className="p-8 text-center">
          <p className="text-sm text-slate-500">{error || 'No data available.'}</p>
          <button onClick={() => window.location.reload()} className="btn-outline mt-4">Retry</button>
        </div>
      </div>
    )
  }

  const stats = data.stats || {}
  const u = data.user || {}
  const reserve = Number(stats.reservePoints || 0)
  const wallet = Number(stats.walletBalance || 0)
  const level = Number(stats.currentLevel || 0)
  const mainLevel = Number(stats.mainLevel || 0)
  const ownPackages = stats.totalPackages || 0
  const sponsors = stats.sponsorsList || []
  const myChain = data.myChainNodes || []

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="px-4 py-3 border-b border-slate-100 bg-white flex items-center gap-3 sticky top-0 z-20">
        <button onClick={() => navigate('/me')} aria-label="Back"><ArrowLeft size={22} /></button>
        <h1 className="text-sm font-semibold text-slate-800">Client Portal</h1>
      </header>

      <div className="px-4 py-3 space-y-4 overflow-y-auto">
        {/* Top: user + level */}
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-800">{u.name}</p>
              <p className="text-xs text-slate-500">{u.referralCode || u.id}</p>
            </div>
            <div className="text-right">
              <span className="badge bg-brand-green-light text-brand-green font-bold">Level {level}</span>
              <p className="text-[11px] text-slate-400 mt-1">{stats.designation || '—'}</p>
            </div>
          </div>
        </div>

        {/* Reserve points + wallet */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4">
            <div className="flex items-center gap-2 text-brand-orange"><Gift size={16} /></div>
            <p className="text-xs text-slate-500 mt-1">Reserve Points</p>
            <p className="text-lg font-bold text-slate-800">{reserve} / 40 Pts</p>
            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-brand-orange" style={{ width: `${Math.min(100, (reserve / 40) * 100)}%` }} />
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 text-brand-green"><Wallet size={16} /></div>
            <p className="text-xs text-slate-500 mt-1">Wallet Balance</p>
            <p className="text-lg font-bold text-slate-800">৳{wallet.toLocaleString()}</p>
          </div>
        </div>

        {/* Main chain tracker */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-brand-green" />
            <p className="text-sm font-semibold text-slate-800">Main Chain Tracker</p>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Main Level</span>
            <span className="font-bold text-slate-800">{mainLevel}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Packages in Network</span>
            <span className="font-bold text-slate-800">{stats.accumulatedPackages || 0}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Next level target</span>
            <span className="font-bold text-slate-800">{stats.nextLevelTarget || 0}</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-brand-green" style={{ width: `${Math.min(100, ((stats.currentStepPackages || 0) / Math.max(1, stats.nextLevelTarget || 1)) * 100)}%` }} />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{stats.currentStepPackages || 0} / {stats.nextLevelTarget || 0} packages</p>
        </div>

        {/* Extra package tracker (if level >= 9) */}
        {level >= 9 && (
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package size={16} className="text-brand-orange" />
              <p className="text-sm font-semibold text-slate-800">Extra Package Tracker</p>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Extra Level</span>
              <span className="font-bold text-slate-800">{stats.extraLevel || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Extra packages received</span>
              <span className="font-bold text-slate-800">{stats.extraPackagesReceived || 0}</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-brand-orange" style={{ width: `${Math.min(100, ((stats.extraStepPackages || 0) / Math.max(1, stats.extraNextLevelTarget || 1)) * 100)}%` }} />
            </div>
          </div>
        )}

        {/* Own Package IDs (M+P) */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award size={16} className="text-brand-green" />
            <p className="text-sm font-semibold text-slate-800">Own Package IDs ({ownPackages})</p>
          </div>
          {myChain.length === 0 ? (
            <p className="text-xs text-slate-400">No packages yet. Place your first order to generate a Man ID.</p>
          ) : (
            <div className="space-y-2">
              {myChain.map((n, i) => (
                <div key={n._id || i} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                  <div>
                    <span className={`badge ${n.isManId ? 'bg-brand-green text-white' : 'bg-brand-green-light text-brand-green'}`}>{n.isManId ? 'M' : 'P'}</span>
                    <span className="ml-2 text-sm font-medium text-slate-800">{n.chainAccountId}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Lvl {n.currentLevel || 0}</p>
                    <p className="text-[11px] text-slate-400">{n.accumulatedPackages || 0} pkgs</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sponsor List */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-brand-green" />
            <p className="text-sm font-semibold text-slate-800">Sponsor List ({sponsors.length})</p>
          </div>
          {sponsors.length === 0 ? (
            <p className="text-xs text-slate-400">No referrals yet. Share your code {u.referralCode || u.id}.</p>
          ) : (
            <div className="space-y-2">
              {sponsors.map((s, i) => (
                <div key={s.id || i} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{s.name}</p>
                    <p className="text-[11px] text-slate-400">{s.referralCode || s.id} · {s.phone || ''}</p>
                  </div>
                  <span className={`badge ${s.hasPurchased ? 'bg-brand-green-light text-brand-green' : 'bg-slate-200 text-slate-500'}`}>
                    {s.packages > 0 ? `${s.packages} pkg` : 'No pkg'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Withdraw request */}
        <button className="card w-full p-4 flex items-center justify-between active:bg-slate-50">
          <div className="flex items-center gap-2">
            <Wallet size={16} className="text-brand-green" />
            <span className="text-sm font-medium text-slate-800">Withdraw Request</span>
          </div>
          <span className="text-xs text-slate-400">৳{wallet.toLocaleString()} available</span>
        </button>

        {/* 24-Level Benefit Table (dark card) */}
        <div className="rounded-2xl bg-brand-dark text-white p-4 overflow-x-auto">
          <p className="text-sm font-semibold mb-3">24-Level Benefit Table</p>
          <table className="w-full text-[11px] min-w-[560px]">
            <thead>
              <tr className="text-white/60 border-b border-white/10">
                <th className="text-left py-2 px-1 font-medium">LEVEL</th>
                <th className="text-left py-2 px-1 font-medium">EXTRA PACKAGE</th>
                <th className="text-right py-2 px-1 font-medium">TAKA</th>
                <th className="text-left py-2 px-1 font-medium">DESIGNATION</th>
                <th className="text-left py-2 px-1 font-medium">INCENTIVE</th>
                <th className="text-center py-2 px-1 font-medium">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {LEVEL_TABLE.map(row => {
                const reached = level >= row.level
                return (
                  <tr key={row.level} className={`border-b border-white/5 ${reached ? 'text-white' : 'text-white/40'}`}>
                    <td className="py-2 px-1 font-semibold">{row.level}</td>
                    <td className="py-2 px-1">{row.package}</td>
                    <td className="py-2 px-1 text-right">৳{row.taka}</td>
                    <td className="py-2 px-1">{row.designation}</td>
                    <td className="py-2 px-1">{row.incentive}</td>
                    <td className="py-2 px-1 text-center">
                      {reached ? <span className="text-emerald-400">✓ Reached</span> : <span className="text-white/30">Locked</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
