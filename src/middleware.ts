import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = req.nextUrl

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

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/projects/:path*'],
}