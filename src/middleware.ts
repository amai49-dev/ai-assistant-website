// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value
  const pathname = req.nextUrl.pathname

  // Allow assets and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico)$/)
  ) {
    return NextResponse.next()
  }

  // If user has token and tries to access login page, redirect to home
  if (token && pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // If no token and not on login page, redirect to login
  if (!token && !pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next).*)'],
}
