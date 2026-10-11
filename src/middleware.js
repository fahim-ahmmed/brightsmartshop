import { NextResponse } from "next/server";

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // শুধু /admin এবং /admin/... রুটগুলোর জন্য সিকিউরিটি চেক
  if (pathname.startsWith("/admin")) {
    // Better Auth এর সেসন কুকি চেক করা
    const sessionCookie = 
      request.cookies.get("better-auth.session_token") ||
      request.cookies.get("__Secure-better-auth.session_token");

    // ১. যদি সেসন কুকি না থাকে, তবে সরাসরি /login পেজে পাঠাবে
    if (!sessionCookie) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// কোন কোন পাথে Middleware রান করবে
export const config = {
  matcher: ["/admin/:path*"],
};