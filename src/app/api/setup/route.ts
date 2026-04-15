import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const results: Record<string, any> = {}

  // Try to create projects table by inserting (will fail if table doesn't exist)
  // We'll check if the table exists by querying it
  const { data: projectsData, error: projectsError } = await supabaseAdmin
    .from('projects')
    .select('id')
    .limit(1)

  results.projectsTable = projectsError ? projectsError.message : 'exists'

  // Check if models table exists
  const { data: modelsData, error: modelsError } = await supabaseAdmin
    .from('models')
    .select('id')
    .limit(1)

  results.modelsTable = modelsError ? modelsError.message : 'exists'

  // Check admin_users table
  const { data: adminsData, error: adminsError } = await supabaseAdmin
    .from('admin_users')
    .select('id, email, name, role')
    .limit(5)

  results.adminUsersTable = adminsError ? adminsError.message : 'exists'
  results.adminUsers = adminsData

  // Try to create storage bucket
  const { data: bucketData, error: bucketError } = await supabaseAdmin.storage
    .createBucket('3d-models', { public: true })

  if (bucketError) {
    results.storageBucket = bucketError.message
  } else {
    results.storageBucket = 'created'
  }

  return NextResponse.json(results)
}