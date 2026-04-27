import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAuth } from '@/lib/auth-guard'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(req)
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params

  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('scene_data')
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ scene: data?.scene_data || null })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(req)
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params
  const { scene } = await req.json()

  if (!scene || typeof scene !== 'object') {
    return NextResponse.json({ error: 'Scene data required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('projects')
    .update({ scene_data: scene, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}