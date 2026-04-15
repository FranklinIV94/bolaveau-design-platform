import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const projectId = formData.get('projectId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (!projectId) {
      return NextResponse.json({ error: 'No projectId provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.name.match(/\.(glb|gltf)$/i)) {
      return NextResponse.json({ error: 'Only .glb and .gltf files are allowed' }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size must be under 50MB' }, { status: 400 })
    }

    // Generate unique storage path
    const timestamp = Date.now()
    const storagePath = `${projectId}/${timestamp}-${file.name}`

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabaseAdmin.storage
      .from('3d-models')
      .upload(storagePath, arrayBuffer, {
        contentType: file.name.endsWith('.glb') ? 'model/gltf-binary' : 'model/gltf+json',
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file: ' + uploadError.message }, { status: 500 })
    }

    // Create DB record
    const { data, error: dbError } = await supabaseAdmin
      .from('models')
      .insert({
        project_id: projectId,
        filename: file.name,
        storage_path: storagePath,
        file_size: file.size,
        uploaded_by: null, // Could add user id from session
      })
      .select()
      .single()

    if (dbError) {
      console.error('DB insert error:', dbError)
      return NextResponse.json({ error: 'Failed to save model record: ' + dbError.message }, { status: 500 })
    }

    return NextResponse.json({ model: data }, { status: 201 })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}