'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Header from '@/components/Header'

const BolaveauEditor = dynamic(() => import('@/components/BolaveauEditor'), { ssr: false })
const WebGPUCheck = dynamic(() => import('@/components/WebGPUCheck').then(m => ({ default: m.WebGPUCheck })), { ssr: false })
const UndoRedoButtons = dynamic(() => import('@/components/UndoRedoButtons'), { ssr: false })

interface Project {
  id: string
  name: string
  description: string
  address: string
  status: string
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
  const [models, setModels] = useState<{ id: string; filename: string; storage_path: string; file_size: number; created_at: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
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

  if (loading) {
    return (
      <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 48, height: 48, border: '3px solid rgba(201,168,76,0.2)', borderTopColor: '#c9a84c', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!project) {
    return (
      <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#bbb' }}>Project not found</p>
      </div>
    )
  }

  const statusColors: Record<string, { bg: string; text: string }> = {
    planning: { bg: 'rgba(59,130,246,0.1)', text: '#3b82f6' },
    'in-progress': { bg: 'rgba(201,168,76,0.1)', text: '#c9a84c' },
    completed: { bg: 'rgba(34,197,94,0.1)', text: '#22c55e' },
  }
  const sc = statusColors[project.status] || statusColors.planning

  return (
    <div style={{ background: '#0a0a0a', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Header />

      {/* Project info bar */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'rgba(26,26,26,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(201,168,76,0.15)',
        padding: '8px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
        minHeight: 44,
        flexShrink: 0,
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
          <span style={{ color: '#bbb', fontSize: 12, flexShrink: 0 }}>{project.address}</span>
        )}

        {project.description && (
          <span style={{ color: '#888', fontSize: 11, flexShrink: 0, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.description}</span>
        )}

        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href)
            setCopiedLink(true)
            setTimeout(() => setCopiedLink(false), 2000)
          }}
          title="Copy project link"
          style={{
            marginLeft: 'auto',
            background: 'rgba(201,168,76,0.06)',
            border: '1px solid rgba(201,168,76,0.15)',
            borderRadius: 5,
            padding: '4px 10px',
            color: copiedLink ? '#22c55e' : '#c9a84c',
            fontSize: 11,
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            flexShrink: 0,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            {copiedLink ? (
              <path d="M2 6l3 3 5-6" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            ) : (
              <path d="M4 1H2a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V9M7 1h4v4M11 1L5 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            )}
          </svg>
          {copiedLink ? 'Copied!' : 'Share'}
        </button>

        {isAdmin && (
          <label style={{
            background: 'rgba(201,168,76,0.1)',
            border: '1px solid rgba(201,168,76,0.25)',
            borderRadius: 6,
            padding: '4px 12px',
            color: '#c9a84c',
            fontSize: 12,
            fontWeight: 600,
            cursor: uploading ? 'wait' : 'pointer',
            flexShrink: 0,
          }}>
            {uploading ? 'Uploading…' : '+ Upload Model'}
            <input
              type="file"
              accept=".glb,.gltf"
              onChange={handleFileInput}
              disabled={uploading}
              style={{ display: 'none' }}
            />
          </label>
        )}
      </div>

      {/* Full editor */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <UndoRedoButtons />
        <WebGPUCheck>
          <BolaveauEditor projectId={projectId} />
        </WebGPUCheck>
      </div>
    </div>
  )
}