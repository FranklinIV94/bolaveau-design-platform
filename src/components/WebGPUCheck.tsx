'use client'

import { useEffect, useState, type ReactNode } from 'react'

function hasWebGPU(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.gpu
}

export function WebGPUCheck({ children }: { children: ReactNode }) {
  const [supported, setSupported] = useState<boolean | null>(null)

  useEffect(() => {
    setSupported(hasWebGPU())
  }, [])

  if (supported === null) {
    // Loading state — avoid flash of fallback
    return null
  }

  if (!supported) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: 480,
        background: '#0a0a0a',
        color: '#888',
        gap: 16,
        padding: 32,
        textAlign: 'center',
      }}>
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ opacity: 0.4 }}>
          <path d="M24 4L42 14v20L24 44 6 34V14L24 4z" stroke="#c9a84c" strokeWidth="2" fill="none"/>
          <path d="M24 4v20M6 14l18 10 18-10M24 24v20M6 34l18 10 18-10" stroke="#c9a84c" strokeWidth="1.5"/>
          <line x1="4" y1="44" x2="44" y2="4" stroke="#c9a84c" strokeWidth="2" opacity="0.5"/>
        </svg>
        <p style={{ fontSize: 16, fontWeight: 600, color: '#c9a84c', margin: 0 }}>
          WebGPU Required
        </p>
        <p style={{ fontSize: 14, color: '#666', margin: 0, maxWidth: 360 }}>
          Your browser doesn&apos;t support 3D editing. Please use Chrome 113+ or Edge 113+.
        </p>
      </div>
    )
  }

  return <>{children}</>
}