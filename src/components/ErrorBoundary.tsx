'use client'

import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100%', minHeight: 400, background: '#0a0a0a', color: '#ccc', padding: 32, gap: 16,
        }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="20" stroke="#c9a84c" strokeWidth="2" fill="none" />
            <path d="M24 14v12" stroke="#c9a84c" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="24" cy="34" r="2" fill="#c9a84c" />
          </svg>
          <h3 style={{ color: '#c9a84c', margin: 0, fontSize: 16 }}>Editor Error</h3>
          <pre style={{ color: '#999', fontSize: 12, maxWidth: 600, overflow: 'auto', background: '#1a1a1a', padding: 12, borderRadius: 8, border: '1px solid rgba(201,168,76,0.1)' }}>
            {this.state.error?.message}
          </pre>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              background: '#c9a84c', color: '#0a0a0a', border: 'none', borderRadius: 6,
              padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}