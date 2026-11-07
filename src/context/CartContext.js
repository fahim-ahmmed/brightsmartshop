"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load initial cart from LocalStorage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("bright_cart");
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (e) {
      console.error("Failed to parse cart from localstorage", e);
    }
  }, []);

  // Save cart changes to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem("bright_cart", JSON.stringify(cartItems));
    } catch (e) {
      console.error("Failed to save cart to localstorage", e);
    }
  }, [cartItems]);

  // Add Item to Cart (Increments quantity if already exists & saves points)
  const addToCart = (product) => {
    setCartItems((prevItems) => {
      const pId = product._id || product.id;
      const points = Number(product.points || product.point || product.rewardPoints || 0);
      const existingIndex = prevItems.findIndex(
        (item) => (item._id || item.id) === pId
      );

      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          points: points || updated[existingIndex].points || 0,
          quantity: (updated[existingIndex].quantity || 1) + 1,
        };
        return updated;
      } else {
        return [...prevItems, { ...product, id: pId, points, quantity: 1 }];
      }
    });
  };

  // Remove Item
  const removeFromCart = (id) => {
    setCartItems((prev) => prev.filter((item) => (item._id || item.id) !== id));
  };

  // Update Quantity (delta: +1 or -1)
  const updateQuantity = (id, delta) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if ((item._id || item.id) === id) {
            const newQty = (item.quantity || 1) + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const clearCart = () => setCartItems([]);

  // Calculate Totals
  const totalItemsCount = cartItems.reduce(
    (acc, item) => acc + (item.quantity || 1),
    0
  );

  const totalAmount = cartItems.reduce(
    (acc, item) => acc + (Number(item.price) || 0) * (item.quantity || 1),
    0
  );

  // স্বয়ংক্রিয় পয়েন্ট যোগফল (আইটেম পয়েন্ট × পরিমাণ)
  const totalPoints = cartItems.reduce(
    (acc, item) =>
      acc + (Number(item.points || item.point || item.rewardPoints) || 0) * (item.quantity || 1),
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        totalItemsCount,
        totalAmount,
        totalPoints,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);