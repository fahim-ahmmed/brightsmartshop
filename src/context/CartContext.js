"use client";

import React, { createContext, useContext, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (product) => {
    setCartItems((prev) => [...prev, product]);
  };

  const totalItemsCount = cartItems.length;
  const totalAmount = cartItems.reduce((acc, item) => acc + (item.price || 0), 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, totalItemsCount, totalAmount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    // If used outside provider, return default fallbacks instead of crashing
    return { cartItems: [], addToCart: () => {}, totalItemsCount: 0, totalAmount: 0 };
  }
  return context;
}