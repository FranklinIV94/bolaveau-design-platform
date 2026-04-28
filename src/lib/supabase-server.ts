import type { NextRequest } from 'next/server'
import { createClient as _createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabaseUrl: string | undefined
let _supabaseServiceKey: string | undefined

function getSupabaseUrl() {
  if (!_supabaseUrl) _supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  return _supabaseUrl!
}

function getSupabaseServiceKey() {
  if (!_supabaseServiceKey) _supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  return _supabaseServiceKey!
}

export async function getUserFromSession(req: NextRequest) {
  const sessionToken = req.cookies.get('next-auth.session-token')?.value
  if (!sessionToken) return null
  return null
}

export function createSupabaseServerClient(): SupabaseClient {
  return _createClient(getSupabaseUrl(), getSupabaseServiceKey())
}

// Alias used by AR/AP API routes
export const createClient = createSupabaseServerClient