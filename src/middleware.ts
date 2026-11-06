import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const role = (req.auth?.user as any)?.role;

  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn || role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }
  if (pathname.startsWith("/chat") || pathname.startsWith("/dashboard") || pathname.startsWith("/account")) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/chat/:path*", "/dashboard/:path*", "/account/:path*", "/api/ai/:path*", "/api/user/:path*", "/api/admin/:path*", "/api/conversations/:path*"],
};