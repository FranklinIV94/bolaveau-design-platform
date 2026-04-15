import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// This endpoint creates the database tables.
// It's protected and should only be called once during initial setup.
export async function POST(req: Request) {
  const { searchParams } = new URL(req.url)
  const secret = searchParams.get('secret')

  if (secret !== process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: Record<string, string> = {}

  // Create projects table via raw SQL using pg client via RPC workaround
  // We'll use the supabase SQL endpoint approach - but since that doesn't work,
  // we'll try inserting a record and see what happens

  // First, check if projects table exists
  const { error: projectsCheckError } = await supabaseAdmin
    .from('projects')
    .select('id')
    .limit(1)

  if (projectsCheckError) {
    results.projectsTable = `Error: ${projectsCheckError.message} - Please run supabase-setup.sql in Supabase Dashboard SQL Editor`
  } else {
    results.projectsTable = 'already exists or accessible'
  }

  // Check models table
  const { error: modelsCheckError } = await supabaseAdmin
    .from('models')
    .select('id')
    .limit(1)

  if (modelsCheckError) {
    results.modelsTable = `Error: ${modelsCheckError.message} - Please run supabase-setup.sql in Supabase Dashboard SQL Editor`
  } else {
    results.modelsTable = 'already exists or accessible'
  }

  // Create default admin user if doesn't exist
  try {
    const { error: adminError } = await supabaseAdmin
      .from('admin_users')
      .insert({
        email: 'admin@bolaveau.com',
        password_hash: 'bolaveau2026',
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
    message: 'Send a POST request with ?secret=<NEXTAUTH_SECRET> to initialize the database',
    instructions: [
      '1. Go to Supabase Dashboard > SQL Editor',
      '2. Paste the contents of supabase-setup.sql',
      '3. Run the SQL',
      '4. Then POST to this endpoint with the secret'
    ]
  })
}