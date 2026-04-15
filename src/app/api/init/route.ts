import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAuth } from '@/lib/auth-guard'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  // Require auth session (admin)
  const mockReq = req as any
  const authResult = await requireAuth(mockReq)
  if (authResult instanceof NextResponse) return authResult

  const results: Record<string, string> = {}

  // Check projects table
  const { error: projectsCheckError } = await supabaseAdmin
    .from('projects')
    .select('id')
    .limit(1)
  results.projectsTable = projectsCheckError
    ? `Error: ${projectsCheckError.message} — run supabase-setup.sql first`
    : 'accessible'

  // Check models table
  const { error: modelsCheckError } = await supabaseAdmin
    .from('models')
    .select('id')
    .limit(1)
  results.modelsTable = modelsCheckError
    ? `Error: ${modelsCheckError.message} — run supabase-setup.sql first`
    : 'accessible'

  // Create default admin user if not exists
  try {
    const passwordHash = await bcrypt.hash('bolaveau2026', 12)
    const { error: adminError } = await supabaseAdmin
      .from('users')
      .insert({
        email: 'admin@bolaveau.com',
        password_hash: passwordHash,
        name: 'Bolaveau Admin',
        role: 'ADMIN',
        is_active: true,
      })
    results.adminUser = adminError ? adminError.message : 'created or already exists'
  } catch (e: any) {
    results.adminUser = `Error: ${e.message}`
  }

  // Create sample project if table exists
  try {
    const { error: projectError } = await supabaseAdmin
      .from('projects')
      .insert({
        name: 'Sunset Villa Renovation',
        description: 'Complete interior redesign of a 4-bedroom villa with modern finishes and smart home integration.',
        address: '1234 Ocean Drive, Miami Beach, FL 33139',
        status: 'in-progress',
      })
    results.sampleProject = projectError ? projectError.message : 'created'
  } catch (e: any) {
    results.sampleProject = `Error: ${e.message}`
  }

  return NextResponse.json(results)
}

export async function GET() {
  return NextResponse.json({
    message: 'Send a POST request to initialize. Requires admin session.',
    instructions: [
      '1. Go to Supabase Dashboard > SQL Editor',
      '2. Paste supabase-setup.sql and run',
      '3. Sign in as admin@bolaveau.com',
      '4. POST to this endpoint',
    ],
  })
}