'use client'

import { useEffect, useRef } from 'react'
import { Viewer } from '@pascal-app/viewer'
import { useScene } from '@pascal-app/core'

interface BolaveauViewerProps {
  projectId: string
}

function SceneInitializer({ projectId }: { projectId: string }) {
  const initialized = useRef(false)
  const { setScene, clearScene } = useScene()

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    // Initialize a default empty building scene for the project
    const siteId = `site_${projectId}`
    const buildingId = `building_${projectId}`
    const levelId = `level_${projectId}`

    const nodes: Record<string, Record<string, unknown>> = {}

    nodes[siteId] = {
      id: siteId,
      type: 'site',
      visible: true,
      metadata: {},
      children: [buildingId],
    }

    nodes[buildingId] = {
      id: buildingId,
      type: 'building',
      parentId: siteId,
      visible: true,
      metadata: {},
      children: [levelId],
      position: [0, 0, 0],
      rotation: [0, 0, 0],
    }

    nodes[levelId] = {
      id: levelId,
      type: 'level',
      parentId: buildingId,
      visible: true,
      metadata: {},
      children: [],
      elevation: 0,
      height: 3,
      name: 'Ground Floor',
    }

    setScene(nodes, [siteId])

    return () => {
      clearScene()
    }
  }, [projectId, setScene, clearScene])

  return null
}

export default function BolaveauViewer({ projectId }: BolaveauViewerProps) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0a0a' }}>
      <SceneInitializer projectId={projectId} />
      <Viewer>
        {/* Pascal Viewer handles all 3D rendering */}
      </Viewer>

      {/* Bolaveau branding overlay */}
      <div style={{
        position: 'absolute',
        bottom: 14,
        right: 14,
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        opacity: 0.4,
        pointerEvents: 'none',
      }}>
        <span style={{ color: '#c9a84c', fontSize: 10, fontWeight: 600, letterSpacing: 1 }}>
          POWERED BY PASCAL
        </span>
      </div>
    </div>
  )
}