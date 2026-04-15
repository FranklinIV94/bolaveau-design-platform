'use client'

import { Canvas, useThree } from '@react-three/fiber'
import {
  OrbitControls,
  useGLTF,
  Environment,
  GizmoHelper,
  GizmoViewcube,
  Grid,
} from '@react-three/drei'
import { Suspense, useState, useCallback, useEffect, useRef } from 'react'
import * as THREE from 'three'

// ─── Types ────────────────────────────────────────────────────────────────────
type ViewMode = 'orbit' | 'interior'

// ─── Model loader with auto-center ───────────────────────────────────────────
function GLTFModel({ url, onLoad }: { url: string; onLoad?: () => void }) {
  const { scene } = useGLTF(url)

  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    scene.position.sub(center)
    if (maxDim > 0) scene.scale.setScalar(5 / maxDim)
    const newBox = new THREE.Box3().setFromObject(scene)
    scene.position.y -= newBox.getCenter(new THREE.Vector3()).y
    onLoad?.()
  }, [scene, onLoad])

  return <primitive object={scene} />
}

// ─── Camera controller — animated snap to preset ───────────────────────────────
function CameraController({ viewMode }: { viewMode: ViewMode }) {
  const { camera } = useThree()
  const targetRef = useRef({ set: false, tx: 6, ty: 4, tz: 6, lx: 0, ly: 0, lz: 0 })
  const prevMode = useRef(viewMode)

  useEffect(() => {
    const t = targetRef.current
    if (viewMode === 'interior') {
      t.tx = 0; t.ty = 1.6; t.tz = 1.2
      t.lx = 0; t.ly = 1.6; t.lz = 50
    } else {
      t.tx = 6; t.ty = 4; t.tz = 6
      t.lx = 0; t.ly = 0; t.lz = 0
    }
    t.set = prevMode.current !== viewMode
    prevMode.current = viewMode
  }, [viewMode])

  return null
}

// ─── Scene content ─────────────────────────────────────────────────────────────
function SceneContent({
  url,
  viewMode,
  onModelLoad,
}: {
  url: string
  viewMode: ViewMode
  onModelLoad: () => void
}) {
  return (
    <>
      <CameraController viewMode={viewMode} />
      <Environment preset="city" />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 15, 10]} intensity={1.0} castShadow />
      <directionalLight position={[-8, 10, -8]} intensity={0.3} />

      {viewMode === 'orbit' && (
        <Grid
          args={[30, 30]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor="#2a2a2a"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#c9a84c"
          fadeDistance={40}
          fadeStrength={1.2}
          followCamera={false}
          infiniteGrid
        />
      )}

      <Suspense fallback={null}>
        <GLTFModel url={url} onLoad={onModelLoad} />
      </Suspense>

      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={viewMode === 'interior' ? 0.1 : 1}
        maxDistance={viewMode === 'interior' ? 5 : 150}
        minPolarAngle={viewMode === 'interior' ? Math.PI / 4 : 0}
        maxPolarAngle={viewMode === 'interior' ? Math.PI - Math.PI / 4 : Math.PI / 2 - 0.02}
        target={viewMode === 'interior' ? [0, 1.6, 0] : [0, 0, 0]}
      />

      <GizmoHelper alignment="bottom-right" margin={[90, 90]}>
        <GizmoViewcube />
      </GizmoHelper>
    </>
  )
}

// ─── Fullscreen helpers ────────────────────────────────────────────────────────
function toggleFullscreen(el: HTMLElement | null) {
  if (!el) return
  if (!document.fullscreenElement) {
    el.requestFullscreen?.()
  } else {
    document.exitFullscreen?.()
  }
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ModelViewer({ modelUrl }: { modelUrl: string }) {
  const [viewMode, setViewMode] = useState<ViewMode>('orbit')
  const [loaded, setLoaded] = useState(false)
  const [showHint, setShowHint] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [hint, setHint] = useState('Press F for fullscreen · Esc to exit')
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasWrapRef = useRef<HTMLDivElement>(null)

  // Hide fullscreen hint after 3s
  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 3000)
    return () => clearTimeout(t)
  }, [])

  // Fullscreen change listener
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  // Keyboard shortcut: F = fullscreen, Escape = exit
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && document.fullscreenElement) {
        document.exitFullscreen?.()
      } else if (e.key === 'f' || e.key === 'F') {
        if (document.fullscreenElement) {
          document.exitFullscreen?.()
        } else {
          toggleFullscreen(canvasWrapRef.current)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handleModelLoad = useCallback(() => setLoaded(true), [])
  const toggleMode = useCallback(() => {
    setLoaded(false)
    setViewMode((v) => (v === 'orbit' ? 'interior' : 'orbit'))
  }, [])

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Fullscreen button — bottom left */}
      <button
        onClick={() => toggleFullscreen(canvasWrapRef.current)}
        title="Toggle fullscreen (F)"
        style={{
          position: 'absolute',
          bottom: 14,
          left: 14,
          zIndex: 30,
          background: 'rgba(16,16,16,0.82)',
          border: '1px solid rgba(201,168,76,0.3)',
          borderRadius: 6,
          width: 34,
          height: 34,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: isFullscreen ? '#c9a84c' : '#888',
          transition: 'all 0.2s',
          backdropFilter: 'blur(8px)',
          padding: 0,
        }}
      >
        {/* Expand icon */}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M1 5V1h4M9 1H13V5M13 9V13H9M5 13H1V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Mode toolbar — top center */}
      <div style={{
        position: 'absolute',
        top: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 6,
        zIndex: 20,
        background: 'rgba(16,16,16,0.85)',
        border: '1px solid rgba(201,168,76,0.25)',
        borderRadius: 8,
        padding: '5px 8px',
        backdropFilter: 'blur(10px)',
      }}>
        <button
          onClick={() => { setLoaded(false); setViewMode('orbit') }}
          style={{
            background: viewMode === 'orbit' ? '#c9a84c' : 'transparent',
            color: viewMode === 'orbit' ? '#0a0a0a' : '#888',
            border: '1px solid ' + (viewMode === 'orbit' ? '#c9a84c' : 'rgba(201,168,76,0.2)'),
            borderRadius: 5,
            padding: '5px 14px',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Orbit
        </button>
        <button
          onClick={() => { setLoaded(false); setViewMode('interior') }}
          style={{
            background: viewMode === 'interior' ? '#c9a84c' : 'transparent',
            color: viewMode === 'interior' ? '#0a0a0a' : '#888',
            border: '1px solid ' + (viewMode === 'interior' ? '#c9a84c' : 'rgba(201,168,76,0.2)'),
            borderRadius: 5,
            padding: '5px 14px',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Interior
        </button>
      </div>

      {/* Loading overlay */}
      {!loaded && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'rgba(10,10,10,0.85)',
          zIndex: 15,
          gap: 16,
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 8,
            border: '3px solid rgba(201,168,76,0.2)',
            borderTopColor: '#c9a84c',
            animation: 'spin 1s linear infinite',
          }} />
          <p style={{ color: '#c9a84c', fontSize: 13, fontWeight: 500, margin: 0 }}>
            Preparing your space…
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Interior view hint */}
      {viewMode === 'interior' && (
        <div style={{
          position: 'absolute',
          bottom: 14,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 20,
          background: 'rgba(16,16,16,0.8)',
          border: '1px solid rgba(201,168,76,0.2)',
          borderRadius: 6,
          padding: '6px 16px',
          backdropFilter: 'blur(8px)',
          pointerEvents: 'none',
          opacity: showHint ? 1 : 0,
          transition: 'opacity 0.5s',
        }}>
          <p style={{ color: '#888', fontSize: 11, margin: 0, textAlign: 'center', whiteSpace: 'nowrap' }}>
            Drag to look around · Scroll to zoom · Press F for fullscreen
          </p>
        </div>
      )}

      {/* Orbit mode keyboard hint */}
      {viewMode === 'orbit' && showHint && (
        <div style={{
          position: 'absolute',
          bottom: 14,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 20,
          background: 'rgba(16,16,16,0.8)',
          border: '1px solid rgba(201,168,76,0.2)',
          borderRadius: 6,
          padding: '6px 16px',
          backdropFilter: 'blur(8px)',
          pointerEvents: 'none',
          opacity: showHint ? 1 : 0,
          transition: 'opacity 0.5s',
        }}>
          <p style={{ color: '#888', fontSize: 11, margin: 0, textAlign: 'center', whiteSpace: 'nowrap' }}>
            Drag to orbit · Scroll to zoom · Press F for fullscreen
          </p>
        </div>
      )}

      {/* Canvas wrapper — this is what gets fullscreened */}
      <div
        ref={canvasWrapRef}
        onClick={() => setShowHint(false)}
        style={{ width: '100%', height: '100%', position: 'relative', cursor: 'grab', minHeight: 480 }}
      >
        <Canvas
          camera={{ position: viewMode === 'interior' ? [0, 1.6, 1.2] : [6, 4, 6], fov: 45, near: 0.1, far: 500 }}
          dpr={[1, 2]}
          shadows
          gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
          style={{ background: '#0a0a0a' }}
        >
          <SceneContent url={modelUrl} viewMode={viewMode} onModelLoad={handleModelLoad} />
        </Canvas>
      </div>
    </div>
  )
}