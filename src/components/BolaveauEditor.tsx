'use client'

import { useRef, useEffect, useCallback, type ReactNode } from 'react'
import { Editor, type SidebarTab, ViewerToolbarLeft, ViewerToolbarRight } from '@pascal-app/editor'
import { useScene } from '@pascal-app/core'

interface BolaveauEditorProps {
  projectId: string
}

const SIDEBAR_TABS: (SidebarTab & { component: React.ComponentType })[] = [
  { id: 'site', label: 'Scene', component: () => null },
]

function SceneInitializer({ projectId }: { projectId: string }) {
  const initialized = useRef(false)
  const { setScene, clearScene } = useScene()

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

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

export default function BolaveauEditor({ projectId }: BolaveauEditorProps) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0a0a' }}>
      <SceneInitializer projectId={projectId} />
      <Editor
        layoutVersion="v2"
        projectId={projectId}
        sidebarTabs={SIDEBAR_TABS}
        viewerToolbarLeft={<ViewerToolbarLeft />}
        viewerToolbarRight={<ViewerToolbarRight />}
      />
    </div>
  )
}