# Bolaveau Design Platform — User Guide

**Version 1.0** | April 2026

---

## Welcome

Bolaveau Design Platform is a 3D architectural design and visualization tool built for interior designers, architects, and property developers. Create floor plans, furnish rooms, apply materials, and walk through your designs in real-time 3D — all from your browser.

**Requirements:** Chrome 113+, Edge 113+, or any WebGPU-enabled browser. Safari is not yet supported.

---

## Getting Started

### 1. Log In
Navigate to **bolaveau-design-platform.vercel.app** and sign in with your credentials. Contact your administrator for account access.

### 2. Projects Dashboard
After logging in, you'll see the **Projects** page — your home base for all designs.

| Action | How |
|--------|-----|
| Create a project | Click **+ New Project** → fill in name, address, description, status |
| Open a project | Click **View** on any project card |
| Edit project details | Click **Edit** on the project card |
| Delete a project | Click **Delete** (admin only) |
| Share a project | Click **Share** inside the project to copy the link |

**Project statuses:**
- 🟦 **Planning** — Early concept phase
- 🟨 **In Progress** — Active design work
- 🟩 **Completed** — Finalized design

---

## The Editor Interface

When you open a project, you enter the **3D Editor**. Here's the layout:

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Projects │ Project Name  │ Status │ Share │ + Upload Model  │  ← Info Bar
├─────────┬────────────────────────────────────────────┬─────────┤
│         │                                            │         │
│  SCENE  │                                            │ TOOLS   │
│  PANEL  │           3D VIEWPORT                      │ PANEL   │
│         │                                            │         │
│  Site   │     (Your design renders here)             │ View    │
│  Building│                                           │ Stack   │
│  Level 0│                                            │ Full Ht │
│  Zones  │                                            │ Rotate  │
│         │                                            │         │
│         │                                            │         │
├─────────┤                                            ├─────────┤
│         │                                            │         │
│ PROPS/  │                                            │ ITEM   │
│ MATERIAL│                                            │ CATALOG│
│ PANEL   │                                            │         │
│         ├────────────────────────────────────────────┤         │
│         │   DRAWING TOOLS (Wall, Door, Window, etc)  │         │
└─────────┴────────────────────────────────────────────┴─────────┘
```

### Left Sidebar — Scene Panel
The scene panel shows your project's hierarchy:

- **Site** — The top-level container (land, boundaries)
- **Building** — The structure containing floors/levels
- **Level** — Individual floors (Ground Floor, Level 1, etc.)
- **Zones** — Rooms/spaces within a level
- **Elements** — Walls, doors, windows, furniture placed on a level

Click any item to select it. Use the **▶** icon to expand/collapse.

### Right Sidebar — Tools & Catalog
- **Item Catalog** — Browse and place furniture, fixtures, and architectural elements
- **Materials** — Apply surface finishes (wood, marble, metal, fabric)
- **Properties** — View/edit dimensions, position, rotation of selected elements

### Top Toolbar
The info bar shows your project name, status, and action buttons:
- **Share** — Copy project URL to clipboard
- **+ Upload Model** — Upload .glb or .gltf 3D model files (admin only)

### Bottom Toolbar — Drawing Tools
Contextual tools appear based on your current mode:
- **Select** — Click to select, drag to move
- **Wall** — Draw walls by clicking start/end points
- **Door** — Place doors on existing walls
- **Window** — Place windows on existing walls
- **Stairs** — Add stair connections between levels
- **Item** — Place furniture from the catalog

---

## Core Workflows

### Drawing Walls

1. Select a **Level** in the scene panel (or create one)
2. Click the **Wall** tool in the bottom toolbar
3. Click on the grid to set the wall's start point
4. Click again to set the wall's end point
5. The wall appears with default dimensions — adjust in the properties panel
6. Continue drawing walls to form rooms

**Tip:** Walls snap to the grid for precision. Press **Shift** to disable snapping.

### Placing Doors & Windows

1. Select the **Door** or **Window** tool
2. Click on an existing wall to place the element
3. Drag to reposition along the wall
4. Use the properties panel to set dimensions (width, height, swing direction for doors)

### Adding Furniture & Items

1. Open the **Item Catalog** in the right sidebar
2. Browse categories or search for specific items
3. Click an item to select it, then click in the viewport to place
4. Use the move/rotate tools to adjust position

### Applying Materials

1. Select an element (wall, floor, furniture surface)
2. Open the **Materials** panel
3. Choose from 13 preset materials or customize:
   - **Color** — Base surface color
   - **Roughness** — Matte (1.0) to glossy (0.0)
   - **Metalness** — Non-metal (0.0) to full metal (1.0)
   - **Texture** — Apply image-based textures (wood grain, marble veins, etc.)

### Multi-Level Buildings

1. Select the **Building** in the scene panel
2. Click **+ Add Level** in the properties panel
3. Set the level's **elevation** (height above ground) and **floor-to-ceiling height**
4. Each level can have its own walls, zones, and furniture
5. Connect levels with **stairs** — they automatically create slab cutouts

### Walkthrough Mode

1. Click the **Walk** button (footsteps icon) in the top-right toolbar
2. Use **WASD** keys to move, **mouse** to look around
3. Press **Space** to jump, **Shift** to sprint
4. Press **Esc** to exit walkthrough and return to editor view

### Exporting Your Design

1. Click **Export** in the top-right toolbar
2. Choose format:
   - **GLB** — Full 3D model (textures embedded, viewable in any 3D viewer)
   - **Screenshot** — Capture the current viewport as a PNG image
3. GLB exports include all geometry, materials, and placed items

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `W` | Select tool |
| `L` | Wall tool |
| `D` | Door tool |
| `F` | Window tool |
| `Q` | Delete selected |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `Ctrl+D` | Duplicate selected |
| `G` | Toggle grid |
| `T` | Toggle top-down view |
| `Esc` | Deselect / Exit tool |
| `Space` | Walkthrough mode |

---

## Uploading 3D Models

Administrators can upload custom 3D models to any project:

1. Open a project and click **+ Upload Model** in the info bar
2. Select a `.glb` or `.gltf` file (max 50 MB)
3. The model uploads to Supabase Storage and appears in the project's model list
4. Click a model in the sidebar to place it in the scene

**Supported formats:** GLB (recommended), glTF 2.0
**Max file size:** 50 MB
**Recommended poly count:** Under 500K triangles for smooth performance

---

## Demo Projects

Two demo projects are pre-loaded for exploration:

### 🏢 South Fifty Seven — HQ Renovation
- **Status:** In Progress
- **Address:** 4500 Riverside Drive, Suite 200, Fort Lauderdale, FL 33312
- **Models:** Kitchen Living Room, Sample Building, Glam Velvet Sofa
- **Showcases:** Multi-level building, wall drawing, furniture layout, materials, walkthrough, export

### 🏠 Bolaveau Design Showroom
- **Status:** Planning
- **Address:** 1200 Las Olas Blvd, Fort Lauderdale, FL 33316
- **Showcases:** Material rendering, lighting design, spatial layout tools

Open either project to explore the full feature set. Draw walls, place furniture, apply materials, and walk through in 3D.

---

## Troubleshooting

### Black viewport / nothing renders
- **Cause:** WebGPU not supported or not enabled
- **Fix:** Use Chrome 113+ or Edge 113+. Enable `chrome://flags/#enable-unsafe-webgpu` if needed.
- **Fallback:** The platform shows a WebGPU compatibility check with instructions.

### Slow performance
- Large models (500K+ triangles) can reduce frame rates
- Close other browser tabs to free GPU memory
- Use the **Grid** toggle (G) to simplify the viewport when not drawing

### Model upload fails
- Max file size is 50 MB
- Only `.glb` and `.gltf` formats are supported
- Ensure you're logged in as an admin user

### Changes not saving
- The editor auto-saves when you switch tools or select different elements
- Check your network connection — saves require Supabase connectivity
- If issues persist, refresh the page

---

## Support

For questions, bug reports, or feature requests, contact:
- **Bolaveau Group:** support@bolaveau.com
- **South Fifty Seven:** info@southfiftyseven.com

---

*Bolaveau Design Platform v1.0 — Built with ❤️ by Prospyr Inc.*