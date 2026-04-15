'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const ModelViewer = dynamic(() => import('@/components/ModelViewer'), { ssr: false })

interface Project {
  id: string
  name: string
  description: string
  address: string
  status: string
}

interface Model {
  id: string
  filename: string
  storage_path: string
  file_size: number
  created_at: string
}

function formatModelName(filename: string): string {
  return filename.replace(/\.(glb|gltf)$/i, '').replace(/_/g, ' ')
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function ProjectDetail() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [selectedModel, setSelectedModel] = useState<Model | null>(null)
  const isAdmin = (session?.user as any)?.role?.toLowerCase() === 'admin'

  useEffect(() => {
    if (status === 'loading') return
    if (!session) { router.push('/auth/signin'); return }
    fetchData()
  }, [session, status, router, projectId])

  const fetchData = async () => {
    const [projRes, modelsRes] = await Promise.all([
      fetch(`/api/projects/${projectId}`),
      fetch(`/api/models?projectId=${projectId}`),
    ])
    const projData = await projRes.json()
    const modelsData = await modelsRes.json()
    setProject(projData.project || null)
    setModels(modelsData.models || [])
    setLoading(false)
    if (modelsData.models?.length > 0 && !selectedModel) {
      setSelectedModel(modelsData.models[modelsData.models.length - 1])
    }
  }

  const handleUpload = async (file: File) => {
    if (!file.name.match(/\.(glb|gltf)$/i)) { alert('Only .glb and .gltf files are allowed'); return }
    if (file.size > 50 * 1024 * 1024) { alert('File size must be under 50MB'); return }
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('projectId', projectId)
    const res = await fetch('/api/models/upload', { method: 'POST', body: formData })
    if (res.ok) { fetchData() } else {
      const data = await res.json()
      alert(data.error || 'Upload failed')
    }
    setUploading(false)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }, [projectId])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
  }

  const latestModel = models.length > 0 ? models[models.length - 1] : null
  const activeModel = selectedModel || latestModel
  const modelUrl = activeModel ? `/api/models/file?path=${encodeURIComponent(activeModel.storage_path)}` : null
  const hasManyModels = models.length > 1
  const activeModelId = activeModel?.id ?? null

  if (loading) {
    return (
      <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid rgba(201,168,76,0.2)', borderTopColor: '#c9a84c', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: '#c9a84c', fontSize: 14, fontWeight: 500 }}>Loading project…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#666' }}>Project not found</p>
      </div>
    )
  }

  const statusColors: Record<string, { bg: string; text: string }> = {
    planning: { bg: 'rgba(59,130,246,0.1)', text: '#3b82f6' },
    'in-progress': { bg: 'rgba(201,168,76,0.1)', text: '#c9a84c' },
    completed: { bg: 'rgba(34,197,94,0.1)', text: '#22c55e' },
  }
  const sc = statusColors[project.status] || statusColors.planning

  // Precompute for JSX (avoid `>` in style expressions)
  const modelItems = models.map((m) => {
    const isActive = m.id === activeModelId
    return {
      ...m,
      isActive,
      displayName: formatModelName(m.filename),
      bgStyle: isActive ? 'rgba(201,168,76,0.08)' : '#1a1a1a',
      borderStyle: isActive ? 'rgba(201,168,76,0.5)' : 'rgba(201,168,76,0.1)',
      textColor: isActive ? '#c9a84c' : '#ccc',
      cursorStyle: hasManyModels ? 'pointer' : 'default',
      timeAgo: relativeTime(m.created_at),
    }
  })

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      {/* Project info bar — compact, single row */}
      <div style={{
        background: '#1a1a1a',
        borderBottom: '1px solid rgba(201,168,76,0.15)',
        padding: '10px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
        minHeight: 52,
      }}>
        <button
          onClick={() => router.push('/projects')}
          style={{
            color: '#c9a84c',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 500,
            padding: '4px 0',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            transition: 'opacity 0.15s',
            flexShrink: 0,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
            <path d="M7.5 2L3.5 6L7.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Projects
        </button>

        <div style={{ width: 1, height: 16, background: 'rgba(201,168,76,0.2)', flexShrink: 0 }} />

        <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 600, margin: 0, flexShrink: 0 }}>{project.name}</h2>

        <span style={{
          background: sc.bg, color: sc.text,
          fontSize: 10, fontWeight: 700,
          padding: '3px 9px', borderRadius: 4,
          textTransform: 'uppercase', letterSpacing: 0.8,
          flexShrink: 0,
        }}>
          {project.status}
        </span>

        {project.address && (
          <span style={{ color: '#666', fontSize: 12, flexShrink: 0 }}>{project.address}</span>
        )}

        {hasManyModels && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ color: '#555', fontSize: 11 }}>Model</span>
            <select
              value={activeModelId ?? ''}
              onChange={(e) => {
                const m = models.find((x) => x.id === e.target.value)
                setSelectedModel(m ?? null)
              }}
              style={{
                background: '#252525',
                color: '#c9a84c',
                border: '1px solid rgba(201,168,76,0.25)',
                borderRadius: 6,
                padding: '4px 10px',
                fontSize: 12,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>{formatModelName(m.filename)}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 3D Viewer — expands to fill available space */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {modelUrl ? (
          <div style={{ flex: 1, position: 'relative', minHeight: 480 }}>
            <ModelViewer key={activeModelId} modelUrl={modelUrl} />
            {hasManyModels && (
              <div style={{
                position: 'absolute',
                bottom: 62,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: 6,
                zIndex: 20,
                background: 'rgba(10,10,10,0.75)',
                border: '1px solid rgba(201,168,76,0.2)',
                borderRadius: 8,
                padding: '5px 8px',
                backdropFilter: 'blur(10px)',
              }}>
                {modelItems.map((mi) => (
                  <button
                    key={mi.id}
                    onClick={() => setSelectedModel(models.find((x) => x.id === mi.id) ?? null)}
                    style={{
                      background: mi.isActive ? '#c9a84c' : 'transparent',
                      color: mi.isActive ? '#0a0a0a' : '#888',
                      border: '1px solid ' + (mi.isActive ? '#c9a84c' : 'rgba(201,168,76,0.2)'),
                      borderRadius: 5,
                      padding: '5px 14px',
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {mi.displayName}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            height: '100%', minHeight: 480,
            background: '#0a0a0a',
            gap: 12,
          }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ opacity: 0.2 }}>
              <rect x="6" y="10" width="36" height="28" rx="2" stroke="#c9a84c" strokeWidth="2"/>
              <path d="M6 18h36" stroke="#c9a84c" strokeWidth="2"/>
              <path d="M18 10v8M30 10v8" stroke="#c9a84c" strokeWidth="2"/>
            </svg>
            <p style={{ color: '#555', fontSize: 15, fontWeight: 500, margin: 0 }}>No models in this project</p>
            {isAdmin && <p style={{ color: '#444', fontSize: 13, margin: 0 }}>Upload a .glb file to get started</p>}
          </div>
        )}
      </div>

      {/* Upload zone — admin only */}
      {isAdmin && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            background: dragOver ? 'rgba(201,168,76,0.04)' : 'transparent',
            border: dragOver ? '2px dashed rgba(201,168,76,0.5)' : '2px dashed transparent',
            borderRadius: 8,
            padding: '12px 24px',
            margin: '0 24px 16px',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div style={{
            flex: 1,
            background: '#1a1a1a',
            border: '1px dashed rgba(201,168,76,0.2)',
            borderRadius: 8,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            transition: 'all 0.2s',
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, opacity: 0.6 }}>
              <path d="M9 3v9M5 8l4-4 4 4M3 15h12" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#888', fontSize: 13, margin: 0 }}>
                {uploading ? 'Uploading model…' : 'Drop a .glb or .gltf file to upload'}
              </p>
              <p style={{ color: '#444', fontSize: 11, margin: '2px 0 0' }}>3D model files only · Max 50MB</p>
            </div>
            <label style={{
              background: 'rgba(201,168,76,0.1)',
              border: '1px solid rgba(201,168,76,0.25)',
              borderRadius: 6,
              padding: '6px 14px',
              color: '#c9a84c',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
              flexShrink: 0,
            }}>
              Browse Files
              <input
                type="file"
                accept=".glb,.gltf"
                onChange={handleFileInput}
                disabled={uploading}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>
      )}

      {/* Models list */}
      {models.length > 0 && (
        <div style={{ padding: '0 24px 20px' }}>
          <div style={{
            background: '#1a1a1a',
            border: '1px solid rgba(201,168,76,0.1)',
            borderRadius: 8,
            overflow: 'hidden',
          }}>
            {modelItems.map((mi, idx) => (
              <div
                key={mi.id}
                onClick={() => hasManyModels && setSelectedModel(models.find((x) => x.id === mi.id) ?? null)}
                style={{
                  background: mi.bgStyle,
                  borderBottom: idx < models.length - 1 ? '1px solid rgba(201,168,76,0.06)' : 'none',
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  cursor: mi.cursorStyle,
                  transition: 'all 0.15s',
                }}
              >
                {/* Model icon */}
                <div style={{
                  width: 32, height: 32, borderRadius: 6,
                  background: mi.isActive ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.04)',
                  border: '1px solid ' + (mi.isActive ? 'rgba(201,168,76,0.35)' : 'rgba(201,168,76,0.1)'),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1L14 5v6L8 15 2 11V5L8 1z" stroke={mi.isActive ? '#c9a84c' : '#555'} strokeWidth="1.2" fill="none"/>
                    <path d="M8 1v10M2 5l6 2 6-2M8 11v4M2 11l6 2 6-2" stroke={mi.isActive ? '#c9a84c' : '#555'} strokeWidth="1.2"/>
                  </svg>
                </div>

                {/* Name + meta */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    color: mi.textColor,
                    fontSize: 13, fontWeight: 500,
                    margin: 0,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {mi.displayName}
                  </p>
                  <p style={{ color: '#444', fontSize: 11, margin: '1px 0 0' }}>
                    {(mi.file_size / 1024 / 1024).toFixed(1)} MB · Uploaded {mi.timeAgo}
                  </p>
                </div>

                {/* Active indicator */}
                {mi.isActive && (
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: '#c9a84c',
                    flexShrink: 0,
                    boxShadow: '0 0 6px rgba(201,168,76,0.6)',
                  }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}