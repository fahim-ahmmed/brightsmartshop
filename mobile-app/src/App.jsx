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

// Wrapper renders CartPopulated or CartEmpty based on cart state
function CartRoute() {
  const { cart } = useApp()
  return cart.length > 0 ? <CartPopulated /> : <CartEmpty />
}

export default function App() {
  const { user } = useApp()
  const location = useLocation()
  const hideChrome = hideChromeRoutes.includes(location.pathname)
  const requiresAuth = !user && [
    '/me', '/dashboard', '/orders', '/track', '/checkout',
  ].some(p => location.pathname.startsWith(p))

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {hideChrome ? null : <Header />}
      <main className={`flex-1 ${hideChrome ? '' : 'pb-20'}`}>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
          <Route path="/" element={<Home />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/category/:name" element={<CategoryProducts />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<CartRoute />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/checkout" element={requiresAuth ? <Navigate to="/login" /> : <Checkout />} />
          <Route path="/me" element={user ? <MeHub /> : <Navigate to="/login" />} />
          <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/orders" element={user ? <MyOrders /> : <Navigate to="/login" />} />
          <Route path="/track/:orderNo" element={user ? <TrackOrder /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      {hideChrome ? null : <BottomNav />}
    </div>
  )
}
