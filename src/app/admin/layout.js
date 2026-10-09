"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const navItems = [
    { label: "Dashboard", href: "/admin", icon: "📊" },
    { label: "Products", href: "/admin/products", icon: "📦" },
    { label: "Wishlist Requests", href: "/admin/wishlist-requests", icon: "❤️" },
    { label: "Orders", href: "/admin/orders", icon: "📋" },
    { label: "Categories", href: "/admin/categories", icon: "🏷️" },
    { label: "Withdrawals", href: "/admin/withdrawals", icon: "💳" },
    { label: "Hero Banners", href: "/admin/hero-banners", icon: "🖼️" },
    { label: "Management Team", href: "/admin/team", icon: "👥" },
    { label: "Levels", href: "/admin/levels", icon: "👑" },
    { label: "Notification Bar", href: "/admin/notifications", icon: "🔔" },
    { label: "Users", href: "/admin/users", icon: "👤" },
    { label: "Audit Log", href: "/admin/audit-log", icon: "📝" },
  ];

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 font-sans flex flex-col lg:flex-row w-full overflow-x-hidden">
      
      {/* MOBILE TOP BAR */}
      <div className="lg:hidden w-full bg-[#0B132B] p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black flex items-center justify-center text-xs shadow-md">
            bss
          </div>
          <div>
            <span className="font-bold text-sm text-white block">Bright Smart Shop</span>
            <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest block">ADMIN PORTAL</span>
          </div>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-xs"
        >
          {isMobileMenuOpen ? "Close Menu ✕" : "Admin Menu ☰"}
        </button>
      </div>

      {/* MOBILE DROPDOWN */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#0B132B] border-b border-slate-800 p-4 space-y-1 z-40">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 font-bold text-xs rounded-xl transition-all mt-3"
          >
            <span>🚪</span> Logout
          </button>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex w-64 bg-[#0B132B] text-slate-300 flex-col sticky top-0 h-screen border-r border-slate-800/80 justify-between shrink-0">
        <div>
          {/* Header */}
          <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black text-base flex items-center justify-center shadow-lg shadow-emerald-500/20">
              bss
            </div>
            <div>
              <span className="font-extrabold text-white text-base tracking-tight block">
                Bright Smart Shop
              </span>
              <span className="text-[10px] text-emerald-400 font-extrabold tracking-widest uppercase block">
                ADMIN CONTROL PANEL
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1 font-medium text-xs max-h-[calc(100vh-180px)] overflow-y-auto scrollbar-none">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-emerald-600 text-white font-black shadow-lg shadow-emerald-900/40"
                      : "text-slate-400 hover:text-white hover:bg-slate-900/80"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800/80 space-y-2">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-400 hover:text-emerald-400 transition-colors rounded-xl hover:bg-slate-900"
          >
            <span>🌐</span> Back to Main Website
          </Link>

          <button
            onClick={handleLogout}
            type="button"
            className="w-full flex items-center gap-3 px-4 py-2.5 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 font-black text-xs rounded-xl transition-all cursor-pointer group"
          >
            <span className="text-base group-hover:rotate-12 transition-transform">🚪</span>
            <span className="uppercase tracking-wider">Logout Admin</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 sm:p-8 space-y-8 max-w-[1600px] w-full mx-auto overflow-x-hidden">
        {children}
      </main>

    </div>
  );
}