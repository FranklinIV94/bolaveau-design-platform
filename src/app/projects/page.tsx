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

export default function ProjectsList() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
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
        <p style={{ color: '#c9a84c' }}>Loading...</p>
      </div>
    )
  }

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ flex: 1, padding: 32, maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 600, marginBottom: 24 }}>Projects</h1>

        {projects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <p style={{ color: '#666', fontSize: 16 }}>No projects available yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {projects.map((p) => {
              const sc = statusColors[p.status] || statusColors.planning
              return (
                <div
                  key={p.id}
                  onClick={() => router.push(`/projects/${p.id}`)}
                  style={{
                    background: '#1a1a1a',
                    border: '1px solid rgba(201,168,76,0.15)',
                    borderRadius: 8,
                    padding: 20,
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 600, margin: 0 }}>{p.name}</h3>
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
                      {p.status}
                    </span>
                  </div>
                  {p.address && <p style={{ color: '#888', fontSize: 12, margin: '0 0 8px' }}>{p.address}</p>}
                  {p.description && <p style={{ color: '#666', fontSize: 13, margin: 0, lineHeight: 1.5 }}>{p.description}</p>}
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