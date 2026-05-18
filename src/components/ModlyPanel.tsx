'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface GenerationJob {
  job_id: string
  source: 'local' | 'cloud'
  status: 'pending' | 'running' | 'done' | 'error' | 'cancelled'
  progress: number
  step?: string
  output_url?: string
  output?: string
  error?: string
}

interface ModlyPanelProps {
  projectId: string
  onModelGenerated?: (modelData: { name: string; dataUrl: string; format: string }) => void
  onClose?: () => void
}

export default function ModlyPanel({ projectId, onModelGenerated, onClose }: ModlyPanelProps) {
  const [dragOver, setDragOver] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [job, setJob] = useState<GenerationJob | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [modelName, setModelName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Cleanup polling on unmount
  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, WebP)')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('Image must be under 20MB')
      return
    }

    setError(null)
    setJob(null)
    setGenerating(true)

    // Read preview
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    // Set model name from filename
    setModelName(file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' '))

    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('model_id', 'sf3d')
      formData.append('collection', projectId)
      formData.append('remesh', 'quad')
      formData.append('enable_texture', 'true')

      const res = await fetch('/api/modly/generate', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (data.error) {
        setError(data.error)
        setGenerating(false)
        return
      }

      if (data.status === 'done') {
        // Immediate result (cloud inference)
        setJob(data)
        setGenerating(false)
      } else if (data.job_id) {
        // Start polling
        setJob(data)
        pollJob(data.job_id)
      } else {
        setError('Failed to start generation')
        setGenerating(false)
      }
    } catch (err) {
      setError('Network error. Is the Modly API running?')
      setGenerating(false)
    }
  }, [projectId])

  const pollJob = useCallback((jobId: string) => {
    if (pollRef.current) clearInterval(pollRef.current)

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/modly/generate?job_id=${jobId}`)
        const data = await res.json()

        setJob(data)

        if (data.status === 'done' || data.status === 'error' || data.status === 'cancelled') {
          if (pollRef.current) clearInterval(pollRef.current)
          setGenerating(false)
        }
      } catch {
        // Keep polling
      }
    }, 2000)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => setDragOver(false)

  const handleUseInScene = () => {
    if (job?.output && onModelGenerated) {
      const format = job.output.startsWith('data:model/gltf') ? 'glb' :
                     job.output.startsWith('data:model/obj') ? 'obj' : 'glb'
      onModelGenerated({
        name: modelName || 'Generated Model',
        dataUrl: job.output,
        format,
      })
    }
  }

  return (
    <div style={{
      position: 'absolute',
      top: 16,
      right: 16,
      width: 360,
      maxHeight: 'calc(100vh - 120px)',
      overflow: 'auto',
      background: 'rgba(26,26,26,0.96)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(201,168,76,0.2)',
      borderRadius: 12,
      padding: 20,
      zIndex: 50,
      color: '#e0e0e0',
      fontSize: 13,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🧊</span>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#fff' }}>Image to 3D</h3>
          <span style={{
            fontSize: 10,
            background: 'rgba(201,168,76,0.15)',
            color: '#c9a84c',
            padding: '2px 6px',
            borderRadius: 3,
            fontWeight: 600,
          }}>
            Modly
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: '#888',
              cursor: 'pointer', fontSize: 18, padding: '0 4px',
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Drop zone */}
      {!generating && !job?.output && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? '#c9a84c' : 'rgba(201,168,76,0.25)'}`,
            borderRadius: 10,
            padding: '32px 16px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragOver ? 'rgba(201,168,76,0.06)' : 'rgba(255,255,255,0.02)',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>📸</div>
          <p style={{ margin: '0 0 4px', color: '#c9a84c', fontWeight: 500 }}>
            Drop an image or click to upload
          </p>
          <p style={{ margin: 0, color: '#888', fontSize: 11 }}>
            PNG, JPG, WebP — max 20MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            style={{ display: 'none' }}
          />
        </div>
      )}

      {/* Preview + Progress */}
      {(generating || job) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Preview image */}
          {preview && (
            <div style={{
              borderRadius: 8,
              overflow: 'hidden',
              background: '#111',
              aspectRatio: '1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <img
                src={preview}
                alt="Source"
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            </div>
          )}

          {/* Progress bar */}
          {generating && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11 }}>
                <span style={{ color: '#888' }}>
                  {job?.step || 'Generating 3D model…'}
                </span>
                <span style={{ color: '#c9a84c', fontWeight: 600 }}>
                  {job?.progress || 0}%
                </span>
              </div>
              <div style={{
                height: 4,
                background: 'rgba(255,255,255,0.08)',
                borderRadius: 2,
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${job?.progress || 0}%`,
                  background: 'linear-gradient(90deg, #c9a84c, #e2c87c)',
                  borderRadius: 2,
                  transition: 'width 0.5s ease',
                }} />
              </div>
              <p style={{ margin: '8px 0 0', color: '#888', fontSize: 11, textAlign: 'center' }}>
                {job?.source === 'local'
                  ? 'Running on local GPU — this may take 1–5 minutes'
                  : 'Using cloud inference'}
              </p>
            </div>
          )}

          {/* Done state */}
          {job?.status === 'done' && job.output && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                background: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.2)',
                borderRadius: 8,
                padding: 12,
                marginBottom: 12,
              }}>
                <span style={{ color: '#22c55e', fontWeight: 600, fontSize: 13 }}>
                  ✅ 3D Model Generated
                </span>
                <p style={{ margin: '4px 0 0', color: '#888', fontSize: 11 }}>
                  via {job.source === 'local' ? 'Modly (local GPU)' : 'Cloud Inference'}
                </p>
              </div>

              <button
                onClick={handleUseInScene}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  background: 'linear-gradient(135deg, #c9a84c, #e2c87c)',
                  border: 'none',
                  borderRadius: 8,
                  color: '#1a1a1a',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                🎯 Place in Scene
              </button>

              <button
                onClick={() => {
                  // Download the model
                  if (job.output) {
                    const a = document.createElement('a')
                    a.href = job.output
                    a.download = `${modelName || 'model'}.glb`
                    a.click()
                  }
                }}
                style={{
                  width: '100%',
                  padding: '8px 16px',
                  marginTop: 8,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  color: '#ccc',
                  fontWeight: 500,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                💾 Download .glb
              </button>

              <button
                onClick={() => {
                  setJob(null)
                  setPreview(null)
                  setGenerating(false)
                  setError(null)
                }}
                style={{
                  width: '100%',
                  padding: '6px 16px',
                  marginTop: 6,
                  background: 'none',
                  border: 'none',
                  borderRadius: 8,
                  color: '#888',
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                Generate another
              </button>
            </div>
          )}

          {/* Error state */}
          {job?.status === 'error' && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 8,
              padding: 12,
              color: '#ef4444',
              fontSize: 12,
            }}>
              ❌ Generation failed
              {job.error && <div style={{ marginTop: 4, fontSize: 10, opacity: 0.7 }}>{job.error}</div>}
            </div>
          )}
        </div>
      )}

      {/* General error */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 8,
          padding: 12,
          color: '#ef4444',
          fontSize: 12,
          marginTop: 12,
        }}>
          ❌ {error}
        </div>
      )}

      {/* Setup info */}
      {!generating && !job?.output && (
        <div style={{
          marginTop: 16,
          padding: 12,
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 8,
          fontSize: 11,
          color: '#888',
          lineHeight: 1.6,
        }}>
          <p style={{ margin: 0, fontWeight: 600, color: '#aaa' }}>Powered by Modly</p>
          <p style={{ margin: '4px 0 0' }}>
            Converts any image into a textured 3D mesh using local AI on your GPU.
            For best results, use photos of objects on plain backgrounds.
          </p>
          <p style={{ margin: '8px 0 0', color: '#c9a84c' }}>
            💡 Run <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 4px', borderRadius: 2 }}>modly-api</code> locally for GPU-accelerated generation.
          </p>
        </div>
      )}
    </div>
  )
}
