"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // LocalStorage থেকে কার্ট ডাটা লোড করা
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("bss_cart");
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (e) {
      console.error("Failed to load cart from localStorage", e);
    }
  }, []);

  // LocalStorage-এ কার্ট সেভ করা
  useEffect(() => {
    try {
      localStorage.setItem("bss_cart", JSON.stringify(cartItems));
    } catch (e) {
      console.error("Failed to save cart to localStorage", e);
    }
  }, [cartItems]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen((prev) => !prev);

  const addToCart = (product, quantity = 1) => {
    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item._id === product._id || item.slug === product.slug);
      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex].quantity += quantity;
        return updated;
      }
      return [...prevItems, { ...product, quantity }];
    });
    openCart(); // প্রোডাক্ট কার্টে অ্যাড করলে অটোমেটিক সাইড ড্রয়ার খুলে যাবে
  };

  const removeFromCart = (productId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item._id !== productId && item.slug !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item._id === productId || item.slug === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const cartTotal = cartItems.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 1), 0);

  const addCompatibleProduct = (product, quantity = 1) =>
    addToCart({
      ...product,
      _id: product._id ?? product.id ?? product.slug,
      slug: product.slug ?? String(product.id ?? product._id),
      name: product.name ?? product.title,
      price: product.price ?? (product.pricePaisa ?? 0) / 100,
      points: product.points ?? (product.pointsX100 ?? 0) / 100,
    }, quantity);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartTotal,
        isCartOpen,
        openCart,
        closeCart,
        toggleCart,
        addToCart,
        add: addCompatibleProduct,
        removeFromCart,
        updateQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    // সেফটি ফলব্যাক যাতে ক্র্যাশ না করে
    return {
      cartItems: [],
      cartTotal: 0,
      isCartOpen: false,
      openCart: () => {},
      closeCart: () => {},
      toggleCart: () => {},
      addToCart: () => {},
      removeFromCart: () => {},
      updateQuantity: () => {},
    };
  }
  return context;
}