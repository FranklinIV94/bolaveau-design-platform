'use client'

import { useEffect, useRef } from 'react'
import { useScene } from '@pascal-app/core'

function SceneInitializer() {
  const initialized = useRef(false)
  const { setScene } = useScene()

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    // Initialize a sample building scene: site → building → level → walls + slab
    const siteId = 'site_bolaveau'
    const buildingId = 'building_bolaveau'
    const levelId = 'level_bolaveau'

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
      children: ['slab_floor', 'wall_north', 'wall_south', 'wall_east', 'wall_west', 'wall_divider'],
      elevation: 0,
      height: 3,
      name: 'Ground Floor',
    }

    // Floor slab
    nodes['slab_floor'] = {
      id: 'slab_floor',
      type: 'slab',
      parentId: levelId,
      visible: true,
      metadata: {},
      children: [],
      elevation: 0,
      height: 0.15,
      boundary: [
        [-8, -6], [8, -6], [8, 6], [-8, 6], [-8, -6]
      ],
    }

    // Outer walls
    nodes['wall_north'] = {
      id: 'wall_north',
      type: 'wall',
      parentId: levelId,
      visible: true,
      metadata: {},
      children: [],
      start: [-8, 6],
      end: [8, 6],
      height: 3,
      thickness: 0.15,
    }

    nodes['wall_south'] = {
      id: 'wall_south',
      type: 'wall',
      parentId: levelId,
      visible: true,
      metadata: {},
      children: [],
      start: [-8, -6],
      end: [8, -6],
      height: 3,
      thickness: 0.15,
    }

    nodes['wall_east'] = {
      id: 'wall_east',
      type: 'wall',
      parentId: levelId,
      visible: true,
      metadata: {},
      children: [],
      start: [8, -6],
      end: [8, 6],
      height: 3,
      thickness: 0.15,
    }

    nodes['wall_west'] = {
      id: 'wall_west',
      type: 'wall',
      parentId: levelId,
      visible: true,
      metadata: {},
      children: [],
      start: [-8, -6],
      end: [-8, 6],
      height: 3,
      thickness: 0.15,
    }

    // Interior partition wall
    nodes['wall_divider'] = {
      id: 'wall_divider',
      type: 'wall',
      parentId: levelId,
      visible: true,
      metadata: {},
      children: [],
      start: [-8, 0],
      end: [3, 0],
      height: 3,
      thickness: 0.12,
    }

    setScene(nodes, [siteId])
  }, [setScene])

  return null
}

export default function BolaveauViewer() {
  return <SceneInitializer />
}
