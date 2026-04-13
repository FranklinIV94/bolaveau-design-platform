'use client'

import { useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'
import * as THREE from 'three'
import { Viewer } from '@pascal-app/viewer'
import BolaveauViewer from '@/components/BolaveauViewer'

function LoadingScreen() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: '#0a0a0a',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 64,
          height: 64,
          border: '4px solid #c9a84c',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px',
        }} />
        <p style={{ color: '#c9a84c', fontSize: 18, fontWeight: 500 }}>Loading Bolaveau Studio</p>
        <p style={{ color: '#666', fontSize: 13, marginTop: 4 }}>Preparing your workspace</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}

function SampleScene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 15, 10]} intensity={1.2} castShadow />
      <directionalLight position={[-8, 10, -8]} intensity={0.3} />
      <Grid
        args={[40, 40]}
        position={[0, -0.01, 0]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#333"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#444"
        fadeDistance={50}
        fadeStrength={1}
        followCamera={false}
      />
      <Viewer />
      <BolaveauViewer />
    </>
  )
}

export default function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <LoadingScreen />

  return (
    <div style={{
      background: '#0a0a0a',
      height: '100vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        height: 52,
        background: '#1a1a1a',
        borderBottom: '1px solid rgba(201,168,76,0.2)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 16,
        flexShrink: 0,
      }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 6,
          background: '#c9a84c',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: 16,
          color: '#1a1a1a',
          flexShrink: 0,
        }}>
          B
        </div>
        <div>
          <div style={{ color: '#fff', fontWeight: 600, fontSize: 15, letterSpacing: 0.5 }}>
            BOLAVEAU
          </div>
          <div style={{ color: '#666', fontSize: 10, letterSpacing: 1 }}>
            DESIGN STUDIO
          </div>
        </div>
        <div style={{
          marginLeft: 24,
          background: 'rgba(201, 168, 76, 0.1)',
          border: '1px solid rgba(201, 168, 76, 0.25)',
          borderRadius: 5,
          padding: '4px 12px',
          color: '#c9a84c',
          fontSize: 11,
          fontWeight: 500,
        }}>
          DEMO PROJECT — SAMPLE INTERIOR
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ color: '#555', fontSize: 12 }}>
          3D Design Visualization Platform
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        <Canvas
          camera={{ position: [15, 12, 15], fov: 50 }}
          dpr={[1, 1.5]}
          shadows
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 0.9,
          }}
        >
          <SampleScene />
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minDistance={3}
            maxDistance={100}
            maxPolarAngle={Math.PI / 2 - 0.05}
          />
        </Canvas>
      </div>

      <div style={{
        position: 'absolute',
        bottom: 12,
        right: 16,
        background: 'rgba(26,26,26,0.85)',
        border: '1px solid rgba(201,168,76,0.2)',
        borderRadius: 6,
        padding: '8px 14px',
        color: '#666',
        fontSize: 11,
        zIndex: 10,
        pointerEvents: 'none',
      }}>
        Powered by Pascal Editor · Bolaveau Design Platform
      </div>
    </div>
  )
}
