import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Shared auth guard for API routes.
 * Returns the token if valid, otherwise returns a 401 redirect response.
 * Call this at the top of every API route handler.
 */
export async function requireAuth(req: NextRequest): Promise<ReturnType<typeof getToken extends (args: any) => infer R ? Promise<R> : never> | NextResponse> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return token
}

/**
 * Admin-only auth guard.
 * Returns 403 if the user is authenticated but not an admin.
 */
export async function requireAdmin(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (token.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return token
}