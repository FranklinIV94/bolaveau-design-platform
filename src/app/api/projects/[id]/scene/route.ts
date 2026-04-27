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

  // Gracefully handle missing scene_data column
  if (error) {
    if (error.message?.includes('column') || error.code === '42703') {
      // Column doesn't exist yet — return null (client uses localStorage)
      return NextResponse.json({ scene: null, persisted: false })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ scene: data?.scene_data || null, persisted: true })
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
    // Gracefully handle missing scene_data column
    if (error.message?.includes('column') || error.code === '42703') {
      // Column doesn't exist yet — client should keep using localStorage
      return NextResponse.json({ success: false, persisted: false, error: 'Scene persistence not yet available on server' })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, persisted: true })
}