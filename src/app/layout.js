"use client";

import "./globals.css";
import { usePathname } from "next/navigation";
import SiteHeader from "@/components/layout/SiteHeader";
import CustomerReviews from "@/components/layout/CustomerReviews";
import Footer from "@/components/layout/Footer";
import { CartProvider } from "@/context/CartContext";
import { Toaster } from "react-hot-toast";

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const isAdminPage =
    pathname?.startsWith("/admin") || pathname?.startsWith("/219192026");

  // শুধুমাত্র হোমপেজে (/) রিভিউ দেখাবে
  const isHomePage = pathname === "/";

  return (
    <html lang="en">
      <head>
        <title>Bright Smart Shop</title>
        <link rel="icon" href="/logo.jpg" type="image/jpeg" />
        <link rel="shortcut icon" href="/logo.jpg" />
        <link rel="apple-touch-icon" href="/logo.jpg" />
      </head>
      <body className="antialiased bg-[#0F172A] text-slate-100 font-sans">
        <CartProvider>
          {!isAdminPage && <SiteHeader />}
          <main>{children}</main>
          {isHomePage && <CustomerReviews />}
          {!isAdminPage && <Footer />}
          <Toaster position="top-center" reverseOrder={false} />
        </CartProvider>
      </body>
    </html>
  );
}