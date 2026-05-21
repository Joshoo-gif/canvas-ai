import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "canvas_session";

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Public routes that don't require authentication
  const isPublicPath = path === "/login" || path === "/register";
  
  // API routes to ignore in middleware (handled individually if needed)
  if (path.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value || "";

  // If the user is on a protected route without a token, redirect to login
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  // If the user is on a public route with a token, redirect to app
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL("/", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
