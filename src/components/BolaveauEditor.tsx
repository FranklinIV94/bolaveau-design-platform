'use client'

import { useRef, useEffect, useCallback } from 'react'
import { Editor, type SidebarTab, ViewerToolbarLeft, ViewerToolbarRight } from '@pascal-app/editor'
import { useScene, type SceneGraph } from '@pascal-app/core'

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
// Built for Pascal Editor v0.8.0 schema requirements:
// - All positions are 3-tuples [x, y, z]
// - Zones use polygon (2D point arrays) instead of children
// - Items require full asset objects with id, thumbnail, src, dimensions
// - IDs must match type prefixes: wall_, door_, window_, zone_, item_, etc.
// - Sites use polygon for boundary, children are typed node unions
const S57_DEMO_PROJECT_ID = 'a88fd6c5-70ae-44a5-83a9-4151abff1582'

function getDemoScene(projectId: string): { nodes: Record<string, Record<string, unknown>>; rootNodeIds: string[] } | null {
  if (projectId !== S57_DEMO_PROJECT_ID) return null

  const pid = projectId

  const siteId = `site_${pid}`
  const buildingId = `building_${pid}`
  const groundFloorId = `level_ground_${pid}`
  const secondFloorId = `level_second_${pid}`

  // Zones — v0.8.0 uses polygon instead of children
  const receptionZoneId = `zone_reception_${pid}`
  const conferenceZoneId = `zone_conference_${pid}`
  const office1ZoneId = `zone_office1_${pid}`
  const breakRoomZoneId = `zone_breakroom_${pid}`

  // Walls — id must match wall_${string}
  const wallOuterId = `wall_outer_${pid}`
  const wallReceptionId = `wall_reception_${pid}`
  const wallConfId = `wall_conf_${pid}`
  const wallOffice1Id = `wall_office1_${pid}`

  // Columns, spawns, slabs
  const columnLobbyId = `column_lobby_${pid}`
  const spawnEntryId = `spawn_entry_${pid}`
  const slabGroundId = `slab_ground_${pid}`

  // Doors — id must match door_${string}
  const doorMainId = `door_main_${pid}`
  const doorConfId = `door_conf_${pid}`
  const doorOffice1Id = `door_office1_${pid}`

  // Windows — id must match window_${string}
  const window1Id = `window_front1_${pid}`
  const window2Id = `window_front2_${pid}`
  const window3Id = `window_office_${pid}`

  // Items — id must match item_${string}
  const receptionDeskId = `item_reception_desk_${pid}`
  const conferenceTableId = `item_conf_table_${pid}`
  const officeDeskId = `item_office_desk_${pid}`
  const sofaId = `item_sofa_${pid}`
  const kitchenCounterId = `item_kitchen_counter_${pid}`

  const nodes: Record<string, Record<string, unknown>> = {}

  // Site — v0.8.0: polygon for boundary, children as typed node refs
  nodes[siteId] = {
    id: siteId,
    type: 'site',
    visible: true,
    metadata: { name: 'South Fifty Seven HQ' },
    polygon: {
      type: 'polygon',
      points: [[0, 0], [20, 0], [20, 15], [0, 15]],
    },
    children: [buildingId],
  }

  // Building — v0.8.0: children are level IDs
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

  // Ground Floor — v0.8.0: children includes zones, walls, items, etc.
  nodes[groundFloorId] = {
    id: groundFloorId,
    type: 'level',
    parentId: buildingId,
    visible: true,
    metadata: { name: 'Ground Floor' },
    children: [
      receptionZoneId, conferenceZoneId, office1ZoneId, breakRoomZoneId,
      wallOuterId, wallReceptionId, wallConfId, wallOffice1Id,
      columnLobbyId, spawnEntryId, slabGroundId,
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

  // Zones — v0.8.0 requires polygon (2D point array), not children
  nodes[receptionZoneId] = {
    id: receptionZoneId,
    type: 'zone',
    parentId: groundFloorId,
    visible: true,
    metadata: { name: 'Reception', area: 180 },
    name: 'Reception',
    polygon: [[0, 0], [5, 0], [5, 6], [0, 6]],
    color: '#c9a84c',
  }
  nodes[conferenceZoneId] = {
    id: conferenceZoneId,
    type: 'zone',
    parentId: groundFloorId,
    visible: true,
    metadata: { name: 'Conference Room', area: 280 },
    name: 'Conference Room',
    polygon: [[5, 0], [10, 0], [10, 8], [5, 8]],
    color: '#3b82f6',
  }
  nodes[office1ZoneId] = {
    id: office1ZoneId,
    type: 'zone',
    parentId: groundFloorId,
    visible: true,
    metadata: { name: 'Private Office', area: 150 },
    name: 'Private Office',
    polygon: [[0, 6], [5, 6], [5, 8], [0, 8]],
    color: '#22c55e',
  }
  nodes[breakRoomZoneId] = {
    id: breakRoomZoneId,
    type: 'zone',
    parentId: groundFloorId,
    visible: true,
    metadata: { name: 'Break Room / Kitchen', area: 200 },
    name: 'Break Room / Kitchen',
    polygon: [[10, 0], [15, 0], [15, 8], [10, 8]],
    color: '#f59e0b',
  }

  // Walls — v0.8.0: children are door/window/item IDs
  nodes[wallOuterId] = {
    id: wallOuterId,
    type: 'wall',
    parentId: groundFloorId,
    visible: true,
    metadata: {},
    children: [doorMainId, window1Id, window2Id],
    start: [0, 0],
    end: [15, 0],
    thickness: 0.2,
    height: 3.2,
    material: { preset: 'concrete' },
  }
  nodes[wallReceptionId] = {
    id: wallReceptionId,
    type: 'wall',
    parentId: groundFloorId,
    visible: true,
    metadata: {},
    children: [],
    start: [5, 0],
    end: [5, 6],
    thickness: 0.15,
    height: 3.2,
    material: { preset: 'drywall' },
  }
  nodes[wallConfId] = {
    id: wallConfId,
    type: 'wall',
    parentId: groundFloorId,
    visible: true,
    metadata: {},
    children: [doorConfId],
    start: [10, 0],
    end: [10, 8],
    thickness: 0.15,
    height: 3.2,
    material: { preset: 'drywall' },
  }
  nodes[wallOffice1Id] = {
    id: wallOffice1Id,
    type: 'wall',
    parentId: groundFloorId,
    visible: true,
    metadata: {},
    children: [doorOffice1Id, window3Id],
    start: [0, 6],
    end: [5, 6],
    thickness: 0.15,
    height: 3.2,
    material: { preset: 'glass' },
  }

  // Column — v0.8.0: position is 3-tuple
  nodes[columnLobbyId] = {
    id: columnLobbyId,
    type: 'column',
    parentId: groundFloorId,
    visible: true,
    metadata: { name: 'Lobby Column' },
    children: [],
    position: [7.5, 0, 4],
    profile: 'tapered',
    bottomRadius: 0.25,
    topRadius: 0.18,
    height: 3.2,
  }

  // Spawn — v0.8.0: position is 3-tuple
  nodes[spawnEntryId] = {
    id: spawnEntryId,
    type: 'spawn',
    parentId: groundFloorId,
    visible: true,
    metadata: { name: 'Entry Spawn' },
    children: [],
    position: [2.5, 0, 1.5],
    rotation: 0,
  }

  // Slab
  nodes[slabGroundId] = {
    id: slabGroundId,
    type: 'slab',
    parentId: groundFloorId,
    visible: true,
    metadata: { name: 'Ground Floor Slab' },
    children: [],
    polygon: [[0, 0], [15, 0], [15, 8], [0, 8]],
    thickness: 0.15,
    elevation: 0,
  }

  // Doors — v0.8.0: position is 3-tuple, doorType enum values
  nodes[doorMainId] = {
    id: doorMainId,
    type: 'door',
    parentId: groundFloorId,
    visible: true,
    metadata: {},
    children: [],
    position: [2.5, 0, 0],
    rotation: [0, 0, 0],
    width: 1.2,
    height: 2.4,
    doorType: 'hinged',
    swingDirection: 'right',
    swingAngle: 90,
    wallId: wallOuterId,
  }
  nodes[doorConfId] = {
    id: doorConfId,
    type: 'door',
    parentId: groundFloorId,
    visible: true,
    metadata: {},
    children: [],
    position: [10, 0, 2],
    rotation: [0, 0, 0],
    width: 1.0,
    height: 2.4,
    doorType: 'hinged',
    swingDirection: 'left',
    swingAngle: 90,
    wallId: wallConfId,
  }
  nodes[doorOffice1Id] = {
    id: doorOffice1Id,
    type: 'door',
    parentId: groundFloorId,
    visible: true,
    metadata: {},
    children: [],
    position: [3, 0, 6],
    rotation: [0, 0, 0],
    width: 0.9,
    height: 2.4,
    doorType: 'hinged',
    swingDirection: 'right',
    swingAngle: 90,
    wallId: wallOffice1Id,
  }

  // Windows — v0.8.0: position is 3-tuple, sill is boolean
  nodes[window1Id] = {
    id: window1Id,
    type: 'window',
    parentId: groundFloorId,
    visible: true,
    metadata: {},
    children: [],
    position: [7.5, 0, 0],
    rotation: [0, 0, 0],
    width: 2.0,
    height: 1.5,
    windowType: 'casement',
    sill: true,
    sillDepth: 0.15,
    sillThickness: 0.1,
    wallId: wallOuterId,
  }
  nodes[window2Id] = {
    id: window2Id,
    type: 'window',
    parentId: groundFloorId,
    visible: true,
    metadata: {},
    children: [],
    position: [12.5, 0, 0],
    rotation: [0, 0, 0],
    width: 2.0,
    height: 1.5,
    windowType: 'awning',
    sill: true,
    sillDepth: 0.15,
    sillThickness: 0.1,
    wallId: wallOuterId,
  }
  nodes[window3Id] = {
    id: window3Id,
    type: 'window',
    parentId: groundFloorId,
    visible: true,
    metadata: {},
    children: [],
    position: [1.5, 0, 6],
    rotation: [0, 0, 0],
    width: 1.5,
    height: 1.5,
    windowType: 'casement',
    sill: true,
    sillDepth: 0.15,
    sillThickness: 0.1,
    wallId: wallOffice1Id,
  }

  // Items — v0.8.0: full asset objects required, position/rotation as 3-tuples
  nodes[receptionDeskId] = {
    id: receptionDeskId,
    type: 'item',
    parentId: groundFloorId,
    visible: true,
    metadata: { name: 'Reception Desk', category: 'furniture' },
    children: [],
    position: [2.5, 0, 3],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    asset: {
      id: 'reception-desk-default',
      category: 'furniture',
      name: 'Reception Desk',
      thumbnail: '',
      src: '',
      dimensions: [1.2, 0.8, 0.6],
    },
  }
  nodes[conferenceTableId] = {
    id: conferenceTableId,
    type: 'item',
    parentId: groundFloorId,
    visible: true,
    metadata: { name: 'Conference Table', category: 'furniture' },
    children: [],
    position: [12.5, 0, 4],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    asset: {
      id: 'conference-table-default',
      category: 'furniture',
      name: 'Conference Table',
      thumbnail: '',
      src: '',
      dimensions: [3.0, 0.75, 1.2],
    },
  }
  nodes[officeDeskId] = {
    id: officeDeskId,
    type: 'item',
    parentId: groundFloorId,
    visible: true,
    metadata: { name: 'Office Desk', category: 'furniture' },
    children: [],
    position: [2.5, 0, 4.5],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    asset: {
      id: 'office-desk-default',
      category: 'furniture',
      name: 'Office Desk',
      thumbnail: '',
      src: '',
      dimensions: [1.5, 0.75, 0.7],
    },
  }
  nodes[sofaId] = {
    id: sofaId,
    type: 'item',
    parentId: groundFloorId,
    visible: true,
    metadata: { name: 'Waiting Sofa', category: 'furniture' },
    children: [],
    position: [4, 0, 1.5],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    asset: {
      id: 'sofa-default',
      category: 'furniture',
      name: 'Waiting Sofa',
      thumbnail: '',
      src: '',
      dimensions: [2.0, 0.8, 0.9],
    },
  }
  nodes[kitchenCounterId] = {
    id: kitchenCounterId,
    type: 'item',
    parentId: groundFloorId,
    visible: true,
    metadata: { name: 'Kitchen Counter', category: 'appliance' },
    children: [],
    position: [13.5, 0, 1],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    asset: {
      id: 'kitchen-counter-default',
      category: 'appliance',
      name: 'Kitchen Counter',
      thumbnail: '',
      src: '',
      dimensions: [2.4, 0.9, 0.6],
    },
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
      } catch { /* fall through to demo/default */ }
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
      id: siteId,
      type: 'site',
      visible: true,
      metadata: {},
      polygon: {
        type: 'polygon',
        points: [[0, 0], [20, 0], [20, 15], [0, 15]],
      },
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

    return () => { clearScene() }
  }, [projectId, setScene, clearScene])

  return null
}

function SceneAutoSaver({ projectId }: { projectId: string }) {
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  useEffect(() => {
    let lastSnapshot = JSON.stringify(useScene.getState().nodes)

    const unsubscribe = useScene.subscribe((state) => {
      const currentSnapshot = JSON.stringify(state.nodes)
      if (currentSnapshot === lastSnapshot) return
      lastSnapshot = currentSnapshot

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = setTimeout(() => {
        const { nodes, rootNodeIds } = useScene.getState()
        const scene: SceneGraph = { nodes, rootNodeIds }
        const storageKey = `pascal-editor-scene:${projectId}`
        try {
          localStorage.setItem(storageKey, JSON.stringify(scene))
        } catch { /* swallow quota errors */ }
      }, 1000)
    })

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      unsubscribe()
    }
  }, [projectId])

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