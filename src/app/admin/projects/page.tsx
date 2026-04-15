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
  client_id: string | null
  created_at: string
  updated_at: string
}

const statusColors: Record<string, { bg: string; text: string }> = {
  planning: { bg: 'rgba(59,130,246,0.1)', text: '#3b82f6' },
  'in-progress': { bg: 'rgba(201,168,76,0.1)', text: '#c9a84c' },
  completed: { bg: 'rgba(34,197,94,0.1)', text: '#22c55e' },
}

export default function AdminProjects() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [form, setForm] = useState({ name: '', description: '', address: '', status: 'planning' })

  useEffect(() => {
    if (status === 'loading') return
    if (!session || (session.user as any)?.role !== 'admin') {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      await fetch(`/api/projects/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    } else {
      await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    }
    setShowForm(false)
    setEditing(null)
    setForm({ name: '', description: '', address: '', status: 'planning' })
    fetchProjects()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project?')) return
    await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    fetchProjects()
  }

  const startEdit = (p: Project) => {
    setEditing(p)
    setForm({ name: p.name, description: p.description, address: p.address, status: p.status })
    setShowForm(true)
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 600, margin: 0 }}>Projects</h1>
          <button
            onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ name: '', description: '', address: '', status: 'planning' }) }}
            style={{
              background: '#c9a84c',
              color: '#1a1a1a',
              fontWeight: 600,
              fontSize: 13,
              border: 'none',
              borderRadius: 6,
              padding: '8px 20px',
              cursor: 'pointer',
            }}
          >
            + New Project
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} style={{
            background: '#1a1a1a',
            border: '1px solid rgba(201,168,76,0.2)',
            borderRadius: 8,
            padding: 24,
            marginBottom: 24,
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ color: '#999', fontSize: 12, display: 'block', marginBottom: 6 }}>Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px 14px', background: '#0a0a0a', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 6, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ color: '#999', fontSize: 12, display: 'block', marginBottom: 6 }}>Address</label>
                <input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', background: '#0a0a0a', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 6, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ color: '#999', fontSize: 12, display: 'block', marginBottom: 6 }}>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  style={{ width: '100%', padding: '10px 14px', background: '#0a0a0a', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 6, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>
              <div>
                <label style={{ color: '#999', fontSize: 12, display: 'block', marginBottom: 6 }}>Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', background: '#0a0a0a', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 6, color: '#fff', fontSize: 14, outline: 'none' }}
                >
                  <option value="planning">Planning</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button type="submit" style={{ background: '#c9a84c', color: '#1a1a1a', fontWeight: 600, fontSize: 13, border: 'none', borderRadius: 6, padding: '8px 24px', cursor: 'pointer' }}>
                {editing ? 'Update' : 'Create'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} style={{ background: 'transparent', color: '#999', border: '1px solid #333', borderRadius: 6, padding: '8px 24px', cursor: 'pointer', fontSize: 13 }}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {projects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <p style={{ color: '#666', fontSize: 16 }}>No projects yet. Create your first project above.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {projects.map((p) => {
              const sc = statusColors[p.status] || statusColors.planning
              return (
                <div key={p.id} style={{
                  background: '#1a1a1a',
                  border: '1px solid rgba(201,168,76,0.15)',
                  borderRadius: 8,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                }}>
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
                  {p.description && <p style={{ color: '#666', fontSize: 13, margin: '0 0 16px', lineHeight: 1.5 }}>{p.description}</p>}
                  <div style={{ marginTop: 'auto', display: 'flex', gap: 8 }}>
                    <button onClick={() => router.push(`/projects/${p.id}`)} style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 5, padding: '6px 14px', color: '#c9a84c', fontSize: 12, cursor: 'pointer' }}>
                      View
                    </button>
                    <button onClick={() => startEdit(p)} style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 5, padding: '6px 14px', color: '#3b82f6', fontSize: 12, cursor: 'pointer' }}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(p.id)} style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 5, padding: '6px 14px', color: '#ef4444', fontSize: 12, cursor: 'pointer' }}>
                      Delete
                    </button>
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