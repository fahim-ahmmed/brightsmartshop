"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Handle Logout Functionality
  const handleLogout = async () => {
    try {
      if (authClient?.signOut) {
        await authClient.signOut();
      }
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
      router.push("/login");
    }
  };

  const menuItems = [
    { label: "Dashboard", href: "/dashboard", icon: "📊" },
    { label: "My Levels", href: "/levels", icon: "👑" },
    { label: "My Account", href: "/client/account", icon: "👤" },
    { label: "Shop History", href: "/client/orders", icon: "🛍️" },
    { label: "Shop Now", href: "/shop", icon: "🛒" },
    { label: "Withdraw", href: "/client/withdraw", icon: "💳" },
    { label: "My Sponsor List", href: "/client/sponsors", icon: "👥" },
    { label: "Reports", href: "/client/reports", icon: "📄" },
  ];

  return (
    <div className="w-full lg:w-64 flex-shrink-0 font-sans">
      
      {/* 1. Mobile Top Header Navigation */}
      <div className="lg:hidden w-full bg-slate-950 text-white p-4 flex items-center justify-between sticky top-0 z-50 border-b border-slate-800 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black flex items-center justify-center text-xs shadow-md">
            bss
          </div>
          <div>
            <span className="font-serif font-bold text-sm tracking-tight block text-white">
              Bright Smart Shop
            </span>
            <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider block">
              DASHBOARD OVERVIEW
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
        >
          <span>Other pages</span>
          <span className="text-[10px]">{isMobileMenuOpen ? "▲" : "▼"}</span>
        </button>
      </div>

      {/* 2. Mobile Dropdown Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-slate-950 border-b border-slate-800 p-4 space-y-1.5 animate-in slide-in-from-top duration-200 sticky top-[65px] z-40">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-2 border-t border-slate-800 space-y-2">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-400 hover:text-emerald-400 transition-colors"
            >
              <span>←</span> Back to Main Store
            </Link>

            <button
              onClick={handleLogout}
              type="button"
              className="w-full flex items-center gap-3 px-4 py-2.5 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 font-black text-xs rounded-xl transition-all cursor-pointer"
            >
              <span>🚪</span>
              <span className="uppercase tracking-wider">Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Desktop Left Sidebar */}
      <aside className="hidden lg:flex w-64 bg-slate-950 text-slate-300 flex-col sticky top-0 h-screen border-r border-slate-800/80 justify-between">
        
        <div>
          {/* Header */}
          <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black text-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
              bss
            </div>
            <div className="leading-tight">
              <span className="font-serif font-extrabold text-white text-base tracking-tight block">
                Bright Smart Shop
              </span>
              <span className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase">
                CLIENT PORTAL
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-4 py-6 space-y-1.5 font-medium text-xs">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-md shadow-emerald-900/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section with Logout Button */}
        <div className="p-4 border-t border-slate-800/80 space-y-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-emerald-400 transition-colors px-2"
          >
            <span>←</span> Back to Main Store
          </Link>

          <button
            onClick={handleLogout}
            type="button"
            className="w-full flex items-center gap-3 px-4 py-3 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 font-black text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer group"
          >
            <span className="text-base group-hover:rotate-12 transition-transform">🚪</span>
            <span className="uppercase tracking-wider">Logout</span>
          </button>
        </div>

      </aside>

    </div>
  );
}