// Middleware for protected routes - DEMO MODE (NO AUTH REQUIRED)

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Demo mode - allow all routes without authentication
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes that don't require auth
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api/auth|api/bitcoin).*)',
  ],
};