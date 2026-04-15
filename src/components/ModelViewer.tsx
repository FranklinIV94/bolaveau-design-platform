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

// ─── Mode types ──────────────────────────────────────────────────────────────
type ViewMode = 'orbit' | 'interior'

// ─── Model loader with auto-center ───────────────────────────────────────────
function GLTFModel({ url }: { url: string }) {
  const { scene } = useGLTF(url)

  const centerModel = useCallback(() => {
    const box = new THREE.Box3().setFromObject(scene)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)

    scene.position.sub(center)
    if (maxDim > 0) {
      const scale = 5 / maxDim
      scene.scale.setScalar(scale)
    }
    const newBox = new THREE.Box3().setFromObject(scene)
    const newY = newBox.getCenter(new THREE.Vector3()).y
    scene.position.y -= newY
  }, [scene])

  useEffect(() => { centerModel() }, [centerModel])

  return <primitive object={scene} />
}

// ─── Camera controller — snaps to presets ─────────────────────────────────────
function CameraController({ viewMode }: { viewMode: ViewMode }) {
  const { camera, controls } = useThree()

  useEffect(() => {
    if (viewMode === 'interior') {
      // Inside the model looking outward along +Z
      camera.position.set(0, 1.6, 1)
      camera.lookAt(0, 1.6, 50)
    } else {
      camera.position.set(6, 4, 6)
      camera.lookAt(0, 0, 0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode])

  return null
}

// ─── Scene with lighting + controls + environment ─────────────────────────────
function SceneContent({
  url,
  viewMode,
  onReset,
}: {
  url: string
  viewMode: ViewMode
  onReset: () => void
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
        <GLTFModel url={url} />
      </Suspense>

      {viewMode === 'orbit' ? (
        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          minDistance={1}
          maxDistance={150}
          maxPolarAngle={Math.PI / 2 - 0.02}
        />
      ) : (
        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          minDistance={0.1}
          maxDistance={5}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI - Math.PI / 4}
          target={[0, 1.6, 0]}
        />
      )}

      <GizmoHelper alignment="bottom-right" margin={[90, 90]}>
        <GizmoViewcube />
      </GizmoHelper>

      {/* Reset button — rendered as HTML overlay via portal div */}
      <mesh visible={false} onClick={onReset}>
        <boxGeometry args={[0.01, 0.01, 0.01]} />
      </mesh>
    </>
  )
}

// ─── Loading indicator ────────────────────────────────────────────────────────
function LoadingOverlay() {
  return (
    <div style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(10,10,10,0.7)',
      zIndex: 10,
      pointerEvents: 'none',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 40, height: 40,
          border: '3px solid rgba(201,168,76,0.2)',
          borderTopColor: '#c9a84c',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 10px',
        }} />
        <p style={{ color: '#c9a84c', fontSize: 13, fontWeight: 500 }}>Loading model…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}

// ─── Main export ─────────────────────────────────────────────────────────────
export default function ModelViewer({ modelUrl }: { modelUrl: string }) {
  const [viewMode, setViewMode] = useState<ViewMode>('orbit')
  const [loading, setLoading] = useState(true)
  const canvasRef = useRef<HTMLDivElement>(null)

  const handleModelLoad = useCallback(() => setLoading(false), [])
  const resetCamera = useCallback(() => {
    setViewMode('orbit')
  }, [])

  const toggleMode = useCallback(() => {
    setViewMode((prev) => (prev === 'orbit' ? 'interior' : 'orbit'))
  }, [])

  return (
    <div ref={canvasRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Mode toolbar */}
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
          onClick={() => setViewMode('orbit')}
          style={{
            background: viewMode === 'orbit' ? '#c9a84c' : 'transparent',
            color: viewMode === 'orbit' ? '#0a0a0a' : '#888',
            border: '1px solid ' + (viewMode === 'orbit' ? '#c9a84c' : 'rgba(201,168,76,0.2)'),
            borderRadius: 5,
            padding: '5px 14px',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          Orbit View
        </button>
        <button
          onClick={() => setViewMode('interior')}
          style={{
            background: viewMode === 'interior' ? '#c9a84c' : 'transparent',
            color: viewMode === 'interior' ? '#0a0a0a' : '#888',
            border: '1px solid ' + (viewMode === 'interior' ? '#c9a84c' : 'rgba(201,168,76,0.2)'),
            borderRadius: 5,
            padding: '5px 14px',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          Interior View
        </button>
      </div>

      {/* Interior mode hint */}
      {viewMode === 'interior' && (
        <div style={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 20,
          background: 'rgba(16,16,16,0.8)',
          border: '1px solid rgba(201,168,76,0.2)',
          borderRadius: 6,
          padding: '6px 16px',
          backdropFilter: 'blur(8px)',
          pointerEvents: 'none',
        }}>
          <p style={{ color: '#888', fontSize: 11, margin: 0, textAlign: 'center' }}>
            Inside the space — drag to look around · scroll to zoom
          </p>
        </div>
      )}

      <Suspense fallback={<LoadingOverlay />}>
        <Canvas
          camera={{ position: [6, 4, 6], fov: 45, near: 0.1, far: 500 }}
          dpr={[1, 2]}
          shadows
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.0,
          }}
          style={{ background: '#0a0a0a' }}
          onCreated={() => setLoading(false)}
        >
          <SceneContent
            url={modelUrl}
            viewMode={viewMode}
            onReset={resetCamera}
          />
        </Canvas>
      </Suspense>
    </div>
  )
}