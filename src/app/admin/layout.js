"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", href: "/admin", icon: "📊" },
    { label: "Products & Upload", href: "/admin/products", icon: "📦" },
    { label: "Wishlist Requests", href: "/admin/wishlist", icon: "❤️" },
    { label: "Orders", href: "/admin/orders", icon: "📋" },
    { label: "Categories", href: "/admin/categories", icon: "🏷️" },
    { label: "Withdrawals", href: "/admin/withdrawals", icon: "💳" },
    { label: "Hero Banners", href: "/admin/banners", icon: "🖼️" },
    { label: "Management Team", href: "/admin/team", icon: "👥" },
    { label: "Users", href: "/admin/users", icon: "👤" },
  ];

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 font-sans flex flex-col lg:flex-row w-full min-w-full">
      
      {/* MOBILE TOP HEADER */}
      <div className="lg:hidden w-full bg-[#0B132B] p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-xs">
            bss
          </div>
          <div>
            <span className="font-bold text-sm text-white block">Bright Smart Shop</span>
            <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest block">ADMIN PANEL</span>
          </div>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-xl"
        >
          {isMobileMenuOpen ? "Close ✕" : "Menu ☰"}
        </button>
      </div>

      {/* MOBILE MENU */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#0B132B] border-b border-slate-800 p-4 space-y-2">
          {navItems.map((item, idx) => (
            <Link
              key={idx}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex w-64 bg-[#0B132B] text-slate-300 flex-col sticky top-0 h-screen border-r border-slate-800/80 justify-between shrink-0">
        <div>
          {/* Logo */}
          <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black text-base flex items-center justify-center shadow-md">
              bss
            </div>
            <div>
              <span className="font-extrabold text-white text-base tracking-tight block">
                Bright Smart Shop
              </span>
              <span className="text-[10px] text-emerald-400 font-black tracking-widest uppercase block">
                ADMIN CONTROL
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1 font-medium text-xs">
            {navItems.map((item, idx) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={idx}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? "bg-emerald-600 text-white font-black shadow-lg"
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

        {/* Bottom Website Link */}
        <div className="p-4 border-t border-slate-800/80">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-400 hover:text-emerald-400 transition-colors"
          >
            <span>🌐</span> Back to Main Store
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-6 lg:p-8 space-y-6 w-full max-w-7xl mx-auto overflow-x-hidden">
        {children}
      </main>

    </div>
  );
}