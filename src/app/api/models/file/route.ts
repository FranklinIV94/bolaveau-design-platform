import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAuth } from '@/lib/auth-guard'

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req)
  if (authResult instanceof NextResponse) return authResult

  const { searchParams } = new URL(req.url)
  const path = searchParams.get('path')

  if (!path) {
    return NextResponse.json({ error: 'No path provided' }, { status: 400 })
  }

  // Prevent path traversal
  if (!path.match(/^[a-zA-Z0-9/_.-]+$/)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin.storage
    .from('3d-models')
    .download(path)

  if (error || !data) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  const isGlb = path.toLowerCase().endsWith('.glb')
  const contentType = isGlb ? 'model/gltf-binary' : 'model/gltf+json'

  return new NextResponse(data, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600',
    },
  })
}