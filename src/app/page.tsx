'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useEffect } from 'react'

const FEATURES = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="3" y="6" width="22" height="16" rx="2" stroke="#c9a84c" strokeWidth="1.5" fill="none"/>
        <path d="M3 12h22" stroke="#c9a84c" strokeWidth="1.5"/>
        <rect x="8" y="15" width="4" height="4" rx="0.5" stroke="#c9a84c" strokeWidth="1" fill="none"/>
        <rect x="15" y="15" width="4" height="4" rx="0.5" stroke="#c9a84c" strokeWidth="1" fill="none"/>
        <path d="M10 6V2h8v4" stroke="#c9a84c" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
    title: '3D Architectural Editor',
    desc: 'Build with walls, doors, windows, columns, and slabs — all parametric, all real-time.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="8" stroke="#c9a84c" strokeWidth="1.5" fill="none"/>
        <path d="M14 6v16M6 14h16" stroke="#c9a84c" strokeWidth="1"/>
        <circle cx="14" cy="14" r="3" stroke="#c9a84c" strokeWidth="1.5" fill="rgba(201,168,76,0.2)"/>
        <path d="M11 11l6 6M17 11l-6 6" stroke="#c9a84c" strokeWidth="1" opacity="0.5"/>
      </svg>
    ),
    title: 'Material Paint Mode',
    desc: 'Click any surface to apply materials — concrete, glass, wood, steel. Instant visual feedback.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="3" y="3" width="10" height="10" rx="1" stroke="#c9a84c" strokeWidth="1.5" fill="none"/>
        <rect x="15" y="15" width="10" height="10" rx="1" stroke="#c9a84c" strokeWidth="1.5" fill="none"/>
        <path d="M13 8h2M13 14h2M8 13v2M14 13v2" stroke="#c9a84c" strokeWidth="1.5"/>
        <path d="M17 5l4 4M21 5l-4 4" stroke="#c9a84c" strokeWidth="1" opacity="0.4"/>
      </svg>
    ),
    title: '2D Floorplan Sync',
    desc: 'Edit in 2D or 3D — changes synchronize instantly. Switch views without losing context.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="10" cy="12" r="2" stroke="#c9a84c" strokeWidth="1.5" fill="none"/>
        <path d="M10 14v4l2 2" stroke="#c9a84c" strokeWidth="1.5" fill="none"/>
        <path d="M8 20h4" stroke="#c9a84c" strokeWidth="1.5"/>
        <rect x="14" y="3" width="11" height="7" rx="1" stroke="#c9a84c" strokeWidth="1" fill="none" opacity="0.4"/>
        <rect x="14" y="12" width="11" height="7" rx="1" stroke="#c9a84c" strokeWidth="1" fill="none" opacity="0.4"/>
        <circle cx="19.5" cy="6.5" r="1" fill="#c9a84c" opacity="0.4"/>
        <circle cx="19.5" cy="15.5" r="1" fill="#c9a84c" opacity="0.4"/>
      </svg>
    ),
    title: 'First-Person Walkthrough',
    desc: 'Explore your designs from inside — walk through rooms, check sightlines, feel the space.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M14 4l2 4h4l-3 3 1 5-4-2-4 2 1-5-3-3h4z" stroke="#c9a84c" strokeWidth="1.5" fill="none"/>
        <path d="M6 18l2-1M22 18l-2-1M14 22v-3" stroke="#c9a84c" strokeWidth="1.5"/>
        <circle cx="6" cy="19" r="2" stroke="#c9a84c" strokeWidth="1" fill="none"/>
        <circle cx="22" cy="19" r="2" stroke="#c9a84c" strokeWidth="1" fill="none"/>
        <circle cx="14" cy="24" r="2" stroke="#c9a84c" strokeWidth="1" fill="none"/>
      </svg>
    ),
    title: 'AI-Ready (MCP)',
    desc: 'AI agents manipulate scenes directly via the Model Context Protocol. Automate layouts, suggest designs.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M4 14h6l2-4 3 8 2-4h7" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M20 8l4 6-4 6" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="2" y="2" width="24" height="24" rx="3" stroke="#c9a84c" strokeWidth="1" fill="none" opacity="0.3"/>
      </svg>
    ),
    title: 'Export & Share',
    desc: 'Export models as GLB. Share projects with clients and collaborators. One click.',
  },
]

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // If authenticated, redirect to appropriate dashboard
  useEffect(() => {
    if (status === 'loading') return
    if (session) {
      if ((session.user as any)?.role === 'admin') {
        router.push('/admin/projects')
      } else {
        router.push('/projects')
      }
    }
  }, [session, status, router])

  // Show landing page for unauthenticated users (or while loading)
  const showLanding = !session

  if (!showLanding) return null

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      {/* Hero Section */}
      <section style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '120px 32px 80px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}>
        {/* Animated 3D wireframe building */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 320,
          height: 320,
          opacity: 0.12,
          animation: 'heroRotate 20s linear infinite',
          perspective: 600,
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            transformStyle: 'preserve-3d',
            animation: 'heroFloat 6s ease-in-out infinite',
          }}>
            <svg viewBox="0 0 200 200" fill="none" style={{ width: '100%', height: '100%' }}>
              {/* Isometric wireframe building */}
              <path d="M100 20L160 55V125L100 160L40 125V55Z" stroke="#c9a84c" strokeWidth="1.5" fill="none"/>
              <path d="M40 55L100 90L160 55" stroke="#c9a84c" strokeWidth="1" fill="none"/>
              <path d="M100 90V160" stroke="#c9a84c" strokeWidth="1.5"/>
              {/* Floor lines */}
              <path d="M58 72L100 95L142 72" stroke="#c9a84c" strokeWidth="0.7" opacity="0.5"/>
              <path d="M52 90L100 115L148 90" stroke="#c9a84c" strokeWidth="0.7" opacity="0.4"/>
              {/* Interior columns */}
              <line x1="80" y1="60" x2="80" y2="72" stroke="#c9a84c" strokeWidth="1" opacity="0.6"/>
              <line x1="120" y1="60" x2="120" y2="72" stroke="#c9a84c" strokeWidth="1" opacity="0.6"/>
              <line x1="80" y1="72" x2="80" y2="90" stroke="#c9a84c" strokeWidth="0.7" opacity="0.4"/>
              <line x1="120" y1="72" x2="120" y2="90" stroke="#c9a84c" strokeWidth="0.7" opacity="0.4"/>
              {/* Door */}
              <path d="M88 125L88 148L112 148L112 125" stroke="#c9a84c" strokeWidth="1" fill="none" opacity="0.7"/>
              {/* Windows */}
              <rect x="55" y="110" width="12" height="8" rx="0.5" stroke="#c9a84c" strokeWidth="0.8" fill="none" opacity="0.5"/>
              <rect x="133" y="110" width="12" height="8" rx="0.5" stroke="#c9a84c" strokeWidth="0.8" fill="none" opacity="0.5"/>
            </svg>
          </div>
        </div>

        {/* Glow effect */}
        <div style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 500,
          height: 500,
          background: 'radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <h1 style={{
          color: '#fff',
          fontSize: 'clamp(36px, 6vw, 64px)',
          fontWeight: 700,
          letterSpacing: -1.5,
          lineHeight: 1.1,
          marginBottom: 20,
          position: 'relative',
          zIndex: 1,
        }}>
          Design in 3D.<br />
          <span style={{ color: '#c9a84c' }}>Present with Impact.</span>
        </h1>

        <p style={{
          color: '#999',
          fontSize: 'clamp(16px, 2vw, 20px)',
          maxWidth: 560,
          lineHeight: 1.6,
          marginBottom: 40,
          position: 'relative',
          zIndex: 1,
        }}>
          Bolaveau Design Studio — architectural 3D modeling, real-time walkthroughs, and AI-ready scene editing. Built on Pascal.
        </p>

        <div style={{ display: 'flex', gap: 16, position: 'relative', zIndex: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => router.push('/auth/signin')}
            style={{
              background: '#c9a84c',
              color: '#0a0a0a',
              border: 'none',
              borderRadius: 8,
              padding: '14px 32px',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              letterSpacing: 0.3,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#d4b55a'
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(201,168,76,0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#c9a84c'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            Sign In to Studio
          </button>
          <button
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            style={{
              background: 'transparent',
              color: '#c9a84c',
              border: '1px solid rgba(201,168,76,0.4)',
              borderRadius: 8,
              padding: '14px 32px',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              letterSpacing: 0.3,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#c9a84c'
              e.currentTarget.style.background = 'rgba(201,168,76,0.08)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)'
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            Learn More
          </button>
        </div>

        {/* Powered by badge */}
        <div style={{
          marginTop: 48,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          position: 'relative',
          zIndex: 1,
        }}>
          <div style={{
            background: 'rgba(201,168,76,0.08)',
            border: '1px solid rgba(201,168,76,0.15)',
            borderRadius: 20,
            padding: '6px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1L10 3.5V8.5L6 11L2 8.5V3.5L6 1Z" stroke="#c9a84c" strokeWidth="1" fill="none"/>
            </svg>
            <span style={{ color: '#c9a84c', fontSize: 11, fontWeight: 600, letterSpacing: 0.5 }}>Powered by Pascal v0.8.0</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{
        padding: '80px 32px',
        maxWidth: 1100,
        margin: '0 auto',
        width: '100%',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{
            color: '#fff',
            fontSize: 'clamp(24px, 3.5vw, 32px)',
            fontWeight: 700,
            letterSpacing: -0.5,
            marginBottom: 12,
          }}>
            Everything You Need to Design
          </h2>
          <p style={{ color: '#888', fontSize: 16, maxWidth: 480, margin: '0 auto', lineHeight: 1.5 }}>
            From floor plans to walkthroughs. From materials to exports. One studio.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 20,
        }}>
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              style={{
                background: '#1a1a1a',
                border: '1px solid rgba(201,168,76,0.1)',
                borderRadius: 12,
                padding: '28px 24px',
                transition: 'all 0.3s ease',
                animation: `fadeInUp 0.5s ease ${i * 0.1}s both`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(201,168,76,0.35)'
                e.currentTarget.style.boxShadow = '0 4px 24px rgba(201,168,76,0.08)'
                e.currentTarget.style.transform = 'translateY(-3px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(201,168,76,0.1)'
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div style={{ marginBottom: 16 }}>{f.icon}</div>
              <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 600, margin: '0 0 8px', letterSpacing: -0.2 }}>
                {f.title}
              </h3>
              <p style={{ color: '#888', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack Strip */}
      <section style={{
        borderTop: '1px solid rgba(201,168,76,0.08)',
        borderBottom: '1px solid rgba(201,168,76,0.08)',
        padding: '40px 32px',
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 12,
        maxWidth: 1100,
        margin: '0 auto',
        width: '100%',
      }}>
        {['Next.js 15', 'React 19', 'Three.js', 'WebGPU', 'Pascal v0.8.0', 'TypeScript', 'Tailwind CSS', '@pascal-app/mcp'].map(t => (
          <span key={t} style={{
            background: 'rgba(201,168,76,0.06)',
            border: '1px solid rgba(201,168,76,0.12)',
            borderRadius: 6,
            padding: '6px 14px',
            color: '#bbb',
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: 0.3,
          }}>
            {t}
          </span>
        ))}
      </section>

      <Footer />

      {/* Animations */}
      <style>{`
        @keyframes heroRotate {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}