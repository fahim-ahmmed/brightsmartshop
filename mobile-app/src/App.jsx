import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Header from './components/Header.jsx'
import BottomNav from './components/BottomNav.jsx'
import { useApp } from './context/AppContext.jsx'

import Login from './screens/Login.jsx'
import Register from './screens/Register.jsx'
import Home from './screens/Home.jsx'
import Categories from './screens/Categories.jsx'
import CategoryProducts from './screens/CategoryProducts.jsx'
import ProductDetail from './screens/ProductDetail.jsx'
import CartPopulated from './screens/CartPopulated.jsx'
import CartEmpty from './screens/CartEmpty.jsx'
import Wishlist from './screens/Wishlist.jsx'
import Checkout from './screens/Checkout.jsx'
import MeHub from './screens/MeHub.jsx'
import Dashboard from './screens/Dashboard.jsx'
import MyOrders from './screens/MyOrders.jsx'
import TrackOrder from './screens/TrackOrder.jsx'

const hideChromeRoutes = ['/login', '/register']

function CartRoute() {
  const { cart } = useApp()
  return cart.length > 0 ? <CartPopulated /> : <CartEmpty />
}

function ProtectedRoute({ children }) {
  const { user } = useApp()
  const location = useLocation()
  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />
  }
  return children
}

export default function App() {
  const { user } = useApp()
  const location = useLocation()
  const hideChrome = hideChromeRoutes.includes(location.pathname)

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col max-w-md mx-auto shadow-sm">
      {hideChrome ? null : <Header />}
      <main className={`flex-1 ${hideChrome ? '' : 'pb-24'}`}>
        <Routes>
          {/* অ্যাপ ওপেন করলেই সরাসরি Home পেজ দেখাবে */}
          <Route path="/" element={<Home />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/category/:name" element={<CategoryProducts />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<CartRoute />} />
          <Route path="/wishlist" element={<Wishlist />} />

          {/* লগইন ও রেজিস্টার */}
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />

          {/* পারচেজ (Checkout) বা প্রোফাইল/ড্যাশবোর্ডে গেলে লগইন না থাকলে লগইন চাবে */}
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/me" element={<ProtectedRoute><MeHub /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
          <Route path="/track/:orderNo" element={<ProtectedRoute><TrackOrder /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {hideChrome ? null : <BottomNav />}
    </div>
  )
}