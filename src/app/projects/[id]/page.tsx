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
    if (!session) {
      router.push('/auth/signin')
      return
    }
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
    if (!file.name.match(/\.(glb|gltf)$/i)) {
      alert('Only .glb and .gltf files are allowed')
      return
    }
    if (file.size > 50 * 1024 * 1024) {
      alert('File size must be under 50MB')
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('projectId', projectId)

    const res = await fetch('/api/models/upload', {
      method: 'POST',
      body: formData,
    })

    if (res.ok) {
      fetchData()
    } else {
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
        <p style={{ color: '#c9a84c' }}>Loading...</p>
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

  // Precompute model list items to avoid `>` operator in JSX attr expressions
  const modelItems = models.map((m) => {
    const isActive = m.id === activeModelId
    return {
      ...m,
      isActive,
      bgStyle: isActive ? 'rgba(201,168,76,0.08)' : '#1a1a1a',
      borderStyle: isActive ? 'rgba(201,168,76,0.4)' : 'rgba(201,168,76,0.1)',
      textColor: isActive ? '#c9a84c' : '#ccc',
      cursorStyle: hasManyModels ? 'pointer' : 'default',
      formattedSize: (m.file_size / 1024 / 1024).toFixed(1) + ' MB',
      displayName: m.filename.replace('.glb', '').replace(/_/g, ' '),
    }
  })

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Project Info Bar */}
        <div style={{
          background: '#1a1a1a',
          borderBottom: '1px solid rgba(201,168,76,0.2)',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}>
          <button onClick={() => router.push('/projects')} style={{ color: '#c9a84c', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>
            ← Back
          </button>
          <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 600, margin: 0 }}>{project.name}</h2>
          <span style={{
            background: sc.bg,
            color: sc.text,
            fontSize: 11,
            fontWeight: 600,
            padding: '3px 10px',
            borderRadius: 4,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}>
            {project.status}
          </span>
          {project.address && <span style={{ color: '#888', fontSize: 12 }}>{project.address}</span>}
          {hasManyModels && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#666', fontSize: 12 }}>Model:</span>
              <select
                value={activeModelId ?? ''}
                onChange={(e) => {
                  const m = models.find((x) => x.id === e.target.value)
                  setSelectedModel(m ?? null)
                }}
                style={{
                  background: '#2a2a2a',
                  color: '#c9a84c',
                  border: '1px solid rgba(201,168,76,0.3)',
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>{m.filename}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* 3D Viewer — expands to fill available space */}
        <div style={{ flex: 1, position: 'relative', minHeight: 480, display: 'flex', flexDirection: 'column' }}>
          {modelUrl ? (
            <div style={{ flex: 1, position: 'relative', minHeight: 480 }}>
              <ModelViewer key={activeModelId} modelUrl={modelUrl} />
              {hasManyModels && (
                <div style={{
                  position: 'absolute',
                  bottom: 16,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: 6,
                  zIndex: 20,
                }}>
                  {modelItems.map((mi) => (
                    <button
                      key={mi.id}
                      onClick={() => setSelectedModel(models.find((x) => x.id === mi.id) ?? null)}
                      style={{
                        background: mi.isActive ? '#c9a84c' : 'rgba(26,26,26,0.85)',
                        color: mi.isActive ? '#0a0a0a' : '#888',
                        border: '1px solid ' + (mi.isActive ? '#c9a84c' : 'rgba(201,168,76,0.25)'),
                        borderRadius: 6,
                        padding: '5px 14px',
                        fontSize: 12,
                        cursor: 'pointer',
                        fontWeight: 500,
                        transition: 'all 0.15s',
                        backdropFilter: 'blur(8px)',
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: 480,
              background: '#0a0a0a',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>📦</div>
                <p style={{ color: '#666', fontSize: 16, fontWeight: 500 }}>No 3D model uploaded</p>
                <p style={{ color: '#444', fontSize: 13, marginTop: 4 }}>
                  {isAdmin ? 'Upload a .glb or .gltf file below' : 'Waiting for admin to upload a model'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Upload Section (Admin only) */}
        {isAdmin && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              background: dragOver ? 'rgba(201,168,76,0.05)' : '#1a1a1a',
              border: dragOver ? '2px dashed #c9a84c' : '1px solid rgba(201,168,76,0.2)',
              borderRadius: 8,
              padding: 20,
              margin: 16,
              textAlign: 'center',
              transition: 'all 0.2s',
            }}
          >
            <p style={{ color: '#999', fontSize: 13, margin: '0 0 8px' }}>
              {uploading ? 'Uploading...' : 'Drag & drop a .glb/.gltf file here, or click to browse'}
            </p>
            <input
              type="file"
              accept=".glb,.gltf"
              onChange={handleFileInput}
              disabled={uploading}
              style={{ fontSize: 13 }}
            />
          </div>
        )}

        {/* Models List */}
        {models.length > 0 && (
          <div style={{ padding: '0 16px 16px' }}>
            <h3 style={{ color: '#999', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px' }}>
              Models ({models.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {modelItems.map((mi) => (
                <div
                  key={mi.id}
                  onClick={() => hasManyModels && setSelectedModel(models.find((x) => x.id === mi.id) ?? null)}
                  style={{
                    background: mi.bgStyle,
                    border: '1px solid ' + mi.borderStyle,
                    borderRadius: 6,
                    padding: '8px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: mi.cursorStyle,
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ color: mi.textColor, fontSize: 13 }}>{mi.filename}</span>
                  <span style={{ color: '#555', fontSize: 11 }}>
                    {mi.formattedSize} · {new Date(mi.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}