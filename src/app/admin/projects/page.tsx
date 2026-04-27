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

interface Toast {
  id: string
  message: string
  type: 'success' | 'error'
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

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24,
      zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            background: '#1e1e1e',
            border: '1px solid ' + (t.type === 'success' ? 'rgba(201,168,76,0.4)' : 'rgba(220,38,38,0.4)'),
            borderLeft: '3px solid ' + (t.type === 'success' ? '#c9a84c' : '#ef4444'),
            borderRadius: 8,
            padding: '12px 16px',
            color: t.type === 'success' ? '#c9a84c' : '#ef4444',
            fontSize: 13,
            fontWeight: 500,
            minWidth: 240,
            maxWidth: 320,
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            animation: 'slideIn 0.2s ease',
          }}
        >
          {t.message}
        </div>
      ))}
      <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </div>
  )
}

function DeleteModal({ projectName, onConfirm, onCancel }: { projectName: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: '#1a1a1a',
        border: '1px solid rgba(201,168,76,0.2)',
        borderRadius: 12,
        padding: 28,
        width: '100%',
        maxWidth: 380,
        boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: 'rgba(220,38,38,0.1)',
          border: '1px solid rgba(220,38,38,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 5h14M7 5V3h4v2M3 5l1 10h10l1-10" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 600, margin: '0 0 8px' }}>Delete project</h3>
        <p style={{ color: '#ccc', fontSize: 13, margin: '0 0 20px', lineHeight: 1.5 }}>
          Are you sure you want to delete <strong style={{ color: '#ccc' }}>{projectName}</strong>? This will permanently remove all models and files associated with this project. This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '9px 16px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6, color: '#999',
              fontSize: 13, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: '9px 16px',
              background: '#ef4444',
              border: '1px solid #ef4444',
              borderRadius: 6, color: '#fff',
              fontSize: 13, fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminProjects() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [form, setForm] = useState({ name: '', description: '', address: '', status: 'planning' })
  const [toasts, setToasts] = useState<Toast[]>([])
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [expandedDesc, setExpandedDesc] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now().toString()
    setToasts((t) => [...t, { id, message, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500)
  }

  useEffect(() => {
    if (status === 'loading') return
    if (!session || (session?.user as any)?.role?.toLowerCase() !== 'admin') {
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
    setSubmitting(true)
    try {
      if (editing) {
        const res = await fetch(`/api/projects/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (res.ok) {
          addToast(`"${form.name}" updated`)
          setShowForm(false)
          setEditing(null)
          setForm({ name: '', description: '', address: '', status: 'planning' })
          fetchProjects()
        } else {
          addToast('Failed to update project', 'error')
        }
      } else {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (res.ok) {
          addToast(`"${form.name}" created`)
          setShowForm(false)
          setEditing(null)
          setForm({ name: '', description: '', address: '', status: 'planning' })
          fetchProjects()
        } else {
          addToast('Failed to create project', 'error')
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const res = await fetch(`/api/projects/${deleteTarget.id}`, { method: 'DELETE' })
    if (res.ok) {
      addToast(`"${deleteTarget.name}" deleted`)
    } else {
      addToast('Failed to delete project', 'error')
    }
    setDeleteTarget(null)
    fetchProjects()
  }

  const startEdit = (p: Project) => {
    setEditing(p)
    setForm({ name: p.name, description: p.description, address: p.address, status: p.status })
    setShowForm(true)
  }

  // Filter projects by status
  const filteredProjects = filterStatus === 'all'
    ? projects
    : projects.filter((p) => p.status === filterStatus)

  // Count by status for filter pills
  const countByStatus = (s: string) => projects.filter((p) => p.status === s).length

  if (loading) {
    return (
      <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 36, height: 36, border: '3px solid rgba(201,168,76,0.2)', borderTopColor: '#c9a84c', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
          <p style={{ color: '#c9a84c', fontSize: 13, fontWeight: 500 }}>Loading…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    background: '#111', border: '1px solid rgba(201,168,76,0.2)',
    borderRadius: 6, color: '#fff', fontSize: 14,
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  }

  // Precompute filter pill data (avoid > in JSX)
  const filterPills = ['all', 'planning', 'in-progress', 'completed'].map((s) => ({
    key: s,
    label: s === 'all' ? `All (${projects.length})` : `${statusLabels[s] || s} (${countByStatus(s)})`,
    isActive: filterStatus === s,
    border: filterStatus === s ? 'rgba(201,168,76,0.5)' : 'rgba(255,255,255,0.08)',
    bg: filterStatus === s ? 'rgba(201,168,76,0.1)' : 'transparent',
    color: filterStatus === s ? '#c9a84c' : '#555',
  }))

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ flex: 1, padding: 40, maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 600, margin: '0 0 4px' }}>Projects</h1>
            <p style={{ color: '#999', fontSize: 12, margin: 0 }}>
              {filteredProjects.length === projects.length
                ? `${projects.length} total`
                : `${filteredProjects.length} of ${projects.length}`}
            </p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ name: '', description: '', address: '', status: 'planning' }) }}
            style={{
              background: '#c9a84c', color: '#0a0a0a',
              fontWeight: 600, fontSize: 13,
              border: 'none', borderRadius: 6,
              padding: '9px 20px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
            New Project
          </button>
        </div>

        {/* Status filter pills */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {filterPills.map((fp) => (
            <button
              key={fp.key}
              onClick={() => setFilterStatus(fp.key)}
              aria-pressed={fp.isActive}
              style={{
                padding: '5px 14px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
                border: `1px solid ${fp.border}`,
                background: fp.bg,
                color: fp.color,
              }}
            >
              {fp.label}
            </button>
          ))}
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} style={{
            background: '#1a1a1a',
            border: '1px solid rgba(201,168,76,0.18)',
            borderRadius: 10,
            padding: 24,
            marginBottom: 24,
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label htmlFor="proj-name" style={{ color: '#ccc', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6, letterSpacing: 0.8, textTransform: 'uppercase' }}>Name</label>
                <input
                  id="proj-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="e.g. Ocean Drive Residence"
                  aria-label="Project name"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(201,168,76,0.45)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(201,168,76,0.2)'}
                />
              </div>
              <div>
                <label htmlFor="proj-address" style={{ color: '#ccc', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6, letterSpacing: 0.8, textTransform: 'uppercase' }}>Address</label>
                <input
                  id="proj-address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="123 Main St, Fort Lauderdale, FL"
                  aria-label="Project address"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(201,168,76,0.45)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(201,168,76,0.2)'}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="proj-desc" style={{ color: '#ccc', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6, letterSpacing: 0.8, textTransform: 'uppercase' }}>Description</label>
                <textarea
                  id="proj-desc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  placeholder="A brief description of the project scope and vision"
                  aria-label="Project description"
                  style={{ ...inputStyle, resize: 'vertical' }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(201,168,76,0.45)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(201,168,76,0.2)'}
                />
              </div>
              <div>
                <label htmlFor="proj-status" style={{ color: '#ccc', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6, letterSpacing: 0.8, textTransform: 'uppercase' }}>Status</label>
                <select
                  id="proj-status"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  aria-label="Project status"
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(201,168,76,0.45)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(201,168,76,0.2)'}
                >
                  <option value="planning">Planning</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                type="submit"
                disabled={submitting}
                aria-busy={submitting}
                style={{
                  background: submitting ? 'rgba(201,168,76,0.5)' : '#c9a84c',
                  color: '#0a0a0a', fontWeight: 600, fontSize: 13,
                  border: 'none', borderRadius: 6, padding: '9px 24px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {submitting && (
                  <span style={{
                    width: 14, height: 14, border: '2px solid rgba(10,10,10,0.3)',
                    borderTopColor: '#0a0a0a', borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite',
                  }} />
                )}
                {editing ? 'Update Project' : 'Create Project'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} style={{ background: 'transparent', color: '#ccc', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '9px 24px', cursor: 'pointer', fontSize: 13 }}>
                Cancel
              </button>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </form>
        )}

        {filteredProjects.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 240, gap: 12, textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 12,
              background: 'rgba(201,168,76,0.05)',
              border: '1px solid rgba(201,168,76,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p style={{ color: '#999', fontSize: 14, margin: 0 }}>
              {projects.length === 0 ? 'No projects yet. Create your first project above.' : 'No projects match this filter.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {filteredProjects.map((p) => {
              const sc = statusColors[p.status] || statusColors.planning
              const isExpanded = expandedDesc === p.id
              const needsTruncate = p.description.length > 100
              const displayDesc = isExpanded ? p.description : (needsTruncate ? p.description.slice(0, 100) + '…' : p.description)

              return (
                <div key={p.id} style={{
                  background: '#1a1a1a',
                  border: '1px solid rgba(201,168,76,0.12)',
                  borderRadius: 10,
                  padding: 20,
                  display: 'flex', flexDirection: 'column',
                  transition: 'all 0.2s',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <h3 style={{ color: '#fff', fontSize: 15, fontWeight: 600, margin: 0, flex: 1, paddingRight: 8, lineHeight: 1.3 }}>{p.name}</h3>
                    <span style={{
                      background: sc.bg, color: sc.text,
                      fontSize: 10, fontWeight: 700,
                      padding: '3px 8px', borderRadius: 4,
                      textTransform: 'uppercase', letterSpacing: 0.8,
                      flexShrink: 0,
                    }}>
                      {statusLabels[p.status] || p.status}
                    </span>
                  </div>
                  {p.address && <p style={{ color: '#bbb', fontSize: 12, margin: '0 0 8px' }}>{p.address}</p>}
                  {p.description && (
                    <p
                      style={{ color: '#999', fontSize: 12, margin: '0 0 4px', lineHeight: 1.5, flex: 1 }}
                    >
                      {displayDesc}
                    </p>
                  )}
                  {needsTruncate && (
                    <button
                      onClick={() => setExpandedDesc(isExpanded ? null : p.id)}
                      style={{
                        background: 'none', border: 'none', color: '#c9a84c',
                        fontSize: 11, cursor: 'pointer', padding: 0,
                        marginBottom: 12, textAlign: 'left',
                        textDecoration: 'underline',
                        textUnderlineOffset: 2,
                      }}
                    >
                      {isExpanded ? 'Show less' : 'Read more'}
                    </button>
                  )}
                  <div style={{ marginTop: 'auto', display: 'flex', gap: 8, paddingTop: needsTruncate ? 0 : 16 }}>
                    <button onClick={() => router.push(`/projects/${p.id}`)} style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 5, padding: '5px 12px', color: '#c9a84c', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s', flex: 1 }}>
                      View
                    </button>
                    <button onClick={() => startEdit(p)} style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 5, padding: '5px 12px', color: '#3b82f6', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s', flex: 1 }}>
                      Edit
                    </button>
                    <button onClick={() => setDeleteTarget({ id: p.id, name: p.name })} style={{ background: 'transparent', border: '1px solid rgba(220,38,38,0.15)', borderRadius: 5, padding: '5px 12px', color: '#ccc', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s', flex: 1 }}>
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
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
      {deleteTarget && (
        <DeleteModal
          projectName={deleteTarget.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}