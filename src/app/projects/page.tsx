'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface Project {
  id: string
  name: string
  description: string
  address: string
  status: string
  created_at: string
}

const statusColors: Record<string, { bg: string; text: string }> = {
  planning: { bg: 'rgba(59,130,246,0.1)', text: '#3b82f6' },
  'in-progress': { bg: 'rgba(201,168,76,0.1)', text: '#c9a84c' },
  completed: { bg: 'rgba(34,197,94,0.1)', text: '#22c55e' },
}

const statusLabels: Record<string, string> = {
  planning: 'Planning',
  'in-progress': 'In Progress',
  completed: 'Completed',
}

export default function ProjectsList() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) { router.push('/auth/signin'); return }
    fetchProjects()
  }, [session, status, router])

  const fetchProjects = async () => {
    const res = await fetch('/api/projects')
    const data = await res.json()
    setProjects(data.projects || [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 36, height: 36, border: '3px solid rgba(201,168,76,0.2)', borderTopColor: '#c9a84c', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
          <p style={{ color: '#c9a84c', fontSize: 13, fontWeight: 500 }}>Loading projects…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ flex: 1, padding: '40px 32px 80px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>

        {/* Page header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 600, margin: '0 0 6px' }}>Projects</h1>
          <p style={{ color: '#555', fontSize: 13, margin: 0 }}>
            {projects.length > 0
              ? `${projects.length} project${projects.length !== 1 ? 's' : ''} in your studio`
              : 'Your design studio is ready'}
          </p>
        </div>

        {projects.length === 0 ? (
          /* Premium empty state */
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            minHeight: 320,
            textAlign: 'center',
            gap: 16,
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: 14,
              background: 'rgba(201,168,76,0.06)',
              border: '1px solid rgba(201,168,76,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect x="4" y="6" width="24" height="20" rx="2" stroke="#c9a84c" strokeWidth="1.5" fill="none"/>
                <path d="M4 12h24" stroke="#c9a84c" strokeWidth="1.5"/>
                <path d="M12 6v6M20 6v6" stroke="#c9a84c" strokeWidth="1.5"/>
              </svg>
            </div>
            <div>
              <p style={{ color: '#888', fontSize: 16, fontWeight: 500, margin: '0 0 6px' }}>Your design studio awaits</p>
              <p style={{ color: '#444', fontSize: 13, margin: 0 }}>Projects shared with you will appear here</p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {projects.map((p) => {
              const sc = statusColors[p.status] || statusColors.planning
              const isHovered = hoveredId === p.id
              return (
                <div
                  key={p.id}
                  onClick={() => router.push(`/projects/${p.id}`)}
                  onMouseEnter={() => setHoveredId(p.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    background: '#1a1a1a',
                    border: '1px solid ' + (isHovered ? 'rgba(201,168,76,0.5)' : 'rgba(201,168,76,0.12)'),
                    borderRadius: 10,
                    padding: 20,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
                    boxShadow: isHovered ? '0 8px 24px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.2)',
                  }}
                >
                  {/* Visual preview area */}
                  <div style={{
                    height: 80,
                    borderRadius: 6,
                    background: 'linear-gradient(135deg, rgba(201,168,76,0.06) 0%, rgba(201,168,76,0.02) 100%)',
                    border: '1px solid rgba(201,168,76,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                    overflow: 'hidden',
                    position: 'relative',
                  }}>
                    {/* Subtle geometric grid pattern */}
                    <div style={{
                      position: 'absolute', inset: 0, opacity: 0.4,
                      backgroundImage: 'linear-gradient(rgba(201,168,76,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.08) 1px, transparent 1px)',
                      backgroundSize: '16px 16px',
                    }} />
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ opacity: 0.3, position: 'relative' }}>
                      <path d="M16 2L28 9v14L16 30 4 23V9L16 2z" stroke="#c9a84c" strokeWidth="1.5" fill="none"/>
                      <path d="M16 2v20M4 9l12 5 12-5M16 22v8M4 23l12 5 12-5" stroke="#c9a84c" strokeWidth="1.5"/>
                    </svg>
                  </div>

                  {/* Card content */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <h3 style={{ color: '#fff', fontSize: 15, fontWeight: 600, margin: 0, lineHeight: 1.3, flex: 1, paddingRight: 8 }}>
                      {p.name}
                    </h3>
                    <span style={{
                      background: sc.bg, color: sc.text,
                      fontSize: 10, fontWeight: 700,
                      padding: '3px 8px', borderRadius: 4,
                      textTransform: 'uppercase', letterSpacing: 0.8,
                      flexShrink: 0, marginTop: 2,
                    }}>
                      {statusLabels[p.status] || p.status}
                    </span>
                  </div>

                  {p.address && (
                    <p style={{ color: '#666', fontSize: 12, margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0, opacity: 0.6 }}>
                        <path d="M5 1C3.3 1 2 2.3 2 4c0 2.5 3 5 3 5s3-2.5 3-5c0-1.7-1.3-3-3-3z" stroke="#888" strokeWidth="1"/>
                        <circle cx="5" cy="4" r="1" fill="#888"/>
                      </svg>
                      {p.address}
                    </p>
                  )}
                  {p.description && (
                    <p style={{
                      color: '#555', fontSize: 12, margin: 0,
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {p.description}
                    </p>
                  )}

                  {/* Arrow indicator */}
                  <div style={{
                    display: 'flex', justifyContent: 'flex-end', marginTop: 12,
                    opacity: isHovered ? 1 : 0,
                    transform: isHovered ? 'translateX(0)' : 'translateX(-4px)',
                    transition: 'all 0.2s ease',
                  }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}