"use client";

import "./globals.css";
import { usePathname } from "next/navigation";
import SiteHeader from "@/components/layout/SiteHeader";
import Footer from "@/components/layout/Footer";

export default function RootLayout({ children }) {
  const pathname = usePathname();
  // Check if current path is an admin page
  const isAdminPage = pathname?.startsWith("/admin");

  return (
    <html lang="en">
      <body className="antialiased bg-[#0F172A] text-slate-100 font-sans">
        {!isAdminPage && <SiteHeader />}
        <main>{children}</main>
        {!isAdminPage && <Footer />}
      </body>
    </html>
  );
}