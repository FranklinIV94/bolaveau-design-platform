'use client'

import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Header() {
  const { data: session } = useSession()
  const isAdmin = (session?.user as any)?.role?.toLowerCase() === 'admin'
  const pathname = usePathname()

  const navLinkStyle = (active: boolean): React.CSSProperties => ({
    marginLeft: 16,
    color: active ? '#c9a84c' : '#888',
    fontSize: 13,
    textDecoration: 'none',
    fontWeight: 500,
    transition: 'color 0.15s',
    position: 'relative',
    paddingBottom: 2,
    borderBottom: active ? '1.5px solid #c9a84c' : '1.5px solid transparent',
  })

  return (
    <div style={{
      height: 52,
      background: '#1a1a1a',
      borderBottom: '1px solid rgba(201,168,76,0.15)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: 16,
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
        <div style={{
          width: 30,
          height: 30,
          borderRadius: 6,
          background: '#c9a84c',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: 15,
          color: '#0a0a0a',
          flexShrink: 0,
          transition: 'transform 0.2s',
        }}>
          B
        </div>
        <div>
          <div style={{ color: '#fff', fontWeight: 600, fontSize: 14, letterSpacing: 1.5, lineHeight: 1.2 }}>
            BOLAVEAU
          </div>
          <div style={{ color: '#555', fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase' }}>
            Design Studio
          </div>
        </div>
      </Link>

      {session && (
        <>
          <Link href="/projects" style={navLinkStyle(pathname.startsWith('/projects') && !pathname.startsWith('/admin'))}>
            Projects
          </Link>
          {isAdmin && (
            <Link href="/admin/projects" style={navLinkStyle(pathname.startsWith('/admin'))}>
              Manage
            </Link>
          )}
        </>
      )}

      <div style={{ flex: 1 }} />

      {session && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: '#555', fontSize: 11, letterSpacing: 0.3 }}>
            {session.user?.email}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 5,
              padding: '5px 12px',
              color: '#666',
              fontSize: 11,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)'; e.currentTarget.style.color = '#c9a84c' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#666' }}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}