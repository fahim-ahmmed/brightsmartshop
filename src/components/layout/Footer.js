"use client";

import React from "react";
import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="w-full bg-[#0a231b] text-white font-sans py-6 border-t border-emerald-900/50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 space-y-6">
        
        {/* 1. TOP HEADER BRAND ROW (COMPACT) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-emerald-800/40">
          <div className="flex items-center gap-3">
            {/* Public Folder Logo */}
            <img 
              src="/logo.jpg" 
              alt="Bright Smart Shop Logo" 
              className="h-10 sm:h-12 w-auto object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/logo.svg";
              }}
            />
            <div>
              <h2 className="text-lg font-black tracking-wide text-white leading-tight">
                BRIGHT SMART SHOP
              </h2>
              <p className="text-[11px] font-medium text-emerald-400">
                Smart Shopping, Better Living
              </p>
            </div>
          </div>

          <p className="text-xs text-emerald-100/70 max-w-md leading-relaxed">
            Your trusted destination for everyday essentials, bringing quality products and convenient shopping together.
          </p>
        </div>

        {/* 2. FOOTER LINKS GRID (SLIM SPACING) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs text-emerald-100/80">
          
          {/* Column 1: Quick Links */}
          <div className="space-y-2">
            <h3 className="font-extrabold text-xs text-white uppercase tracking-wider border-b border-emerald-500/30 pb-1 inline-block">
              Quick Links
            </h3>
            <ul className="space-y-1.5 font-medium">
              <li>
                <Link href="/" className="hover:text-emerald-300 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-emerald-300 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/categories" className="hover:text-emerald-300 transition-colors">
                  All Categories
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-emerald-300 transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Customer Service */}
          <div className="space-y-2">
            <h3 className="font-extrabold text-xs text-white uppercase tracking-wider border-b border-emerald-500/30 pb-1 inline-block">
              Customer Service
            </h3>
            <ul className="space-y-1.5 font-medium">
              <li>
                <Link href="/client/profile" className="hover:text-emerald-300 transition-colors">
                  My Account
                </Link>
              </li>
              <li>
                <Link href="/client/orders" className="hover:text-emerald-300 transition-colors">
                  Track Order
                </Link>
              </li>
              <li>
                <Link href="/shipping-policy" className="hover:text-emerald-300 transition-colors">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link href="/return-policy" className="hover:text-emerald-300 transition-colors">
                  Return & Refund
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Policies */}
          <div className="space-y-2">
            <h3 className="font-extrabold text-xs text-white uppercase tracking-wider border-b border-emerald-500/30 pb-1 inline-block">
              Policies
            </h3>
            <ul className="space-y-1.5 font-medium">
              <li>
                <Link href="/privacy-policy" className="hover:text-emerald-300 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-emerald-300 transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/payment-policy" className="hover:text-emerald-300 transition-colors">
                  Payment Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact Us */}
          <div className="space-y-2">
            <h3 className="font-extrabold text-xs text-white uppercase tracking-wider border-b border-emerald-500/30 pb-1 inline-block">
              Contact Us
            </h3>
            <div className="space-y-1.5 font-medium">
              <p>
                <span className="text-emerald-400 font-bold">Website:</span> brightsmartshop24.com
              </p>
              <p>
                <span className="text-emerald-400 font-bold">Email:</span> brightsmartshop24@gmail.com
              </p>
              <p>
                <span className="text-emerald-400 font-bold">Phone:</span> 01727629513
              </p>
              
              <p>
                <span className="text-emerald-400 font-bold">WhatsApp:</span> 01727629513
              </p>
            </div>
          </div>

        </div>

        {/* 3. FOLLOW US & COPYRIGHT BAR (COMPACT ROW) */}
        <div className="pt-4 border-t border-emerald-800/40 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          
          {/* Social Icons */}
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-emerald-300 text-[11px] uppercase tracking-wider mr-1">Follow Us:</span>
            
            {/* Facebook Icon */}
            <a 
              href="https://www.facebook.com/share/1FNwH5XoBg/" 
              target="_blank" 
              rel="noreferrer" 
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-emerald-600 flex items-center justify-center text-white transition-all shadow-sm"
              title="Facebook Page"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>

            {/* Instagram Icon */}
            <a 
              href="#" 
              target="_blank" 
              rel="noreferrer" 
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-emerald-600 flex items-center justify-center text-white transition-all shadow-sm"
              title="Instagram"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>

            {/* YouTube Icon */}
            <a 
              href="#" 
              target="_blank" 
              rel="noreferrer" 
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-emerald-600 flex items-center justify-center text-white transition-all shadow-sm"
              title="YouTube"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>

            {/* WhatsApp Icon */}
            <a 
              href="https://wa.me/8801727629513" 
              target="_blank" 
              rel="noreferrer" 
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-emerald-600 flex items-center justify-center text-white transition-all shadow-sm"
              title="WhatsApp"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
            </a>
          </div>

           {/* Copyright Text */}
          <p className="text-[11px] font-medium text-emerald-200/70 text-center md:text-right">
            © 2026 Bright Smart Shop (BSS). All Rights Reserved.
          </p>

          {/* Developed By Text (Centered) */}
          <p className="text-[11px] font-medium text-emerald-200/80 text-center">
           Developed by <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 tracking-wide drop-shadow-sm">Fahim Ahmmed</span>
          </p>

         

        </div>

      </div>
    </footer>
  );
}