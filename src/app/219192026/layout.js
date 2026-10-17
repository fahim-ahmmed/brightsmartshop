"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [userRole, setUserRole] = useState("Admin");

  useEffect(() => {
    if (pathname === "/219192026/login" || pathname === "/admin/login") {
      setIsVerified(true);
      return;
    }

    const adminToken = localStorage.getItem("admin_logged_in");
    const savedUser = localStorage.getItem("bright_user");

    if (!adminToken) {
      router.push("/219192026/login");
      return;
    }

    try {
      if (savedUser) {
        const u = JSON.parse(savedUser);
        const role = u.role || "Admin";
        setUserRole(role);

        // 🟢 সাব-এডমিন হলে কেবল ড্যাশবোর্ড (/219192026) এবং প্রোডাক্ট পেজ (/219192026/products) এ যাওয়ার অনুমতি থাকবে
        const isSubAdmin = role.toLowerCase() === "sub-admin" || role.toLowerCase() === "subadmin";
        
        if (isSubAdmin) {
          const allowedPaths = ["/219192026", "/219192026/products", "/admin", "/admin/products"];
          const isAllowed = allowedPaths.some(path => pathname === path || pathname.startsWith(path + "/"));
          
          if (!isAllowed) {
            toast.error("সাব-এডমিনের শুধুমাত্র ড্যাশবোর্ড এবং প্রোডাক্ট আপলোড করার অ্যাক্সেস রয়েছে!");
            router.push("/219192026");
            return;
          }
        }
      }
    } catch (e) {
      console.error("Role check error", e);
    }

    setIsVerified(true);
  }, [pathname, router]);

  if (pathname === "/219192026/login" || pathname === "/admin/login") {
    return (
      <div className="min-h-screen bg-[#0F172A] text-slate-100 font-sans w-full">
        {children}
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center text-emerald-400 font-bold text-sm">
        নিরাপত্তা যাচাই করা হচ্ছে...
      </div>
    );
  }

  const isSubAdmin = userRole.toLowerCase() === "sub-admin" || userRole.toLowerCase() === "subadmin";

  // মূল নেভিগেশন লিস্ট
  const allNavItems = [
    { label: "Dashboard", href: "/219192026", icon: "📊" },
    { label: "Products & Upload", href: "/219192026/products", icon: "📦" },
    { label: "Wishlist Requests", href: "/219192026/wishlist", icon: "❤️" },
    { label: "Orders", href: "/219192026/orders", icon: "📋" },
    { label: "Categories", href: "/219192026/categories", icon: "🏷️" },
    { label: "Withdrawals", href: "/219192026/withdrawals", icon: "💳" },
    { label: "Hero Banners", href: "/219192026/banners", icon: "🖼️" },
    { label: "Management Team", href: "/219192026/team", icon: "👥" },
    { label: "Users", href: "/219192026/users", icon: "👤" },
  ];

  // 🟢 সাব-এডমিন হলে কেবল ড্যাশবোর্ড এবং প্রোডাক্টস অপশন ফিল্টার করে দেখাবে
  const navItems = isSubAdmin
    ? allNavItems.filter(item => item.href === "/219192026" || item.href === "/219192026/products")
    : allNavItems;

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 font-sans flex flex-col lg:flex-row w-full min-w-full">
      
      {/* MOBILE TOP HEADER */}
      <div className="lg:hidden w-full bg-[#0B132B] p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <img
              src="/logo.jpg"
              alt="Bright Smart Shop Logo"
              className="h-10 sm:h-12 w-auto object-contain rounded-xl"
            />
          </Link>

          <div>
            <span className="font-bold text-sm text-white block">Bright Smart Shop</span>
            <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest block">
              {isSubAdmin ? "SUB-ADMIN PANEL" : "ADMIN PANEL"}
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-xl cursor-pointer"
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
            <img
              src="/logo.jpg"
              alt="Bright Smart Shop Logo"
              className="h-10 w-auto object-contain rounded-xl"
            />
            <div>
              <span className="font-extrabold text-white text-sm tracking-tight block">
                Bright Smart Shop
              </span>
              <span className="text-[10px] text-emerald-400 font-black tracking-widest uppercase block">
                {isSubAdmin ? "SUB-ADMIN CONTROL" : "ADMIN CONTROL"}
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

        {/* Bottom Website Link & Logout */}
        <div className="p-4 border-t border-slate-800/80 space-y-2">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-400 hover:text-emerald-400 transition-colors"
          >
            <span>🌐</span> Back to Main Store
          </Link>
          <button
            onClick={() => {
              localStorage.removeItem("admin_logged_in");
              localStorage.removeItem("bright_user");
              document.cookie = "admin_session=; path=/; max-age=0;";
              router.push("/219192026/login");
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-6 lg:p-8 space-y-6 w-full max-w-7xl mx-auto overflow-x-hidden">
        {children}
      </main>

    </div>
  );
}