import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Simple in-memory rate limiter for auth endpoints
const authAttempts = new Map<string, { count: number; resetAt: number }>()
const AUTH_RATE_LIMIT = 10 // max attempts
const AUTH_RATE_WINDOW = 60 * 1000 // per minute

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const record = authAttempts.get(ip)

  if (!record || now > record.resetAt) {
    authAttempts.set(ip, { count: 1, resetAt: now + AUTH_RATE_WINDOW })
    return false
  }

  record.count++
  if (record.count > AUTH_RATE_LIMIT) {
    return true
  }
  return false
}

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = req.nextUrl
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'

  // Rate limit auth endpoints
  if (pathname.startsWith('/api/auth/callback/credentials')) {
    if (isRateLimited(ip)) {
      return new NextResponse('Too Many Requests', { status: 429, headers: { 'Retry-After': '60' } })
    }
  }

  // Public routes
  if (pathname.startsWith('/auth') || pathname.startsWith('/api/auth') || pathname === '/_next' || pathname.startsWith('/_next/')) {
    return NextResponse.next()
  }

  // Protect /admin/* — requires ADMIN role
  if (pathname.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }
    if (token.role !== 'admin') {
      return NextResponse.redirect(new URL('/projects', req.url))
    }
  }

  // Protect /projects/* — requires auth
  if (pathname.startsWith('/projects')) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }
  }

  // Protect /about — requires auth
  if (pathname.startsWith('/about')) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/projects/:path*', '/about', '/api/auth/callback/credentials'],
}