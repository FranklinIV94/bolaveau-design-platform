'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => { setMounted(true) }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (result?.error) {
      setError('The email or password you entered is incorrect.')
    } else {
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
      backgroundImage: 'radial-gradient(ellipse at center, rgba(201,168,76,0.03) 0%, transparent 70%)',
      padding: 20,
    }}>
      {/* Card with entrance animation */}
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: '#1a1a1a',
        borderRadius: 12,
        border: '1px solid rgba(201,168,76,0.15)',
        padding: 40,
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0px)' : 'translateY(16px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}>
        {/* Logomark */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 10,
            background: '#c9a84c',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 22, color: '#0a0a0a',
            margin: '0 auto 12px',
          }}>
            B
          </div>
          <h1 style={{
            color: '#fff', fontSize: 20, fontWeight: 600,
            letterSpacing: 2, margin: '0 0 4px',
          }}>
            BOLAVEAU
          </h1>
          <p style={{
            color: '#555', fontSize: 11, letterSpacing: 2,
            textTransform: 'uppercase', margin: 0,
          }}>
            Design Studio
          </p>
          <p style={{
            color: '#666', fontSize: 12,
            marginTop: 12, fontStyle: 'italic',
            letterSpacing: 0.3,
          }}>
            Experience your space before it's built
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(201,168,76,0.06)',
            borderLeft: '3px solid rgba(201,168,76,0.5)',
            borderRadius: 4,
            padding: '10px 14px',
            color: '#c9a84c',
            fontSize: 13,
            marginBottom: 20,
            letterSpacing: 0.2,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="email" style={{
              color: '#888', fontSize: 11, fontWeight: 600,
              display: 'block', marginBottom: 6,
              letterSpacing: 0.8, textTransform: 'uppercase',
            }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="your@email.com"
              aria-label="Email address"
              style={{
                width: '100%',
                padding: '11px 14px',
                background: '#111',
                border: '1px solid rgba(201,168,76,0.2)',
                borderRadius: 6,
                color: '#fff',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = 'rgba(201,168,76,0.5)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(201,168,76,0.2)'}
            />
          </div>


          <div style={{ marginBottom: 24 }}>
            <label htmlFor="password" style={{
              color: '#888', fontSize: 11, fontWeight: 600,
              display: 'block', marginBottom: 6,
              letterSpacing: 0.8, textTransform: 'uppercase',
            }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              aria-label="Password"
              style={{
                width: '100%',
                padding: '11px 14px',
                background: '#111',
                border: '1px solid rgba(201,168,76,0.2)',
                borderRadius: 6,
                color: '#fff',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = 'rgba(201,168,76,0.5)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(201,168,76,0.2)'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            aria-label={loading ? 'Signing in…' : 'Sign in'}
            aria-busy={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? 'rgba(201,168,76,0.5)' : '#c9a84c',
              color: '#0a0a0a',
              fontWeight: 700,
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
              borderRadius: 6,
              cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: 0.5,
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}