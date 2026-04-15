'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment, GizmoHelper, GizmoViewcube, Grid, Center } from '@react-three/drei'
import { Suspense, useState, useCallback } from 'react'
import * as THREE from 'three'

function GLTFModel({ url }: { url: string }) {
  const { scene } = useGLTF(url)

  // Auto-center and scale the model
  const centered = useCallback(() => {
    const box = new THREE.Box3().setFromObject(scene)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)

    // Center the model
    scene.position.sub(center)

    // Scale to fit a reasonable view size (target ~5 units)
    if (maxDim > 0) {
      const scale = 5 / maxDim
      scene.scale.setScalar(scale)
    }

    // Recalculate after scaling
    const newBox = new THREE.Box3().setFromObject(scene)
    const newY = newBox.getCenter(new THREE.Vector3()).y
    scene.position.y -= newY // sit on ground plane
  }, [scene])

  // Run centering on load
  centered()

  return <primitive object={scene} />
}

function LoadingFallback() {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(10,10,10,0.8)',
      zIndex: 10,
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48,
          height: 48,
          border: '4px solid #c9a84c',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 12px',
        }} />
        <p style={{ color: '#c9a84c', fontSize: 14, fontWeight: 500 }}>Loading 3D Model</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}

function ErrorFallback() {
  return (
    <mesh>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#c9a84c" wireframe />
    </mesh>
  )
}

type ViewMode = 'perspective' | 'top' | 'front' | 'side'

function SceneWithModel({ url, viewMode, onResetCamera }: { url: string; viewMode: ViewMode; onResetCamera?: () => void }) {
  return (
    <>
      <Environment preset="city" />
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 15, 10]} intensity={1.2} castShadow />
      <directionalLight position={[-8, 10, -8]} intensity={0.3} />

      {/* Ground grid */}
      <Grid
        args={[30, 30]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#333"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#c9a84c"
        fadeDistance={30}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid
      />

      <Suspense fallback={<ErrorFallback />}>
        <GLTFModel url={url} />
      </Suspense>
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={1}
        maxDistance={150}
        maxPolarAngle={Math.PI / 2 - 0.02}
        makeDefault
      />
      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewcube />
      </GizmoHelper>
    </>
  )
}

export default function ModelViewer({ modelUrl }: { modelUrl: string }) {
  const [viewMode, setViewMode] = useState<ViewMode>('perspective')

  const cameraPositions: Record<ViewMode, [number, number, number]> = {
    perspective: [6, 4, 6],
    top: [0, 12, 0.01],
    front: [0, 2, 10],
    side: [10, 2, 0],
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Suspense fallback={<LoadingFallback />}>
        <Canvas
          camera={{ position: cameraPositions[viewMode], fov: 45, near: 0.1, far: 500 }}
          dpr={[1, 2]}
          shadows
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.0,
          }}
          style={{ background: '#0a0a0a' }}
        >
          <SceneWithModel url={modelUrl} viewMode={viewMode} />
        </Canvas>
      </Suspense>
    </div>
  )
}