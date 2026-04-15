'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError('Invalid email or password')
    } else {
      // Redirect admins to admin dashboard, clients to projects
      const session = await fetch('/api/auth/session').then(r => r.json())
      if (session?.user?.role === 'admin') {
        router.push('/admin/projects')
      } else {
        router.push('/projects')
      }
    }
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#0a0a0a',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        padding: 40,
        background: '#1a1a1a',
        borderRadius: 12,
        border: '1px solid rgba(201,168,76,0.2)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 8,
            background: '#c9a84c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 24,
            color: '#1a1a1a',
            margin: '0 auto 12px',
          }}>
            B
          </div>
          <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 600, letterSpacing: 0.5, margin: 0 }}>
            BOLAVEAU
          </h1>
          <p style={{ color: '#666', fontSize: 12, letterSpacing: 2, marginTop: 4 }}>
            DESIGN STUDIO
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(220,38,38,0.1)',
            border: '1px solid rgba(220,38,38,0.3)',
            borderRadius: 6,
            padding: '10px 14px',
            color: '#ef4444',
            fontSize: 13,
            marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: '#999', fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                background: '#0a0a0a',
                border: '1px solid rgba(201,168,76,0.2)',
                borderRadius: 6,
                color: '#fff',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ color: '#999', fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                background: '#0a0a0a',
                border: '1px solid rgba(201,168,76,0.2)',
                borderRadius: 6,
                color: '#fff',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: '#c9a84c',
              color: '#1a1a1a',
              fontWeight: 600,
              fontSize: 14,
              border: 'none',
              borderRadius: 6,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}