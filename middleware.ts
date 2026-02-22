import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const AUTH_PAGES = ["/sign-in", "/sign-up", "/forgot-password", "/reset-password"];
const PROTECTED_PREFIXES = ["/dashboard", "/admin"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasSession = !!getSessionCookie(request); // cookie-only check (fast, not fully secure) :contentReference[oaicite:10]{index=10}

  // 1) protect dashboard/admin
  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (!hasSession) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
  }

  // 2) block auth pages when already logged in
  if (AUTH_PAGES.some((p) => pathname.startsWith(p))) {
    if (hasSession) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/sign-in", "/sign-up", "/forgot-password", "/reset-password"],
};
