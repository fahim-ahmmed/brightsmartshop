import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../api/index.js'

const AppContext = createContext(null)

const DEFAULT_CATEGORIES = [
  { _id: 'cat-pkg', name: 'Package' },
  { _id: 'cat-1', name: 'Grocery' },
  { _id: 'cat-2', name: 'হিজাব' },
  { _id: 'cat-3', name: 'Fashion' },
  { _id: 'cat-4', name: 'Offers' },
  { _id: 'cat-5', name: 'Cosmetics' },
  { _id: 'cat-6', name: 'Beauty Care' },
  { _id: 'cat-7', name: 'Health & Medicine' },
  { _id: 'cat-8', name: 'Electronics' },
  { _id: 'cat-9', name: 'Home & Kitchen' },
]

function normalizeProduct(p) {
  const sellingPrice = Number(p.price ?? p.sellingPrice ?? p.salePrice ?? 0)
  const buyingPrice = Number(p.buyingPrice ?? p.costPrice ?? 0)
  let points = Number(p.points ?? p.point ?? p.rewardPoints ?? 0)
  if (!points && sellingPrice > buyingPrice && buyingPrice > 0) {
    points = Math.round(((sellingPrice - buyingPrice) / 3.5) * 100) / 100
  }
  return {
    ...p,
    _id: p._id || p.id,
    id: p._id || p.id,
    title: p.title || p.name || 'Product',
    price: sellingPrice,
    points,
    image: p.image || p.imageUrl || (Array.isArray(p.images) ? p.images[0] : ''),
    category: p.categoryName || p.category || 'General',
    unit: p.unit || '1 Pcs',
    stock: p.stock ?? p.quantity ?? 100,
  }
}

export function AppProvider({ children }) {
  const [user, setUserState] = useState(() => {
    try {
      const saved = localStorage.getItem('bright_user') || localStorage.getItem('bss_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [banners, setBanners] = useState([])
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('bright_cart') || localStorage.getItem('bss_cart')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [wishlist, setWishlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bss_wishlist')) || [] } catch { return [] }
  })
  const [loading, setLoading] = useState(true)

  const setUser = useCallback((u) => {
    setUserState(u)
    if (u) {
      localStorage.setItem('bright_user', JSON.stringify(u))
      localStorage.setItem('bss_user', JSON.stringify(u))
    } else {
      localStorage.removeItem('bright_user')
      localStorage.removeItem('bss_user')
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('bright_cart', JSON.stringify(cart))
    localStorage.setItem('bss_cart', JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    localStorage.setItem('bss_wishlist', JSON.stringify(wishlist))
  }, [wishlist])

  // Sync full user profile (including profileImage & BSS ID) from server when logged in
  const refreshUserProfile = useCallback(async (targetUser) => {
    const u = targetUser || user
    if (!u) return null
    try {
      const uid = u._id || u.id || u.referralCode || ''
      const phone = u.phone || u.mobile || ''
      const email = u.email || ''
      const statsData = await api.getDashboardStats(uid, phone, email)
      if (statsData?.user) {
        const merged = {
          ...u,
          ...statsData.user,
          id: statsData.user.referralCode || statsData.user.id || u.id,
          referralCode: statsData.user.referralCode || statsData.user.id || u.referralCode,
          profileImage: statsData.user.profileImage || u.profileImage || u.image || '',
        }
        setUser(merged)
        return merged
      }
    } catch (e) {
      console.error('Profile sync error:', e)
    }
    return u
  }, [user, setUser])

  useEffect(() => {
    if (user?.phone || user?.mobile || user?._id || user?.id) {
      refreshUserProfile(user)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadCatalog = useCallback(async () => {
    setLoading(true)
    try {
      const [pd, cd, bd] = await Promise.allSettled([
        api.getProducts(),
        api.getCategories(),
        api.getBanners(),
      ])

      let loadedProducts = []
      if (pd.status === 'fulfilled' && pd.value) {
        const raw = Array.isArray(pd.value)
          ? pd.value
          : (pd.value.products || pd.value.data || [])
        loadedProducts = (Array.isArray(raw) ? raw : []).map(normalizeProduct)
        setProducts(loadedProducts)
      }

      if (cd.status === 'fulfilled' && cd.value) {
        const rawCats = Array.isArray(cd.value)
          ? cd.value
          : (cd.value.categories || cd.value.data || [])
        if (Array.isArray(rawCats) && rawCats.length > 0) {
          setCategories(rawCats)
        } else if (loadedProducts.length > 0) {
          const uniqueNames = [...new Set(loadedProducts.map(p => p.category).filter(Boolean))]
          const merged = [...DEFAULT_CATEGORIES]
          uniqueNames.forEach((name, idx) => {
            if (!merged.some(c => c.name.toLowerCase() === String(name).toLowerCase())) {
              merged.push({ _id: `dyn-${idx}`, name })
            }
          })
          setCategories(merged)
        }
      }

      if (bd.status === 'fulfilled' && bd.value) {
        const rawBanners = Array.isArray(bd.value)
          ? bd.value
          : (bd.value.banners || bd.value.data || [])
        setBanners(Array.isArray(rawBanners) ? rawBanners : [])
      }
    } catch (e) {
      console.error('Catalog load error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadCatalog() }, [loadCatalog])

  const login = async (identifier, password) => {
    const clean = String(identifier || '').trim()
    const data = await api.login({ identifier: clean, password })
    const basicUser = data?.user || data?.data || { phone: clean, mobile: clean }

    // Immediately pull full profile (profileImage, BSS-ID, sponsorCode, address) from dashboard-stats
    try {
      const uid = basicUser._id || basicUser.id || basicUser.userId || ''
      const phone = basicUser.phone || basicUser.mobile || (!clean.includes('@') ? clean : '')
      const fullStats = await api.getDashboardStats(uid, phone, basicUser.email || '')
      if (fullStats?.user) {
        const completeUser = {
          ...basicUser,
          ...fullStats.user,
          id: fullStats.user.referralCode || fullStats.user.id || basicUser.id,
          referralCode: fullStats.user.referralCode || fullStats.user.id,
          profileImage: fullStats.user.profileImage || basicUser.profileImage || basicUser.image || '',
        }
        setUser(completeUser)
        return { ...data, user: completeUser }
      }
    } catch {}

    setUser(basicUser)
    return data
  }

  const logout = () => {
    setUser(null)
  }

  const addToCart = (product, qty = 1) => {
    const norm = normalizeProduct(product)
    setCart(prev => {
      const idx = prev.findIndex(i => (i._id || i.id) === norm._id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], quantity: (next[idx].quantity || 1) + qty }
        return next
      }
      return [...prev, { ...norm, quantity: qty }]
    })
  }

  const removeFromCart = (id) => setCart(prev => prev.filter(i => (i._id || i.id) !== id))

  const updateCartQty = (id, qty) => {
    if (qty < 1) { removeFromCart(id); return }
    setCart(prev => prev.map(i => (i._id || i.id) === id ? { ...i, quantity: qty } : i))
  }

  const clearCart = () => setCart([])

  const cartCount = cart.reduce((s, i) => s + (i.quantity || 1), 0)
  const cartTotal = cart.reduce((s, i) => s + Number(i.price || 0) * (i.quantity || 1), 0)
  const cartPoints = Math.round(cart.reduce((s, i) => s + Number(i.points || i.point || 0) * (i.quantity || 1), 0) * 100) / 100

  const toggleWishlist = (product) => {
    const norm = normalizeProduct(product)
    setWishlist(prev => {
      const exists = prev.find(i => (i._id || i.id) === norm._id)
      return exists ? prev.filter(i => (i._id || i.id) !== norm._id) : [...prev, norm]
    })
  }
  const isWishlisted = (id) => wishlist.some(i => (i._id || i.id) === id)

  return (
    <AppContext.Provider value={{
      user, setUser, login, logout, refreshUserProfile,
      products, categories, banners, loading, loadCatalog,
      cart, addToCart, removeFromCart, updateCartQty, clearCart,
      cartCount, cartTotal, cartPoints,
      wishlist, toggleWishlist, isWishlisted,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)