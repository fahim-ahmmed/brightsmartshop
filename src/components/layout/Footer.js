"use client";

import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300 font-sans border-t border-slate-800/80 pt-12 pb-6">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Main Footer Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start justify-between">
          
          {/* Brand & Short Tagline */}
          <div className="md:col-span-5 space-y-3">
            <Link href="/" className="flex items-center gap-3 inline-flex">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black text-sm flex items-center justify-center shadow-lg shadow-emerald-500/20">
                bss
              </div>
              <span className="font-serif font-extrabold text-white text-lg tracking-tight">
                Bright Smart Shop
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Smarter shopping with 24-level customer cashback rewards. Trusted products, instant withdrawals, and dedicated customer support.
            </p>
          </div>

          {/* Quick Links Column */}
          <div className="md:col-span-3 space-y-2.5">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-emerald-400">
              Navigation
            </h4>
            <div className="flex flex-col space-y-2 text-xs font-semibold text-slate-300">
              <Link href="/shop" className="hover:text-emerald-400 transition-colors w-fit">
                All Products
              </Link>
              <Link href="/levels" className="hover:text-emerald-400 transition-colors w-fit">
                24 Level Benefits
              </Link>
              <Link href="/dashboard" className="hover:text-emerald-400 transition-colors w-fit">
                Client Dashboard
              </Link>
              <Link href="/client/withdraw" className="hover:text-emerald-400 transition-colors w-fit">
                Withdraw Funds
              </Link>
            </div>
          </div>

          {/* Payment Gateways */}
          <div className="md:col-span-4 space-y-2.5">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-emerald-400">
              Supported Withdrawals
            </h4>
            <p className="text-xs text-slate-400">
              Withdraw your earnings instantly via supported payment channels:
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1 font-bold text-[11px]">
              <span className="px-3 py-1 bg-slate-900 border border-slate-800 text-pink-400 rounded-xl">
                bKash
              </span>
              <span className="px-3 py-1 bg-slate-900 border border-slate-800 text-orange-400 rounded-xl">
                Nagad
              </span>
              <span className="px-3 py-1 bg-slate-900 border border-slate-800 text-purple-400 rounded-xl">
                Rocket
              </span>
              <span className="px-3 py-1 bg-slate-900 border border-slate-800 text-emerald-400 rounded-xl">
                Bank Transfer
              </span>
            </div>
          </div>

        </div>

        {/* Bottom Bar & Developer Credit */}
        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} <span className="text-slate-300 font-bold">Bright Smart Shop</span>. All rights reserved.
          </div>

          {/* Styled Developer Badge */}
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800/80 text-slate-400">
            <span>Developed by</span>
            <span className="font-extrabold text-emerald-400 tracking-wide">
              Fahim Ahammad
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}