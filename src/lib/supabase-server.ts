import type { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function getUserFromSession(req: NextRequest) {
  const sessionToken = req.cookies.get('next-auth.session-token')?.value
  if (!sessionToken) return null

  // We'll validate via the auth route instead
  return null
}

export function createSupabaseServerClient() {
  return createClient(supabaseUrl, supabaseServiceKey)
}