const BASE = 'https://brightsmartshop24.com'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export const api = {
  // Auth
  login: (body) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  register: (body) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  // Products
  getProducts: () => request('/api/admin/products'),

  // Categories
  getCategories: () => request('/api/categories'),

  // Orders
  getOrders: (userId, phone) => {
    const p = new URLSearchParams()
    if (userId) p.set('userId', userId)
    if (phone) p.set('phone', phone)
    return request(`/api/orders?${p}`)
  },
  placeOrder: (body) => request('/api/orders', { method: 'POST', body: JSON.stringify(body) }),

  // Dashboard
  getDashboardStats: (userId, phone) => {
    const p = new URLSearchParams()
    if (userId) p.set('userId', userId)
    if (phone) p.set('phone', phone)
    return request(`/api/client/dashboard-stats?${p}`)
  },

  // Profile
  getAccount: () => request('/api/client/account'),
  updateProfile: (body) => request('/api/client/profile/update', { method: 'POST', body: JSON.stringify(body) }),

  // Banners
  getBanners: () => request('/api/admin/banners'),
}
