'use client'

import { useRef, useEffect, useCallback, type ReactNode } from 'react'
import { Editor, type SidebarTab, ViewerToolbarLeft, ViewerToolbarRight, useAutoSave, type SceneGraph } from '@pascal-app/editor'
import { useScene } from '@pascal-app/core'

interface BolaveauEditorProps {
  projectId: string
}

const SIDEBAR_TABS: (SidebarTab & { component: React.ComponentType })[] = [
  { id: 'site', label: 'Scene', component: () => null },
  { id: 'structure', label: 'Structure', component: () => null },
  { id: 'furnish', label: 'Furnish', component: () => null },
  { id: 'zones', label: 'Zones', component: () => null },
]

// Demo scene for the South Fifty Seven HQ Renovation project
// Pre-populated so users can explore all editor features
const S57_DEMO_PROJECT_ID = 'a88fd6c5-70ae-44a5-83a9-4151abff1582'

function getDemoScene(projectId: string): { nodes: Record<string, Record<string, unknown>>; rootNodeIds: string[] } | null {
  // Only pre-populate the S57 demo project
  if (projectId !== S57_DEMO_PROJECT_ID) return null

  const siteId = `site_${projectId}`
  const buildingId = `building_${projectId}`
  const groundFloorId = `level_ground_${projectId}`
  const secondFloorId = `level_second_${projectId}`

  // Ground floor rooms
  const receptionZoneId = `zone_reception_${projectId}`
  const conferenceZoneId = `zone_conference_${projectId}`
  const office1ZoneId = `zone_office1_${projectId}`
  const breakRoomZoneId = `zone_breakroom_${projectId}`

  // Walls
  const wallOuterId = `wall_outer_${projectId}`
  const wallReceptionId = `wall_reception_${projectId}`
  const wallConfId = `wall_conf_${projectId}`
  const wallOffice1Id = `wall_office1_${projectId}`

  // Doors
  const doorMainId = `door_main_${projectId}`
  const doorConfId = `door_conf_${projectId}`
  const doorOffice1Id = `door_office1_${projectId}`

  // Windows
  const window1Id = `window1_${projectId}`
  const window2Id = `window2_${projectId}`
  const window3Id = `window3_${projectId}`

  // Furniture
  const receptionDeskId = `item_reception_desk_${projectId}`
  const conferenceTableId = `item_conf_table_${projectId}`
  const officeDeskId = `item_office_desk_${projectId}`
  const sofaId = `item_sofa_${projectId}`
  const kitchenCounterId = `item_kitchen_counter_${projectId}`

  const nodes: Record<string, Record<string, unknown>> = {}

  nodes[siteId] = {
    id: siteId,
    type: 'site',
    visible: true,
    metadata: { name: 'South Fifty Seven HQ' },
    children: [buildingId],
  }

  nodes[buildingId] = {
    id: buildingId,
    type: 'building',
    parentId: siteId,
    visible: true,
    metadata: { name: 'HQ Building' },
    children: [groundFloorId, secondFloorId],
    position: [0, 0, 0],
    rotation: [0, 0, 0],
  }

  nodes[groundFloorId] = {
    id: groundFloorId,
    type: 'level',
    parentId: buildingId,
    visible: true,
    metadata: { name: 'Ground Floor' },
    children: [
      receptionZoneId, conferenceZoneId, office1ZoneId, breakRoomZoneId,
      wallOuterId, wallReceptionId, wallConfId, wallOffice1Id,
      doorMainId, doorConfId, doorOffice1Id,
      window1Id, window2Id, window3Id,
      receptionDeskId, conferenceTableId, officeDeskId, sofaId, kitchenCounterId,
    ],
    elevation: 0,
    height: 3.2,
    level: 0,
    name: 'Ground Floor',
  }

  nodes[secondFloorId] = {
    id: secondFloorId,
    type: 'level',
    parentId: buildingId,
    visible: true,
    metadata: { name: 'Second Floor' },
    children: [],
    elevation: 3.2,
    height: 3.2,
    level: 1,
    name: 'Second Floor',
  }

  // Zones
  nodes[receptionZoneId] = {
    id: receptionZoneId,
    type: 'zone',
    parentId: groundFloorId,
    visible: true,
    metadata: { name: 'Reception', area: 180 },
    children: [receptionDeskId, sofaId],
    name: 'Reception',
    color: '#c9a84c',
  }

  nodes[conferenceZoneId] = {
    id: conferenceZoneId,
    type: 'zone',
    parentId: groundFloorId,
    visible: true,
    metadata: { name: 'Conference Room', area: 280 },
    children: [conferenceTableId],
    name: 'Conference Room',
    color: '#3b82f6',
  }

  nodes[office1ZoneId] = {
    id: office1ZoneId,
    type: 'zone',
    parentId: groundFloorId,
    visible: true,
    metadata: { name: 'Private Office', area: 150 },
    children: [officeDeskId],
    name: 'Private Office',
    color: '#22c55e',
  }

  nodes[breakRoomZoneId] = {
    id: breakRoomZoneId,
    type: 'zone',
    parentId: groundFloorId,
    visible: true,
    metadata: { name: 'Break Room / Kitchen', area: 200 },
    children: [kitchenCounterId],
    name: 'Break Room / Kitchen',
    color: '#f59e0b',
  }

  // Walls
  nodes[wallOuterId] = {
    id: wallOuterId,
    type: 'wall',
    parentId: groundFloorId,
    visible: true,
    metadata: {},
    children: [],
    start: [0, 0],
    end: [15, 0],
    thickness: 0.2,
    height: 3.2,
    material: 'concrete',
  }

  nodes[wallReceptionId] = {
    id: wallReceptionId,
    type: 'wall',
    parentId: groundFloorId,
    visible: true,
    metadata: {},
    children: [],
    start: [5, 0],
    end: [5, 8],
    thickness: 0.15,
    height: 3.2,
    material: 'drywall',
  }

  nodes[wallConfId] = {
    id: wallConfId,
    type: 'wall',
    parentId: groundFloorId,
    visible: true,
    metadata: {},
    children: [],
    start: [10, 0],
    end: [10, 8],
    thickness: 0.15,
    height: 3.2,
    material: 'drywall',
  }

  nodes[wallOffice1Id] = {
    id: wallOffice1Id,
    type: 'wall',
    parentId: groundFloorId,
    visible: true,
    metadata: {},
    children: [],
    start: [0, 6],
    end: [5, 6],
    thickness: 0.15,
    height: 3.2,
    material: 'glass',
  }

  // Doors
  nodes[doorMainId] = {
    id: doorMainId,
    type: 'door',
    parentId: groundFloorId,
    visible: true,
    metadata: {},
    children: [],
    position: [2.5, 0],
    width: 1.2,
    height: 2.4,
    swing: 'inward',
    wallId: wallOuterId,
  }

  nodes[doorConfId] = {
    id: doorConfId,
    type: 'door',
    parentId: groundFloorId,
    visible: true,
    metadata: {},
    children: [],
    position: [10, 2],
    width: 1.0,
    height: 2.4,
    swing: 'inward',
    wallId: wallConfId,
  }

  nodes[doorOffice1Id] = {
    id: doorOffice1Id,
    type: 'door',
    parentId: groundFloorId,
    visible: true,
    metadata: {},
    children: [],
    position: [3, 6],
    width: 0.9,
    height: 2.4,
    swing: 'inward',
    wallId: wallOffice1Id,
  }

  // Windows
  nodes[window1Id] = {
    id: window1Id,
    type: 'window',
    parentId: groundFloorId,
    visible: true,
    metadata: {},
    children: [],
    position: [7.5, 0],
    width: 2.0,
    height: 1.5,
    sill: 0.9,
    wallId: wallOuterId,
  }

  nodes[window2Id] = {
    id: window2Id,
    type: 'window',
    parentId: groundFloorId,
    visible: true,
    metadata: {},
    children: [],
    position: [12.5, 0],
    width: 2.0,
    height: 1.5,
    sill: 0.9,
    wallId: wallOuterId,
  }

  nodes[window3Id] = {
    id: window3Id,
    type: 'window',
    parentId: groundFloorId,
    visible: true,
    metadata: {},
    children: [],
    position: [1.5, 6],
    width: 1.5,
    height: 1.5,
    sill: 0.9,
    wallId: wallOffice1Id,
  }

  // Furniture / Items
  nodes[receptionDeskId] = {
    id: receptionDeskId,
    type: 'item',
    parentId: groundFloorId,
    visible: true,
    metadata: { name: 'Reception Desk', category: 'furniture' },
    children: [],
    position: [2.5, 3],
    rotation: 0,
    asset: { category: 'furniture', name: 'Reception Desk' },
  }

  nodes[conferenceTableId] = {
    id: conferenceTableId,
    type: 'item',
    parentId: groundFloorId,
    visible: true,
    metadata: { name: 'Conference Table', category: 'furniture' },
    children: [],
    position: [12.5, 4],
    rotation: 0,
    asset: { category: 'furniture', name: 'Conference Table' },
  }

  nodes[officeDeskId] = {
    id: officeDeskId,
    type: 'item',
    parentId: groundFloorId,
    visible: true,
    metadata: { name: 'Office Desk', category: 'furniture' },
    children: [],
    position: [2.5, 4.5],
    rotation: 0,
    asset: { category: 'furniture', name: 'Office Desk' },
  }

  nodes[sofaId] = {
    id: sofaId,
    type: 'item',
    parentId: groundFloorId,
    visible: true,
    metadata: { name: 'Waiting Sofa', category: 'furniture' },
    children: [],
    position: [4, 1.5],
    rotation: 0,
    asset: { category: 'furniture', name: 'Waiting Sofa' },
  }

  nodes[kitchenCounterId] = {
    id: kitchenCounterId,
    type: 'item',
    parentId: groundFloorId,
    visible: true,
    metadata: { name: 'Kitchen Counter', category: 'appliance' },
    children: [],
    position: [13.5, 1],
    rotation: 0,
    asset: { category: 'appliance', name: 'Kitchen Counter' },
  }

  return { nodes, rootNodeIds: [siteId] }
}

function SceneInitializer({ projectId }: { projectId: string }) {
  const initialized = useRef(false)
  const { setScene, clearScene } = useScene()

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    // Check localStorage for saved scene first
    const storageKey = `pascal-editor-scene:${projectId}`
    const savedScene = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null

    if (savedScene) {
      try {
        const scene = JSON.parse(savedScene)
        if (scene.nodes && Object.keys(scene.nodes).length > 0) {
          setScene(scene.nodes, scene.rootNodeIds || [])
          return
        }
      } catch {}
    }

    // Check for demo scene
    const demo = getDemoScene(projectId)
    if (demo) {
      setScene(demo.nodes, demo.rootNodeIds)
      return
    }

    // Default: empty scene with building structure
    const siteId = `site_${projectId}`
    const buildingId = `building_${projectId}`
    const levelId = `level_${projectId}`

    const nodes: Record<string, Record<string, unknown>> = {}
    nodes[siteId] = {
      id: siteId, type: 'site', visible: true, metadata: {}, children: [buildingId],
    }
    nodes[buildingId] = {
      id: buildingId, type: 'building', parentId: siteId, visible: true, metadata: {},
      children: [levelId], position: [0, 0, 0], rotation: [0, 0, 0],
    }
    nodes[levelId] = {
      id: levelId, type: 'level', parentId: buildingId, visible: true, metadata: {},
      children: [], elevation: 0, height: 3, name: 'Ground Floor',
    }

    setScene(nodes, [siteId])

    return () => {
      clearScene()
    }
  }, [projectId, setScene, clearScene])

  return null
}

function SceneAutoSaver({ projectId }: { projectId: string }) {
  const handleSave = useCallback(async (scene: SceneGraph) => {
    // Save to localStorage (scoped by project)
    const storageKey = `pascal-editor-scene:${projectId}`
    try {
      localStorage.setItem(storageKey, JSON.stringify(scene))
    } catch {}
  }, [projectId])

  useAutoSave({ onSave: handleSave })

  return null
}

export default function BolaveauEditor({ projectId }: BolaveauEditorProps) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0a0a' }}>
      <SceneInitializer projectId={projectId} />
      <SceneAutoSaver projectId={projectId} />
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