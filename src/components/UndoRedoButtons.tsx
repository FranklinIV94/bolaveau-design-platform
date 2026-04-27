'use client'

import { useCallback, useEffect, useState } from 'react'
import { useScene } from '@pascal-app/core'

export default function UndoRedoButtons() {
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  useEffect(() => {
    const temporal = useScene.temporal
    if (!temporal) return

    const checkState = () => {
      const state = temporal.getState()
      setCanUndo(state?.past?.length > 0)
      setCanRedo(state?.future?.length > 0)
    }

    checkState()
    const unsub = temporal.subscribe(checkState)
    return () => { unsub() }
  }, [])

  const handleUndo = useCallback(() => {
    const temporal = useScene.temporal
    if (!temporal) return
    temporal.getState().undo()
  }, [])

  const handleRedo = useCallback(() => {
    const temporal = useScene.temporal
    if (!temporal) return
    temporal.getState().redo()
  }, [])

  return (
    <div style={{
      position: 'absolute',
      top: 12,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 40,
      display: 'flex',
      gap: 4,
      pointerEvents: 'auto',
    }}>
      <button
        onClick={handleUndo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: canUndo ? 'rgba(26,26,26,0.92)' : 'rgba(26,26,26,0.6)',
          backdropFilter: 'blur(12px)',
          border: canUndo ? '1px solid rgba(201,168,76,0.25)' : '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: canUndo ? 'pointer' : 'not-allowed',
          transition: 'all 0.15s ease',
          opacity: canUndo ? 1 : 0.4,
        }}
        onMouseEnter={(e) => { if (canUndo) e.currentTarget.style.background = 'rgba(201,168,76,0.15)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = canUndo ? 'rgba(26,26,26,0.92)' : 'rgba(26,26,26,0.6)' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={canUndo ? '#c9a84c' : '#555'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 10h10a5 5 0 0 1 0 10H9" />
          <path d="M3 10l4-4" />
          <path d="M3 10l4 4" />
        </svg>
      </button>
      <button
        onClick={handleRedo}
        disabled={!canRedo}
        title="Redo (Ctrl+Shift+Z)"
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: canRedo ? 'rgba(26,26,26,0.92)' : 'rgba(26,26,26,0.6)',
          backdropFilter: 'blur(12px)',
          border: canRedo ? '1px solid rgba(201,168,76,0.25)' : '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: canRedo ? 'pointer' : 'not-allowed',
          transition: 'all 0.15s ease',
          opacity: canRedo ? 1 : 0.4,
        }}
        onMouseEnter={(e) => { if (canRedo) e.currentTarget.style.background = 'rgba(201,168,76,0.15)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = canRedo ? 'rgba(26,26,26,0.92)' : 'rgba(26,26,26,0.6)' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={canRedo ? '#c9a84c' : '#555'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10H11a5 5 0 0 0 0 10h4" />
          <path d="M21 10l-4-4" />
          <path d="M21 10l-4 4" />
        </svg>
      </button>
    </div>
  )
}