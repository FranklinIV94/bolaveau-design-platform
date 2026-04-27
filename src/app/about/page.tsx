'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const TECH_STACK = [
  { category: 'Frontend', items: ['Next.js 15', 'React 19', 'Tailwind CSS 3', 'TypeScript 5', 'Three.js / React Three Fiber', 'Pascal Editor v0.6.0 (WebGPU)'] },
  { category: 'Backend', items: ['Next.js API Routes', 'Supabase (PostgreSQL)', 'Supabase Auth', 'Supabase Storage', 'Row-Level Security (RLS)'] },
  { category: 'Infrastructure', items: ['Vercel (hosting)', 'Local storage (scene persistence)', 'WebGPU (3D rendering)', 'GLB/GLTF model export'] },
  { category: 'Security', items: ['Role-based access (admin/user)', 'RLS data isolation per entity', 'Session-based auth (NextAuth v4)', 'Supabase service role (server-side only)'] },
]

const MODULE_ROADMAP = [
  { num: '0', name: 'Scaffold', status: 'done', desc: 'Auth, database schema, shared components, RBAC, project management', replaces: '—' },
  { num: '1', name: 'Bookkeeping', status: 'done', desc: 'Chart of accounts, journal entries, P&L and balance sheet reporting', replaces: 'QuickBooks ($130/mo × 2 companies)' },
  { num: '2', name: 'Accounts Payable', status: 'planned', desc: 'Vendor bills, payment scheduling, aging reports, ACH integration', replaces: 'Spreadsheets + Bill.com' },
  { num: '3', name: 'Accounts Receivable', status: 'planned', desc: 'Client invoicing, payment tracking, aging reports, reminders', replaces: 'Spreadsheets + invoice apps' },
  { num: '4', name: 'Insurance Policies', status: 'planned', desc: 'Policy tracking, renewal calendar, coverage gap alerts, document storage', replaces: 'Spreadsheets' },
  { num: '5', name: 'Audits', status: 'planned', desc: 'Audit-ready document portal, compliance checklists, evidence collection', replaces: 'Email + spreadsheets' },
  { num: '6', name: 'Proposals', status: 'planned', desc: 'Versioned proposal builder, e-signature, client portal for review', replaces: 'Google Docs + PDFs' },
  { num: '7', name: 'Service Agreements', status: 'planned', desc: 'Contract management, renewal tracking, clause library, auto-renewal alerts', replaces: 'DocuSign + spreadsheets' },
  { num: '8', name: '3D Design Editor', status: 'live', desc: 'Architectural floor plans, furniture placement, walkthrough mode, GLB export, demo scene', replaces: 'Paid CAD tools (AutoCAD, SketchUp)' },
]

const ARCHITECTURE_SECTIONS = [
  {
    title: 'Frontend (Next.js + React)',
    body: 'All pages are server-rendered or statically generated where possible. The 3D editor runs client-side only (dynamic import, no SSR) since it requires WebGPU. State management uses React hooks + Context for auth, and the Pascal scene store (zustand-based) manages all 3D editor state. Undo/redo is handled by the Pascal temporal store (zundo-based).',
  },
  {
    title: '3D Rendering (Pascal v0.6.0 + Three.js)',
    body: 'The editor uses Pascal\'s architectural primitives — walls, slabs, doors, windows, stairs, zones — rendered via React Three Fiber on a WebGPU backend. All geometry is parametric: walls have thickness and height; doors have swing direction; windows have sill height. The scene graph is stored as a tree of nodes in the Pascal store (zustand).',
  },
  {
    title: 'Scene Persistence',
    body: 'Currently using browser localStorage (keyed by project ID) as an interim solution. A server-side API route (/api/projects/[id]/scene) is ready to persist scene data to a Supabase JSONB column when that column is added to the projects table. Scene auto-saves on every change with a 1-second debounce.',
  },
  {
    title: 'Backend (Supabase)',
    body: 'Supabase hosts PostgreSQL (with RLS), auth, and file storage. All API routes are Next.js server-side — they validate sessions, check RLS policies via the service role key, and return data. The browser never sees the service role key.',
  },
  {
    title: 'Authentication (NextAuth v4)',
    body: 'NextAuth handles sign-in/out with email + password via Supabase Auth. Sessions are stored in JWT cookies. Each session includes the user role (admin or user). Middleware protects all /projects and /admin routes — unauthenticated users are redirected to sign-in.',
  },
  {
    title: 'Role-Based Access Control (RLS)',
    body: 'Every Supabase table uses RLS with a service_role that bypasses RLS (used only in server-side API routes) and an anon key for client-side reads. Data isolation is enforced by entity_id on every table — users can only see their own organization\'s data. Admin users see all data.',
  },
  {
    title: 'File Storage (Supabase Storage)',
    body: 'GLB/GLTF 3D model files uploaded by admins are stored in Supabase Storage buckets. Files are served via public URLs with scoped access. File metadata (name, size, storage path, created_at) is stored in the database for listing and deletion.',
  },
]

export default function AboutPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    if (!session) { router.push('/auth/signin'); return }
  }, [session, status, router])

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ flex: 1, padding: '48px 32px 80px', maxWidth: 960, margin: '0 auto', width: '100%' }}>

        {/* Page header */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 8,
              background: 'rgba(201,168,76,0.1)',
              border: '1px solid rgba(201,168,76,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <span style={{ color: '#c9a84c', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5 }}>Platform Info</span>
          </div>
          <h1 style={{ color: '#fff', fontSize: 30, fontWeight: 700, margin: '0 0 8px', letterSpacing: -0.5 }}>About the Platform</h1>
          <p style={{ color: '#bbb', fontSize: 15, margin: 0, maxWidth: 600 }}>
            What this is, how it works, the tech behind it, and where it&apos;s going.
          </p>
        </div>

        {/* What it is */}
        <section style={{ marginBottom: 48 }}>
          <SectionHeading>What This Is</SectionHeading>
          <div style={cardStyle}>
            <p style={{ color: '#ccc', fontSize: 14, lineHeight: 1.7, margin: '0 0 16px' }}>
              An internal operations platform built for <strong style={{ color: '#fff' }}>Bolaveau Group and South Fifty Seven</strong> — two companies operating under one parent structure that need a single source of truth for financials, design projects, and business operations.
            </p>
            <p style={{ color: '#ccc', fontSize: 14, lineHeight: 1.7, margin: '0 0 16px' }}>
              This isn&apos;t a generic SaaS tool. It&apos;s a purpose-built command center for running both companies — combining real-time bookkeeping, client project management, 3D design visualization, and operational workflows in one place.
            </p>
            <p style={{ color: '#ccc', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
              The platform replaces QuickBooks (×2), scattered spreadsheets, paid CAD tools, proposal templates, andDocuSign workflows — with a single owned system that costs ~$45/month to run instead of ~$310/month.
            </p>
          </div>
        </section>

        {/* What it does */}
        <section style={{ marginBottom: 48 }}>
          <SectionHeading>What It Does</SectionHeading>
          <div style={cardStyle}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {[
                { icon: '📊', label: 'Bookkeeping', detail: 'Real-time P&L, balance sheet, journal entries' },
                { icon: '📁', label: 'Project Management', detail: 'Status tracking, model files, client sharing' },
                { icon: '🏗️', label: '3D Design Editor', detail: 'Floor plans, furniture, walkthrough, GLB export' },
                { icon: '📑', label: 'Proposals', detail: 'Versioned drafts, e-signature, trackable' },
                { icon: '📋', label: 'Service Agreements', detail: 'Contract renewals, clause library, alerts' },
                { icon: '🛡️', label: 'Insurance Tracking', detail: 'Policy renewals, coverage gaps, calendar' },
                { icon: '🔍', label: 'Audit Readiness', detail: 'Compliance checklists, evidence portal' },
                { icon: '💰', label: 'AP + AR', detail: 'Vendor bills, client invoicing, aging reports' },
              ].map(item => (
                <div key={item.label} style={{
                  background: 'rgba(201,168,76,0.04)',
                  border: '1px solid rgba(201,168,76,0.1)',
                  borderRadius: 8,
                  padding: '14px 16px',
                }}>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{item.icon}</div>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{item.label}</div>
                  <div style={{ color: '#888', fontSize: 11, lineHeight: 1.4 }}>{item.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Module roadmap */}
        <section style={{ marginBottom: 48 }}>
          <SectionHeading>Module Roadmap</SectionHeading>
          <div style={cardStyle}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(201,168,76,0.15)' }}>
                  {['#', 'Module', 'Status', 'Description', 'Replaces'].map(h => (
                    <th key={h} style={{ color: '#888', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, padding: '0 0 10px', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MODULE_ROADMAP.map(m => (
                  <tr key={m.num} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ color: '#555', fontSize: 12, padding: '10px 8px 10px 0' }}>{m.num}</td>
                    <td style={{ color: '#fff', fontSize: 13, fontWeight: 600, padding: '10px 8px' }}>{m.name}</td>
                    <td style={{ padding: '10px 8px' }}>
                      <StatusBadge status={m.status} />
                    </td>
                    <td style={{ color: '#bbb', fontSize: 12, padding: '10px 8px', lineHeight: 1.4 }}>{m.desc}</td>
                    <td style={{ color: '#888', fontSize: 11, padding: '10px 0 10px 8px', lineHeight: 1.4 }}>{m.replaces}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* How it works */}
        <section style={{ marginBottom: 48 }}>
          <SectionHeading>How It Works</SectionHeading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {ARCHITECTURE_SECTIONS.map((s, i) => (
              <details key={i} style={{
                background: '#1a1a1a',
                border: '1px solid rgba(201,168,76,0.1)',
                borderRadius: 8,
                overflow: 'hidden',
              }}>
                <summary style={{
                  padding: '14px 18px',
                  cursor: 'pointer',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  listStyle: 'none',
                }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="M4 6l3-3 3 3M4 6v5M7 3v8"/>
                  </svg>
                  {s.title}
                </summary>
                <div style={{ padding: '0 18px 16px 42px' }}>
                  <p style={{ color: '#bbb', fontSize: 13, lineHeight: 1.7, margin: 0 }}>{s.body}</p>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Tech stack */}
        <section style={{ marginBottom: 48 }}>
          <SectionHeading>Tech Stack</SectionHeading>
          <div style={cardStyle}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {TECH_STACK.map(group => (
                <div key={group.category}>
                  <div style={{ color: '#888', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{group.category}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {group.items.map(item => (
                      <span key={item} style={{
                        background: 'rgba(201,168,76,0.06)',
                        border: '1px solid rgba(201,168,76,0.12)',
                        borderRadius: 4,
                        padding: '4px 10px',
                        color: '#ccc',
                        fontSize: 12,
                      }}>{item}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Key design decisions */}
        <section style={{ marginBottom: 48 }}>
          <SectionHeading>Key Design Decisions</SectionHeading>
          <div style={cardStyle}>
            {[
              { q: 'Why not QuickBooks integration?', a: 'QuickBooks is $130/month per company for features we don\'t need half of. A purpose-built system gives us P&L, balance sheet, and journal entries at ~$45/month total — with no per-seat pricing, no exit fees, and full ownership.' },
              { q: 'Why WebGPU for the 3D editor?', a: 'Pascal v0.6.0 uses WebGPU for performance. It renders architectural geometry (walls, slabs, stairs) in a browser without plugins. Chrome 113+ and Edge 113+ support it natively. Fallback is a message explaining the browser requirement.' },
              { q: 'Why localStorage for scene data?', a: 'Scene state changes rapidly (every mouse drag). Writing to Supabase on every change would be expensive and slow. localStorage with a 1-second debounce is a fast interim solution. The API route is ready for when a JSONB column is added to the projects table.' },
              { q: 'Why Supabase over other databases?', a: 'PostgreSQL + built-in auth + file storage + RLS + a clean admin UI. No separate auth service, no S3 bucket config, no custom RLS implementation. It\'s the right tool for the complexity level of this platform.' },
              { q: 'What happens to historical data?', a: 'Current fiscal year is included in the $10K build. Importing 2–3 years of historical QuickBooks data is available as a separate engagement. It requires careful mapping of accounts, journal entries, and balances.' },
            ].map(item => (
              <div key={item.q} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>{item.q}</div>
                <div style={{ color: '#bbb', fontSize: 12, lineHeight: 1.6 }}>{item.a}</div>
              </div>
            ))}
          </div>
        </section>

      </div>
      <Footer />
    </div>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 style={{ color: '#fff', fontSize: 15, fontWeight: 700, margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: 1 }}>{children}</h2>
}

const cardStyle: React.CSSProperties = {
  background: '#1a1a1a',
  border: '1px solid rgba(201,168,76,0.1)',
  borderRadius: 10,
  padding: '20px 24px',
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    done: { bg: 'rgba(34,197,94,0.12)', text: '#22c55e', label: 'Live' },
    live: { bg: 'rgba(34,197,94,0.12)', text: '#22c55e', label: 'Live' },
    planned: { bg: 'rgba(59,130,246,0.12)', text: '#3b82f6', label: 'Planned' },
    'in-progress': { bg: 'rgba(201,168,76,0.12)', text: '#c9a84c', label: 'In Progress' },
  }
  const s = map[status] || map.planned
  return (
    <span style={{ background: s.bg, color: s.text, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
      {s.label}
    </span>
  )
}
