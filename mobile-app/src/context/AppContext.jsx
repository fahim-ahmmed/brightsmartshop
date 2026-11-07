import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../api/index.js'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bss_user')) } catch { return null }
  })
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [banners, setBanners] = useState([])
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bss_cart')) || [] } catch { return [] }
  })
  const [wishlist, setWishlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bss_wishlist')) || [] } catch { return [] }
  })
  const [loading, setLoading] = useState(true)

  // persist cart & wishlist
  useEffect(() => { localStorage.setItem('bss_cart', JSON.stringify(cart)) }, [cart])
  useEffect(() => { localStorage.setItem('bss_wishlist', JSON.stringify(wishlist)) }, [wishlist])

  const loadCatalog = useCallback(async () => {
    setLoading(true)
    try {
      const [pd, cd, bd] = await Promise.allSettled([
        api.getProducts(),
        api.getCategories(),
        api.getBanners(),
      ])
      if (pd.status === 'fulfilled' && pd.value?.products) setProducts(pd.value.products)
      if (cd.status === 'fulfilled') {
        const list = cd.value?.categories || cd.value || []
        setCategories(Array.isArray(list) ? list : [])
      }
      if (bd.status === 'fulfilled') {
        const list = bd.value?.banners || bd.value || []
        setBanners(Array.isArray(list) ? list : [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadCatalog() }, [loadCatalog])

  const login = async (identifier, password) => {
    const data = await api.login({ identifier, password })
    if (data.user) {
      setUser(data.user)
      localStorage.setItem('bss_user', JSON.stringify(data.user))
    }
    return data
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('bss_user')
  }

  // Cart helpers
  const addToCart = (product, qty = 1) => {
    setCart(prev => {
      const idx = prev.findIndex(i => i._id === product._id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], quantity: next[idx].quantity + qty }
        return next
      }
      return [...prev, { ...product, quantity: qty }]
    })
  }

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i._id !== id))

  const updateCartQty = (id, qty) => {
    if (qty < 1) { removeFromCart(id); return }
    setCart(prev => prev.map(i => i._id === id ? { ...i, quantity: qty } : i))
  }

  const clearCart = () => setCart([])

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)
  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const cartPoints = cart.reduce((s, i) => s + (i.points || 0) * i.quantity, 0)

  // Wishlist helpers
  const toggleWishlist = (product) => {
    setWishlist(prev => {
      const exists = prev.find(i => i._id === product._id)
      return exists ? prev.filter(i => i._id !== product._id) : [...prev, product]
    })
  }
  const isWishlisted = (id) => wishlist.some(i => i._id === id)

  return (
    <AppContext.Provider value={{
      user, setUser, login, logout,
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
