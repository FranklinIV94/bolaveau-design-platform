import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const path = searchParams.get('path')

  if (!path) {
    return NextResponse.json({ error: 'No path provided' }, { status: 400 })
  }

  // Download file from Supabase Storage
  const { data, error } = await supabaseAdmin.storage
    .from('3d-models')
    .download(path)

  if (error || !data) {
    console.error('Storage download error:', error)
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  // Determine content type based on extension
  const isGlb = path.toLowerCase().endsWith('.glb')
  const contentType = isGlb ? 'model/gltf-binary' : 'model/gltf+json'

  return new NextResponse(data, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600',
    },
  })
}