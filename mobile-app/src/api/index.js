const LIVE_BASE = 'https://brightsmartshop24.com'

const isNative = typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()
const BASE = (import.meta.env.DEV && !isNative) ? '' : LIVE_BASE

export function resolveImageUrl(img) {
  if (!img) return ''
  const str = String(img).trim()
  if (str.startsWith('http://') || str.startsWith('https://') || str.startsWith('data:')) {
    return str
  }
  return `${LIVE_BASE}${str.startsWith('/') ? '' : '/'}${str}`
}

async function request(path, options = {}) {
  const url = `${BASE}${path}`
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.message || data.error || `HTTP ${res.status}`)
  }
  return data
}

export const api = {
  // Auth
  login: async ({ identifier, password }) => {
    const clean = String(identifier || '').trim()
    const isEmail = clean.includes('@')
    const targetEmail = isEmail ? clean.toLowerCase() : `${clean}@brightsmartshop.local`

    try {
      const betterRes = await request('/api/auth/sign-in/email', {
        method: 'POST',
        body: JSON.stringify({ email: targetEmail, password }),
      })
      if (betterRes?.user) return betterRes
    } catch {}

    return request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier: clean, password }),
    })
  },

  register: async ({ name, mobile, address, sponsorId, password }) => {
    const cleanMobile = String(mobile || '').trim()
    const generatedEmail = `${cleanMobile}@brightsmartshop.local`
    let createdUser = null

    try {
      const signUpRes = await request('/api/auth/sign-up/email', {
        method: 'POST',
        body: JSON.stringify({
          email: generatedEmail,
          password,
          name: String(name || '').trim(),
          mobile: cleanMobile,
          address: String(address || '').trim(),
          sponsorId,
          sponsorCode: sponsorId,
        }),
      })
      createdUser = signUpRes?.user || null
    } catch {
      const fallback = await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: String(name || '').trim(),
          phone: cleanMobile,
          mobile: cleanMobile,
          address: String(address || '').trim(),
          sponsorCode: sponsorId,
          password,
        }),
      })
      createdUser = fallback?.user || null
    }

    const syncRes = await request('/api/client/account', {
      method: 'PUT',
      body: JSON.stringify({
        userId: createdUser?.id || createdUser?._id || cleanMobile,
        name: String(name || '').trim(),
        phone: cleanMobile,
        mobile: cleanMobile,
        address: String(address || '').trim(),
        sponsorCode: sponsorId,
        password,
      }),
    }).catch(() => ({}))

    return {
      user: syncRes?.user || createdUser,
    }
  },

  // Products, Categories & Banners
  getProducts: async () => {
    try {
      return await request('/api/admin/products')
    } catch {
      return await request('/api/products')
    }
  },
  getCategories: async () => {
    try {
      return await request('/api/categories')
    } catch {
      return []
    }
  },
  getBanners: async () => {
    try {
      return await request('/api/admin/banners')
    } catch {
      return []
    }
  },

  // Orders & Dashboard
  getOrders: (userId, phone) => {
    const p = new URLSearchParams()
    if (userId) p.set('userId', userId)
    if (phone) p.set('phone', phone)
    return request(`/api/orders?${p.toString()}`)
  },
  placeOrder: (body) => request('/api/orders', { method: 'POST', body: JSON.stringify(body) }),
  getDashboardStats: (userId, phone, email) => {
    const p = new URLSearchParams()
    if (userId) p.set('userId', userId)
    if (phone) p.set('phone', phone)
    if (email) p.set('email', email)
    return request(`/api/client/dashboard-stats?${p.toString()}`)
  },

  // Profile, Withdraw & Product Request
  getAccount: (userId) => request(`/api/client/account${userId ? `?userId=${encodeURIComponent(userId)}` : ''}`),
  updateProfile: (body) => request('/api/client/profile/update', { method: 'PUT', body: JSON.stringify(body) }),
  changePassword: (body) => request('/api/auth/change-password', { method: 'POST', body: JSON.stringify(body) }),
  submitWithdraw: (body) => request('/api/client/withdraw', { method: 'POST', body: JSON.stringify(body) }),
  requestProduct: (body) => request('/api/client/product-request', { method: 'POST', body: JSON.stringify(body) }),

  // Blood Bank APIs
  getDonors: (bloodGroup = '', search = '') => {
    const p = new URLSearchParams()
    if (bloodGroup && bloodGroup !== 'All') p.set('bloodGroup', bloodGroup)
    if (search.trim()) p.set('search', search.trim())
    return request(`/api/blood-bank/donors?${p.toString()}`)
  },
  registerDonor: (body) => request('/api/blood-bank/donors', { method: 'POST', body: JSON.stringify(body) }),
  submitBloodRequest: (body) => request('/api/blood-bank/requests', { method: 'POST', body: JSON.stringify(body) }),

  // Customer Reviews APIs
  getReviews: () => request('/api/reviews'),
  submitReview: (body) => request('/api/reviews', { method: 'POST', body: JSON.stringify(body) }),
}