import { NextResponse, type NextRequest } from "next/server";

/**
 * Lightweight security middleware for sensitive surfaces: the admin control
 * room, the login flow, the auth callback, and every admin API endpoint.
 *
 * These pages must not be cached and must not be indexed. The actual auth
 * check still happens inside each page/API route via the Supabase session
 * token — this middleware only adds the protective headers.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/media") ||
    pathname.startsWith("/api/me");

  if (!isProtected) return NextResponse.next();

  const response = NextResponse.next();
  response.headers.set("Cache-Control", "no-store, max-age=0");
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  response.headers.set("Pragma", "no-cache");
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/login", "/auth/:path*", "/api/admin/:path*", "/api/media/:path*", "/api/me"],
};
