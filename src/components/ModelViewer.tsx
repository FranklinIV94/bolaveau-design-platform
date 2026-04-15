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

// ─── Model loader with auto-center + ceiling detection ───────────────────────
function GLTFModel({
  url,
  onLoad,
  onCenterCalculated,
  onSceneExtracted,
}: {
  url: string
  onLoad?: () => void
  onCenterCalculated?: (center: THREE.Vector3) => void
  onSceneExtracted?: (scene: THREE.Group) => void
}) {
  const { scene } = useGLTF(url)

  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)

    // Center at origin, scale so max dimension = 5 units
    scene.position.sub(center)
    if (maxDim > 0) scene.scale.setScalar(5 / maxDim)

    // Re-measure after scaling
    const newBox = new THREE.Box3().setFromObject(scene)
    const newCenter = newBox.getCenter(new THREE.Vector3())

    // Ground the model: shift so bounding-box center sits at y=0
    scene.position.y -= newCenter.y

    // Report the final geometric center
    const finalCenter = new THREE.Vector3()
    newBox.getCenter(finalCenter)
    onCenterCalculated?.(finalCenter)

    // Pass the scene to the parent so we can traverse it for ceiling toggle
    onSceneExtracted?.(scene)

    onLoad?.()
  }, [scene, onLoad, onCenterCalculated, onSceneExtracted])

  return <primitive object={scene} />
}

// ─── Camera + OrbitControls controller ───────────────────────────────────────
function CameraController({
  viewMode,
  modelCenter,
}: {
  viewMode: ViewMode
  modelCenter: THREE.Vector3 | null
}) {
  const { camera } = useThree()
  const orbitRef = useRef<any>(null)

  useEffect(() => {
    // Orbit: lower camera height for flat/room models → 30-45° angle, not bird's-eye
    // Interior: fixed eye-level preset
    const presets = {
      orbit: {
        // Lower Y so camera is ~30° above horizontal, not 40°+ down
        pos: new THREE.Vector3(7, 2.5, 7),
        // Clamp target Y to a mid-room height so camera looks INTO the room, not at the ceiling
        target: new THREE.Vector3(0, 1.0, 0),
      },
      interior: {
        pos: new THREE.Vector3(0, 2.2, 4.5),
        target: new THREE.Vector3(0, 1.6, 0),
      },
    }

    const p = presets[viewMode]

    // For orbit mode with a known model center: clamp the target Y to prevent
    // bird's-eye on flat/room models. Use a weighted blend so tall objects still center.
    let target = p.target.clone()
    if (viewMode === 'orbit' && modelCenter) {
      // Blend model center Y down toward a comfortable viewing height
      // 70% mid-room height + 30% actual center → works for rooms AND furniture
      target = new THREE.Vector3(
        modelCenter.x,
        modelCenter.y * 0.3 + 1.0 * 0.7,
        modelCenter.z
      )
    }

    const lerpFactor = viewMode === 'interior' ? 0.12 : 0.07

    const lerp = () => {
      camera.position.lerp(p.pos, lerpFactor)
      if (orbitRef.current) {
        orbitRef.current.target.lerp(target, lerpFactor)
        orbitRef.current.update()
      }
      if (camera.position.distanceTo(p.pos) > 0.01) {
        requestAnimationFrame(lerp)
      }
    }
    lerp()
    // Only re-run when mode changes — NOT on modelCenter updates
    // This prevents interior mode from jumping when the model finishes loading
  }, [viewMode, camera])

  return (
    <OrbitControls
      ref={orbitRef}
      enableDamping
      dampingFactor={0.08}
      minDistance={viewMode === 'interior' ? 0.1 : 1}
      maxDistance={viewMode === 'interior' ? 5 : 150}
      minPolarAngle={viewMode === 'interior' ? Math.PI / 4 : 0}
      maxPolarAngle={viewMode === 'interior' ? Math.PI - Math.PI / 4 : Math.PI / 2 - 0.02}
      target={
        viewMode === 'interior'
          ? [0, 1.6, 0]
          : modelCenter
            ? [
                modelCenter.x,
                modelCenter.y * 0.3 + 1.0 * 0.7, // same clamped Y in the prop too
                modelCenter.z,
              ]
            : [0, 1.0, 0]
      }
    />
  )
}

// ─── Scene content ─────────────────────────────────────────────────────────────
function SceneContent({
  url,
  viewMode,
  modelCenter,
  onModelLoad,
  onCenterCalculated,
  onSceneExtracted,
}: {
  url: string
  viewMode: ViewMode
  modelCenter: THREE.Vector3 | null
  onModelLoad: () => void
  onCenterCalculated?: (center: THREE.Vector3) => void
  onSceneExtracted?: (scene: THREE.Group) => void
}) {
  return (
    <>
      <CameraController viewMode={viewMode} modelCenter={modelCenter} />

      <Environment preset="city" />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 15, 10]} intensity={1.0} castShadow />
      <directionalLight position={[-8, 10, -8]} intensity={0.3} />

      <Suspense fallback={null}>
        <GLTFModel
          url={url}
          onLoad={onModelLoad}
          onCenterCalculated={onCenterCalculated}
          onSceneExtracted={onSceneExtracted}
        />
      </Suspense>

      <Grid
        args={[40, 40]}
        position={[0, 0, 0]}
        cellColor="rgba(201,168,76,0.15)"
        sectionColor="rgba(201,168,76,0.25)"
        cellSize={1}
        sectionSize={5}
        fadeDistance={30}
        fadeStrength={1.5}
        followCamera={false}
        infiniteGrid={true}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <shadowMaterial opacity={0.15} />
      </mesh>

      <hemisphereLight skyColor="#c9a84c" groundColor="#1a1a1a" intensity={0.15} />

      <GizmoHelper alignment="bottom-right" margin={[100, 100]}>
        <GizmoViewcube
          color="#c9a84c"
          hoverColor="#e0bc5c"
          opacity={0.9}
          labelColor="#c9a84c"
          labelSize={0.6}
          size={70}
        />
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
  const [modelCenter, setModelCenter] = useState<THREE.Vector3 | null>(null)
  const [cutaway, setCutaway] = useState(false)
  // Hidden ceiling meshes — stored so we can restore them when cutaway is off
  const [hiddenMeshes, setHiddenMeshes] = useState<THREE.Mesh[]>([])
  // The actual scene root — used for ceiling traversal
  const modelSceneRef = useRef<THREE.Group | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasWrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 3000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

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

  // ── Ceiling toggle ──────────────────────────────────────────────────────────
  const handleSceneExtracted = useCallback((scene: THREE.Group) => {
    modelSceneRef.current = scene

    if (!scene) return

    const box = new THREE.Box3().setFromObject(scene)
    const size = box.getSize(new THREE.Vector3())
    const maxY = box.max.y
    const midY = box.min.y + size.y * 0.75 // top 25% of bounding box

    const ceilingMeshes: THREE.Mesh[] = []

    scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return

      // Heuristic 1: mesh name contains ceiling/roof/top
      const name = child.name.toLowerCase()
      const isNamedCeiling = /ceiling|roof|top|shausche|cap|overside/.test(name)

      // Heuristic 2: mesh Y center is in the top 25% of the bounding box
      const meshBox = new THREE.Box3().setFromObject(child)
      const meshCenterY = meshBox.getCenter(new THREE.Vector3()).y
      const isHighMesh = meshCenterY >= midY

      // Heuristic 3: mesh is horizontal (wide and flat — likely a ceiling panel)
      const meshSize = meshBox.getSize(new THREE.Vector3())
      const isFlatHorizontal = meshSize.y < meshSize.x * 0.15 && meshSize.y < meshSize.z * 0.15

      if (isNamedCeiling || isHighMesh || isFlatHorizontal) {
        ceilingMeshes.push(child)
      }
    })

    setHiddenMeshes(ceilingMeshes)
  }, [])

  const toggleCutaway = useCallback(() => {
    const scene = modelSceneRef.current
    if (!scene || hiddenMeshes.length === 0) return

    if (!cutaway) {
      // Hide ceiling meshes
      hiddenMeshes.forEach((m) => { m.visible = false })
    } else {
      // Restore ceiling meshes
      hiddenMeshes.forEach((m) => { m.visible = true })
    }
    setCutaway((c) => !c)
  }, [cutaway, hiddenMeshes])

  const handleModelLoad = useCallback(() => setLoaded(true), [])

  const handleCenterCalculated = useCallback((center: THREE.Vector3) => {
    setModelCenter(center)
  }, [])

  const switchToMode = (mode: ViewMode) => {
    // Don't re-trigger the loading overlay when switching modes —
    // the model is already loaded. We only need to reposition the camera.
    if (mode !== viewMode) {
      setViewMode(mode)
    }
  }

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>

      {/* Fullscreen button */}
      <button
        onClick={() => toggleFullscreen(canvasWrapRef.current)}
        title="Toggle fullscreen (F)"
        style={{
          position: 'absolute', bottom: 14, left: 14, zIndex: 30,
          background: 'rgba(16,16,16,0.82)',
          border: '1px solid rgba(201,168,76,0.3)',
          borderRadius: 6, width: 34, height: 34,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: isFullscreen ? '#c9a84c' : '#888',
          transition: 'all 0.2s', backdropFilter: 'blur(8px)', padding: 0,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M1 5V1h4M9 1H13V5M13 9V13H9M5 13H1V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Mode toolbar */}
      <div style={{
        position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 6, zIndex: 20,
        background: 'rgba(16,16,16,0.85)',
        border: '1px solid rgba(201,168,76,0.25)',
        borderRadius: 8, padding: '5px 8px', backdropFilter: 'blur(10px)',
      }}>
        <button
          onClick={() => switchToMode('orbit')}
          style={{
            background: viewMode === 'orbit' ? '#c9a84c' : 'transparent',
            color: viewMode === 'orbit' ? '#0a0a0a' : '#888',
            border: '1px solid ' + (viewMode === 'orbit' ? '#c9a84c' : 'rgba(201,168,76,0.2)'),
            borderRadius: 5, padding: '5px 14px', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          Orbit
        </button>
        <button
          onClick={() => switchToMode('interior')}
          style={{
            background: viewMode === 'interior' ? '#c9a84c' : 'transparent',
            color: viewMode === 'interior' ? '#0a0a0a' : '#888',
            border: '1px solid ' + (viewMode === 'interior' ? '#c9a84c' : 'rgba(201,168,76,0.2)'),
            borderRadius: 5, padding: '5px 14px', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          Interior
        </button>
        {/* Cutaway / ceiling toggle */}
        <button
          onClick={toggleCutaway}
          title={cutaway ? 'Show ceiling' : 'Hide ceiling (cutaway view)'}
          style={{
            background: cutaway ? '#c9a84c' : 'transparent',
            color: cutaway ? '#0a0a0a' : '#888',
            border: '1px solid ' + (cutaway ? '#c9a84c' : 'rgba(201,168,76,0.2)'),
            borderRadius: 5, padding: '5px 14px', fontSize: 12, fontWeight: 600,
            cursor: hiddenMeshes.length === 0 ? 'not-allowed' : 'pointer',
            opacity: hiddenMeshes.length === 0 ? 0.4 : 1,
            transition: 'all 0.2s',
          }}
        >
          {cutaway ? 'Ceiling On' : 'Cutaway'}
        </button>
      </div>

      {/* Loading overlay */}
      {!loaded && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'rgba(10,10,10,0.85)', zIndex: 15, gap: 16,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 8,
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

      {/* Bottom hints */}
      {viewMode === 'interior' && (
        <div style={{
          position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
          zIndex: 20, background: 'rgba(16,16,16,0.8)',
          border: '1px solid rgba(201,168,76,0.2)', borderRadius: 6,
          padding: '6px 16px', backdropFilter: 'blur(8px)',
          pointerEvents: 'none', opacity: showHint ? 1 : 0, transition: 'opacity 0.5s',
        }}>
          <p style={{ color: '#888', fontSize: 11, margin: 0, textAlign: 'center', whiteSpace: 'nowrap' }}>
            Drag to look around · Scroll to zoom · Press F for fullscreen
          </p>
        </div>
      )}
      {viewMode === 'orbit' && showHint && (
        <div style={{
          position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
          zIndex: 20, background: 'rgba(16,16,16,0.8)',
          border: '1px solid rgba(201,168,76,0.2)', borderRadius: 6,
          padding: '6px 16px', backdropFilter: 'blur(8px)',
          pointerEvents: 'none', opacity: showHint ? 1 : 0, transition: 'opacity 0.5s',
        }}>
          <p style={{ color: '#888', fontSize: 11, margin: 0, textAlign: 'center', whiteSpace: 'nowrap' }}>
            Drag to orbit · Scroll to zoom · Press F for fullscreen
          </p>
        </div>
      )}

      {/* Canvas */}
      <div
        ref={canvasWrapRef}
        onClick={() => setShowHint(false)}
        style={{ width: '100%', height: '100%', position: 'relative', cursor: 'grab', minHeight: 480 }}
      >
        <Canvas
          camera={{ position: viewMode === 'interior' ? [0, 2.2, 4.5] : [7, 2.5, 7], fov: 45, near: 0.1, far: 500 }}
          dpr={[1, 2]}
          shadows
          gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
          style={{ background: '#0a0a0a' }}
        >
          <SceneContent
            url={modelUrl}
            viewMode={viewMode}
            modelCenter={modelCenter}
            onModelLoad={handleModelLoad}
            onCenterCalculated={handleCenterCalculated}
            onSceneExtracted={handleSceneExtracted}
          />
        </Canvas>
      </div>
    </div>
  )
}