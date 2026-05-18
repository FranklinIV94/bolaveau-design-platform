'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Project Error Boundary]', error.message, error.stack)
  }, [error])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: '#0a0a0a', color: '#ccc', padding: 32, gap: 16,
    }}>
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="20" stroke="#c9a84c" strokeWidth="2" fill="none" />
        <path d="M24 14v12" stroke="#c9a84c" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="24" cy="34" r="2" fill="#c9a84c" />
      </svg>
      <h2 style={{ color: '#c9a84c', fontSize: 18, fontWeight: 600, margin: 0 }}>Something went wrong</h2>
      <p style={{ color: '#888', fontSize: 14, margin: 0, maxWidth: 480, textAlign: 'center' }}>
        {error.message || 'An unexpected error occurred while loading the 3D editor.'}
      </p>
      <p style={{ color: '#555', fontSize: 12, margin: 0 }}>
        If this persists, try using Chrome 113+ or Edge 113+ for full WebGPU support.
      </p>
      <button
        onClick={reset}
        style={{
          background: '#c9a84c', color: '#0a0a0a', border: 'none', borderRadius: 6,
          padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}
      >
        Try Again
      </button>
    </div>
  )
}