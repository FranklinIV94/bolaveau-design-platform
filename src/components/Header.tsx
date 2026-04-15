'use client'

import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'

export default function Header() {
  const { data: session } = useSession()
  const isAdmin = (session?.user as any)?.role === 'ADMIN'

  return (
    <div style={{
      height: 52,
      background: '#1a1a1a',
      borderBottom: '1px solid rgba(201,168,76,0.2)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: 16,
      flexShrink: 0,
    }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 6,
          background: '#c9a84c',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: 16,
          color: '#1a1a1a',
          flexShrink: 0,
        }}>
          B
        </div>
        <div>
          <div style={{ color: '#fff', fontWeight: 600, fontSize: 15, letterSpacing: 0.5 }}>
            BOLAVEAU
          </div>
          <div style={{ color: '#666', fontSize: 10, letterSpacing: 1 }}>
            DESIGN STUDIO
          </div>
        </div>
      </Link>

      {session && (
        <>
          <Link href="/projects" style={{
            marginLeft: 16,
            color: '#999',
            fontSize: 13,
            textDecoration: 'none',
            fontWeight: 500,
          }}>
            Projects
          </Link>
          {isAdmin && (
            <Link href="/admin/projects" style={{
              color: '#999',
              fontSize: 13,
              textDecoration: 'none',
              fontWeight: 500,
            }}>
              Manage
            </Link>
          )}
        </>
      )}

      <div style={{ flex: 1 }} />

      {session && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#666', fontSize: 12 }}>
            {session.user?.email}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            style={{
              background: 'rgba(201,168,76,0.1)',
              border: '1px solid rgba(201,168,76,0.25)',
              borderRadius: 5,
              padding: '4px 12px',
              color: '#c9a84c',
              fontSize: 11,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}