import { NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

// শুধু কুকি আছে কিনা দেখে দ্রুত redirect করে। আসল যাচাই হয় পেজের ভেতরে (requireUser)।
const PROTECTED = ['/dashboard', '/profile', '/checkout', '/orders', '/admin'];
const GUEST_ONLY = ['/login', '/register', '/forgot-password'];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const hasSession = !!getSessionCookie(request);

  if (!hasSession && PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (hasSession && GUEST_ONLY.includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url)); // লগইন করা ইউজার সরাসরি Home-এ
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/checkout/:path*', '/orders/:path*', '/admin/:path*', '/login', '/register', '/forgot-password'],
};
