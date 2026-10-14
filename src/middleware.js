import { NextResponse } from "next/server";

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // ১. কেউ যদি সরাসরি /admin বা /admin/... দিয়ে ঢুকতে চায়, তাকে ব্লক করে হোমপেজে পাঠিয়ে দেবো
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // ২. যদি সিক্রেট লগইন পেজ হয়, তবে এক্সেস দিতে হবে
  if (pathname === "/219192026/login") {
    return NextResponse.next();
  }

  // ৩. যদি কেউ সরাসরি /219192026 বা এর ভেতরের অন্য কোনো ড্যাশবোর্ড পেজে যেতে চায়
  if (pathname === "/219192026" || pathname.startsWith("/219192026/")) {
    const adminSession = request.cookies.get("admin_session");

    // যদি কুকি বা সেশন না থাকে, তবে তাকে সরাসরি /219192026/login পেজে রিডাইরেক্ট করে দেবো
    if (!adminSession) {
      const loginUrl = new URL("/219192026/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/admin", "/219192026/:path*", "/219192026"],
};