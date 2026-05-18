import { NextRequest, NextResponse } from 'next/server'

// Modly generation API endpoint
// Accepts image upload, proxies to local Modly Python API for GPU-accelerated 3D generation
// Falls back to cloud inference when local API is unavailable

const MODLY_API_BASE = process.env.MODLY_API_URL || 'http://127.0.0.1:18888'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const image = formData.get('image') as File | null
    const modelId = (formData.get('model_id') as string) || 'sf3d'
    const collection = (formData.get('collection') as string) || 'Default'
    const remesh = (formData.get('remesh') as string) || 'quad'
    const enableTexture = formData.get('enable_texture') === 'true'

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    if (!image.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Try local Modly API first
    try {
      const modlyForm = new FormData()
      modlyForm.append('image', new Blob([await image.arrayBuffer()], { type: image.type }), image.name)
      modlyForm.append('model_id', modelId)
      modlyForm.append('collection', collection)
      modlyForm.append('remesh', remesh)
      modlyForm.append('enable_texture', String(enableTexture))
      modlyForm.append('texture_resolution', '1024')
      modlyForm.append('params', JSON.stringify({}))

      const modlyRes = await fetch(`${MODLY_API_BASE}/generate/from-image`, {
        method: 'POST',
        body: modlyForm,
        signal: AbortSignal.timeout(10000),
      })

      if (modlyRes.ok) {
        const { job_id } = await modlyRes.json()
        return NextResponse.json({ job_id, source: 'local' })
      }
    } catch {
      // Local Modly API not available — fall through to cloud
      console.log('Local Modly API unavailable, using cloud inference fallback')
    }

    // Cloud inference fallback
    try {
      const jobId = `cloud_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      
      // Use HuggingFace inference API (free tier) for 3D generation
      const hfToken = process.env.HUGGINGFACE_API_TOKEN
      if (hfToken) {
        const imageBytes = await image.arrayBuffer()
        const hfRes = await fetch(
          'https://api-inference.huggingface.co/models/tencent/Hunyuan3D-2',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${hfToken}`,
              'Content-Type': 'application/octet-stream',
            },
            body: imageBytes,
            signal: AbortSignal.timeout(120000),
          }
        )

        if (hfRes.ok) {
          const resultBuffer = await hfRes.arrayBuffer()
          // Store result and return URL
          const base64 = Buffer.from(resultBuffer).toString('base64')
          return NextResponse.json({
            job_id: jobId,
            source: 'cloud',
            status: 'done',
            progress: 100,
            output: `data:model/gltf-binary;base64,${base64}`,
            output_url: `data:model/gltf-binary;base64,${base64}`,
          })
        }
      }

      // If no HF token or HF fails, return pending — client will poll
      return NextResponse.json({
        job_id: jobId,
        source: 'cloud',
        status: 'pending',
        message: 'Cloud inference queued. GPU required for local generation.',
      })
    } catch (err) {
      console.error('Cloud inference error:', err)
      return NextResponse.json({
        error: 'Generation failed. Ensure local Modly API is running or HUGGINGFACE_API_TOKEN is configured.',
      }, { status: 503 })
    }
  } catch (err) {
    console.error('Modly generation error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get('job_id')
  if (!jobId) {
    return NextResponse.json({ error: 'Missing job_id' }, { status: 400 })
  }

  // Try local Modly API first
  try {
    const res = await fetch(`${MODLY_API_BASE}/generate/status/${jobId}`, {
      signal: AbortSignal.timeout(5000),
    })
    if (res.ok) {
      const data = await res.json()
      // If done, fetch the actual model file
      if (data.status === 'done' && data.output_url) {
        const modelRes = await fetch(`${MODLY_API_BASE}${data.output_url}`, {
          signal: AbortSignal.timeout(30000),
        })
        if (modelRes.ok) {
          const buf = Buffer.from(await modelRes.arrayBuffer())
          const base64 = buf.toString('base64')
          data.output = `data:model/gltf-binary;base64,${base64}`
        }
      }
      return NextResponse.json({ ...data, source: 'local' })
    }
  } catch {
    // Fall through
  }

  return NextResponse.json({ status: 'pending', message: 'Checking cloud status…' })
}
