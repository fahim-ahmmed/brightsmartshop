import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Search, X } from 'lucide-react'
import { api } from '../api/index.js'

const BLOOD_GROUPS = ['All', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
const SELECTABLE_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']

export default function BloodBank() {
  const navigate = useNavigate()
  const [activeMode, setActiveMode] = useState('receiver') // 'receiver' | 'donor'
  const [donors, setDonors] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedGroup, setSelectedGroup] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [notice, setNotice] = useState({ type: '', text: '' })

  const [donorForm, setDonorForm] = useState({
    name: '',
    address: '',
    phone: '',
    bloodGroup: 'O+',
    lastDonationDate: '',
  })
  const [submittingDonor, setSubmittingDonor] = useState(false)

  const [selectedDonor, setSelectedDonor] = useState(null)
  const [requestForm, setRequestForm] = useState({
    patientName: '',
    patientCondition: 'জরুরি (Critical / Emergency)',
    phone: '',
    hemoglobin: '',
    reason: '',
  })
  const [submittingRequest, setSubmittingRequest] = useState(false)

  const fetchDonors = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.getDonors(selectedGroup, searchQuery)
      setDonors(data.donors || [])
    } catch (err) {
      console.error('Donor fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedGroup, searchQuery])

  useEffect(() => {
    fetchDonors()
  }, [fetchDonors])

  const handleDonorSubmit = async (e) => {
    e.preventDefault()
    setSubmittingDonor(true)
    setNotice({ type: '', text: '' })
    try {
      const data = await api.registerDonor(donorForm)
      setNotice({ type: 'success', text: data.message || 'সফলভাবে ডোনার হিসেবে যুক্ত হয়েছেন!' })
      setDonorForm({
        name: '',
        address: '',
        phone: '',
        bloodGroup: 'O+',
        lastDonationDate: '',
      })
      await fetchDonors()
      setActiveMode('receiver')
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'রেজিস্ট্রেশন ব্যর্থ হয়েছে।' })
    } finally {
      setSubmittingDonor(false)
    }
  }

  const handleRequestSubmit = async (e) => {
    e.preventDefault()
    if (!selectedDonor) return
    setSubmittingRequest(true)
    setNotice({ type: '', text: '' })

    try {
      const data = await api.submitBloodRequest({
        donorId: selectedDonor._id,
        donorName: selectedDonor.name,
        bloodGroup: selectedDonor.bloodGroup,
        ...requestForm,
      })
      setNotice({
        type: 'success',
        text: data.message || 'রক্তের রিকোয়েস্ট অ্যাডমিন প্যানেলে পাঠানো হয়েছে!',
      })
      setSelectedDonor(null)
      setRequestForm({
        patientName: '',
        patientCondition: 'জরুরি (Critical / Emergency)',
        phone: '',
        hemoglobin: '',
        reason: '',
      })
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'রিকোয়েস্ট পাঠানো যায়নি।' })
    } finally {
      setSubmittingRequest(false)
    }
  }

  return (
    <div className="px-4 py-3 space-y-4 font-sans text-gray-800">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1 text-sm font-black text-gray-900"
      >
        <ChevronLeft size={18} /> Blood Bank
      </button>

      {/* Banner + Mode Switch */}
      <div className="bg-gradient-to-r from-red-800 via-rose-700 to-red-800 text-white rounded-3xl p-5 shadow-md space-y-3">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest bg-white/15 px-2.5 py-0.5 rounded-full">
            🩸 মানবিক ব্লাড ব্যাংক
          </span>
          <h1 className="text-lg font-black mt-1.5">ব্রাইট স্মার্ট শপ ব্লাড ব্যাংক</h1>
          <p className="text-[11px] text-red-100 mt-0.5 leading-relaxed">
            রক্তদাতা হিসেবে রেজিস্ট্রেশন করুন অথবা জরুরি প্রয়োজনে রক্ত খুঁজে রিকোয়েস্ট পাঠান।
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 bg-black/20 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveMode('receiver')}
            className={`py-2.5 rounded-xl text-xs font-black transition ${
              activeMode === 'receiver' ? 'bg-white text-red-700 shadow-sm' : 'text-red-100'
            }`}
          >
            🔍 রক্ত খুঁজুন (Receiver)
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('donor')}
            className={`py-2.5 rounded-xl text-xs font-black transition ${
              activeMode === 'donor' ? 'bg-white text-red-700 shadow-sm' : 'text-red-100'
            }`}
          >
            ❤️ রক্তদাতা হন (Donor)
          </button>
        </div>
      </div>

      {notice.text && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold ${
            notice.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-700'
          }`}
        >
          {notice.type === 'success' ? '✅ ' : '⚠️ '}
          {notice.text}
        </div>
      )}

      {/* MODE 1: RECEIVER */}
      {activeMode === 'receiver' && (
        <div className="space-y-3.5">
          {/* Search Input */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="এলাকা বা ডোনারের নাম খুঁজুন..."
              className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-semibold outline-none focus:border-red-500"
            />
          </div>

          {/* Blood Group Filter Pills */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {BLOOD_GROUPS.map((bg) => (
              <button
                key={bg}
                type="button"
                onClick={() => setSelectedGroup(bg)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-black transition ${
                  selectedGroup === bg
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-white text-red-700 border border-red-100'
                }`}
              >
                {bg === 'All' ? 'সব গ্রুপ' : `🩸 ${bg}`}
              </button>
            ))}
          </div>

          <p className="text-[11px] font-bold text-slate-500">
            পাওয়া গেছে: {donors.length} জন রক্তদাতা
          </p>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl h-36 animate-pulse border border-slate-100" />
              ))}
            </div>
          ) : donors.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-8 text-center space-y-2.5">
              <div className="text-4xl">🩸</div>
              <p className="text-xs font-bold text-slate-600">
                এই রক্তের গ্রুপে এখনো কোনো ডোনার পাওয়া যায়নি।
              </p>
              <button
                type="button"
                onClick={() => setActiveMode('donor')}
                className="px-5 py-2.5 bg-red-600 text-white text-xs font-black rounded-xl"
              >
                ❤️ ডোনার হিসেবে যুক্ত হোন
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {donors.map((donor) => (
                <div
                  key={donor._id}
                  className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-rose-500 text-white font-black text-base flex items-center justify-center shrink-0">
                      {donor.bloodGroup}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-black text-slate-900 truncate">{donor.name}</h3>
                      <p className="text-[11px] text-slate-500 truncate">📍 {donor.address}</p>
                      <p className="text-[10px] font-bold mt-0.5">
                        {donor.isEligible ? (
                          <span className="text-emerald-700">🟢 রক্তদানে প্রস্তুত</span>
                        ) : (
                          <span className="text-amber-700">
                            🟡 বিশ্রামে ({donor.daysRemaining} দিন বাকি)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] bg-slate-50 rounded-xl px-3 py-2">
                    <span className="text-slate-500">
                      শেষ দান:{' '}
                      <strong className="text-slate-800">
                        {donor.lastDonationDate
                          ? new Date(donor.lastDonationDate).toLocaleDateString('bn-BD')
                          : 'নতুন'}
                      </strong>
                    </span>
                    <span className="font-mono font-bold text-slate-600">{donor.phone}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedDonor(donor)}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl active:scale-[0.99] transition"
                  >
                    🩸 রক্তের জন্য রিকোয়েস্ট করুন
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODE 2: DONOR REGISTRATION */}
      {activeMode === 'donor' && (
        <form
          onSubmit={handleDonorSubmit}
          className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-3.5 text-xs"
        >
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-black text-slate-900">ডোনার রেজিস্ট্রেশন ফর্ম</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              আপনার মোবাইল নম্বর গোপন থাকবে, শুধু অ্যাডমিন যোগাযোগ করতে পারবেন।
            </p>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">আপনার পূর্ণ নাম *</label>
            <input
              type="text"
              required
              value={donorForm.name}
              onChange={(e) => setDonorForm({ ...donorForm, name: e.target.value })}
              placeholder="আপনার নাম লিখুন"
              className="input-field py-2.5"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">ফোন নম্বর *</label>
              <input
                type="tel"
                required
                value={donorForm.phone}
                onChange={(e) => setDonorForm({ ...donorForm, phone: e.target.value })}
                placeholder="017XXXXXXXX"
                className="input-field py-2.5"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">রক্তের গ্রুপ *</label>
              <select
                value={donorForm.bloodGroup}
                onChange={(e) => setDonorForm({ ...donorForm, bloodGroup: e.target.value })}
                className="input-field py-2.5 font-black text-red-700"
              >
                {SELECTABLE_GROUPS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">ঠিকানা *</label>
            <input
              type="text"
              required
              value={donorForm.address}
              onChange={(e) => setDonorForm({ ...donorForm, address: e.target.value })}
              placeholder="এলাকা, থানা, জেলা"
              className="input-field py-2.5"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              শেষ কবে রক্ত দিয়েছেন? <span className="text-slate-400 font-normal">(ঐচ্ছিক)</span>
            </label>
            <input
              type="date"
              value={donorForm.lastDonationDate}
              onChange={(e) => setDonorForm({ ...donorForm, lastDonationDate: e.target.value })}
              className="input-field py-2.5"
            />
          </div>

          <button
            type="submit"
            disabled={submittingDonor}
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl shadow-sm disabled:opacity-50"
          >
            {submittingDonor ? 'সাবমিট হচ্ছে...' : '🩸 রেজিস্ট্রেশন সম্পন্ন করুন'}
          </button>
        </form>
      )}

      {/* BLOOD REQUEST MODAL */}
      {selectedDonor && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-3">
          <div className="bg-white rounded-3xl w-full max-w-md p-5 space-y-3.5 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-10 h-10 rounded-xl bg-red-600 text-white font-black text-sm flex items-center justify-center">
                  {selectedDonor.bloodGroup}
                </span>
                <div>
                  <p className="text-xs font-black text-slate-900">{selectedDonor.name}</p>
                  <p className="text-[10px] text-slate-500">📍 {selectedDonor.address}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDonor(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRequestSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">রোগীর নাম *</label>
                <input
                  type="text"
                  required
                  value={requestForm.patientName}
                  onChange={(e) => setRequestForm({ ...requestForm, patientName: e.target.value })}
                  placeholder="রোগীর পূর্ণ নাম"
                  className="input-field py-2.5"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">রোগীর বর্তমান অবস্থা *</label>
                <select
                  value={requestForm.patientCondition}
                  onChange={(e) =>
                    setRequestForm({ ...requestForm, patientCondition: e.target.value })
                  }
                  className="input-field py-2.5 font-bold"
                >
                  <option value="জরুরি (Critical / Emergency)">জরুরি (Critical / Emergency)</option>
                  <option value="অপারেশন / সিজার (Operation)">অপারেশন / সিজার (Operation)</option>
                  <option value="মাঝারি (Moderate)">মাঝারি (Moderate)</option>
                  <option value="স্থিতিশীল (Stable)">স্থিতিশীল (Stable)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ফোন নম্বর *</label>
                  <input
                    type="tel"
                    required
                    value={requestForm.phone}
                    onChange={(e) => setRequestForm({ ...requestForm, phone: e.target.value })}
                    placeholder="017XXXXXXXX"
                    className="input-field py-2.5"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">হিমোগ্লোবিন (Hb) *</label>
                  <input
                    type="text"
                    required
                    value={requestForm.hemoglobin}
                    onChange={(e) => setRequestForm({ ...requestForm, hemoglobin: e.target.value })}
                    placeholder="যেমন: 7.5"
                    className="input-field py-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  রক্ত দেওয়ার কারণ ও হাসপাতাল *
                </label>
                <textarea
                  rows={2}
                  required
                  value={requestForm.reason}
                  onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
                  placeholder="রক্তের প্রয়োজনের কারণ ও হাসপাতালের নাম..."
                  className="input-field py-2.5 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submittingRequest}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl shadow-sm disabled:opacity-50"
              >
                {submittingRequest ? 'পাঠানো হচ্ছে...' : '📩 অ্যাডমিনের কাছে রিকোয়েস্ট পাঠান'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}