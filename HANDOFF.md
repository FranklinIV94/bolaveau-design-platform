# Bolaveau Design Platform — UX Audit Handoff

## Product Vision

**Bolaveau Design Studio** is a premium 3D design visualization platform for construction and interior design clients. Architects and designers upload 3D model files (.glb/.gltf) to project workspaces; clients log in, explore the models in an interactive 3D viewer, and experience their designs before they're built.

**Feel:** Luxury, dark, professional — like a high-end design studio portal, not a generic SaaS app. Think Porsche Design meets architectural visualization. Gold accent (`#c9a84c`) against near-black backgrounds. Every interaction should feel considered, not functional.

**Brand:**
- Primary: `#c9a84c` (Bolaveau gold)
- Background: `#0a0a0a` (near-black)
- Card/Panel: `#1a1a1a` (dark charcoal)
- Text primary: `#fff`, secondary: `#888`, muted: `#666`
- Secondary accent: `#3b82f6` (planning blue), `#22c55e` (completed green)

---

## Tech Stack

- **Framework:** Next.js 15 (App Router, TypeScript)
- **3D rendering:** `@react-three/fiber` + `@react-three/drei` (Three.js)
- **Auth:** NextAuth.js v4, credentials provider
- **Database & Storage:** Supabase (PostgreSQL + Supabase Storage)
- **Deployment:** Vercel (`bolaveau-design-platform.vercel.app`)
- **Styling:** Inline styles + Tailwind CSS (globals.css defines base vars + Tailwind utilities)

**Fonts:** Geist Sans + Geist Mono (local WOFF2 files in `src/app/fonts/`)

**Environment vars (`.env.local`):**
```
NEXTAUTH_SECRET=bolaveau-dev-secret-2026
NEXTAUTH_URL=https://bolaveau-design-platform.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://fqaxmlqfskmwjqmhuzmq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...  (supabase-admin.ts uses this)
```

**Login credentials:**
- Admin: `admin@bolaveau.com` / `bolaveau2026` (role: admin)
- DB users table: `public.users` — id, email, name, role (admin/client), password_hash (bcrypt), is_active

---

## File Structure

```
src/
  app/
    page.tsx                     → Root redirect (→ /auth/signin or /admin/projects)
    layout.tsx                   → Root layout, fonts, AuthProvider
    globals.css                  → Tailwind base + CSS vars + utility classes
    auth/signin/page.tsx         → Sign-in page
    projects/
      page.tsx                    → Project list (client-facing, all projects)
      [id]/page.tsx              → Project detail + 3D viewer + model selector
    admin/projects/page.tsx      → Admin project management (create/edit/delete)
    api/
      auth/[...nextauth]/        → NextAuth handler
      models/                    → GET (list), POST (create record), /file (serve GLB)
      models/upload/             → POST (upload GLB to Supabase Storage)
      projects/                  → GET (list), POST (create), /[id] (GET/PUT/DELETE)
  components/
    Header.tsx                   → Nav bar with logo, links, user info, sign out
    Footer.tsx                   → Simple footer
    AuthProvider.tsx             → NextAuth SessionProvider wrapper
    ModelViewer.tsx              → 3D canvas, orbit/interior modes, viewcube, grid
    BolaveauViewer.tsx           → Legacy/dormant, not imported anywhere
  lib/
    supabase.ts                  → Browser Supabase client
    supabase-admin.ts            → Server-side Supabase with service role key
    supabase-server.ts           → Server-side Supabase for NextAuth adapter
  middleware.ts                   → Protects /admin/* routes for admin role only
```

---

## Pages & Flows

### 1. `/auth/signin`
**Current state:** Functional but minimal.
- Centered card on dark background
- Gold "B" logo mark, brand wordmark
- Email + password fields
- Error message display
- Post-login redirect: admin → `/admin/projects`, client → `/projects`

**Friction points:**
- No "remember me" option
- No password reset flow
- Error messages are plain text, not styled to feel premium
- No brand tagline or welcoming copy to reinforce luxury positioning

### 2. `/projects` (Project List)
**Current state:** Simple grid of project cards.
- Card per project: name, status badge, address, description
- Click → navigate to `/projects/[id]`
- Empty state: plain "No projects available yet" message
- No project thumbnails, no model previews, no filtering/sorting

**Friction points:**
- No visual preview of what's inside a project (no 3D thumbnail, no screenshot)
- All projects listed together — admin and client see the same list
- No way to sort by status or date
- Status badge alone doesn't communicate project progress

### 3. `/projects/[id]` (Project Detail + 3D Viewer) ⭐ PRIMARY FOCUS
**Current state:** The core experience.
- Top bar: project name, status, address, model selector dropdown
- **3D Viewer (takes most of the screen)** with two modes:
  - **Orbit View:** Gold accent grid, viewcube (bottom-right), orbit/zoom/pan, auto-centering on load
  - **Interior View:** Eye-level (1.6m) perspective inside the model, drag to look around, scroll to zoom
- Model switcher buttons at bottom of viewer (for multi-model projects)
- Admin upload dropzone (drag & drop .glb/.gltf)
- Models list below (clickable to switch)

**Friction points:**
- No fullscreen mode for the 3D viewer
- Loading state only shows spinner — no progress indication
- If model fails to load, silent fallback to wireframe box
- No model-level metadata (date uploaded, uploader) visible in the list
- No zoom presets or "fit to model" button
- Interior view hint text ("drag to look around") is subtle and easy to miss

### 4. `/admin/projects` (Admin Management)
**Current state:** CRUD interface for projects.
- List of all projects with edit/delete actions
- Inline form to create new project (name, description, address, status)
- Status selector per project
- No bulk actions, no model management here

**Friction points:**
- Form resets after each submission (no sticky values)
- No confirmation on delete
- No visual distinction between project cards in admin vs client view
- Edit mode replaces the card with a form — no modal or drawer

### 5. `/` (Loading Screen)
**Current state:** Spinner + "Loading Bolaveau Studio" text.
- This is fine as a transitional loading state.

---

## Design System (Current)

### Colors (CSS vars in globals.css)
| Token | Value | Use |
|---|---|---|
| `--bolaveau-gold` | `#c9a84c` | Primary accent, CTAs, active states |
| `--bolaveau-dark` | `#1a1a1a` | Cards, panels, header |
| `--background` | `#0a0a0a` | Page backgrounds |
| Gold transparent | `rgba(201,168,76,X)` | Borders, hover states |

### Typography
- **Geist Sans** (variable, 100–900 weight) — all body text
- **Geist Mono** — monospace contexts
- No Google Fonts or external font loading

### Spacing & Layout
- No consistent spacing system — values used: 4, 6, 8, 10, 12, 14, 16, 20, 24, 32px
- Cards: `border-radius: 6–8px`, `padding: 16–20px`
- No max-width container on project detail page (viewer fills width)
- Projects list: `maxWidth: 1200px, margin: 0 auto`

### Motion
- None currently — no transitions, no animations beyond the loading spinner
- Opportunity: hover states, page transitions, model loading animations

---

## Key Features Implemented

| Feature | Status | Notes |
|---|---|---|
| Email/password auth | ✅ | NextAuth credentials, bcrypt hash comparison |
| Admin role enforcement | ✅ | Middleware protects `/admin/*`, DB role check |
| Supabase Storage (3D files) | ✅ | `3d-models` bucket, public, path: `{projectId}/{filename}` |
| Supabase DB (projects, models, users) | ✅ | Full CRUD via `/api/*` routes |
| 3D model viewer (Three.js) | ✅ | `ModelViewer.tsx` — dynamic import, no SSR |
| Orbit mode | ✅ | Grid, viewcube, orbit/zoom/pan |
| Interior/exterior mode toggle | ✅ | Camera snaps to eye-level, constrained polar angles |
| Auto-center & scale models | ✅ | Box3 center + scale to 5-unit target on load |
| Multi-model selector | ✅ | Dropdown + button strip + clickable list items |
| Drag & drop upload | ✅ | Admin only, `.glb`/`.gltf` only, 50MB limit |
| Model serving via API | ✅ | `/api/models/file?path=` — proxy to Supabase Storage |
| Progress tracker | ✅ | Compact stepper on project detail (from portal, reused here) |
| Chat panel | ✅ | Email-based messaging (from portal, reused here) |

**Models in DB (current showcase set):**
- Test Project (`c1b53b79-...`) — 4 models: astronaut, Bolaveau sample, GlamVelvetSofa, SheenChair
- SheenChair Showcase (`bd3fa691-...`) — 1 model: SheenChair
- Glam Velvet Sofa (`c66b9efc-...`) — 1 model: GlamVelvetSofa
- Kitchen Living Room (`9e07992e-...`) — 1 model: custom generated kitchen/living room

---

## Known Bugs & Issues

1. **`>` in JSX style attributes** — the build fails if `>` appears in inline style expressions. Workaround: precompute values outside JSX (see `projects/[id]/page.tsx` `modelItems` pattern). Babel/JSX parser treats `>` inside curly braces as a JSX closing bracket, not a comparison operator.

2. **Vercel CLI token permissions** — `vcp_` and `vck_` tokens lack deploy permissions. Deployments are done via `npx vercel --prod` (interactive, requires approval signal) or rely on GitHub auto-deploy from master branch pushes.

3. **GitHub auto-deploy is slow** — takes ~60–90s from push to live production URL.

4. **Model loading fallback is silent** — if a GLB fails to parse, users see a wireframe box with no explanation.

5. **No fullscreen mode for 3D viewer** — this is a key friction point for the interior view experience.

---

## Credentials & Access

| Service | Credentials |
|---|---|
| Platform login | `admin@bolaveau.com` / `bolaveau2026` |
| Supabase Dashboard | `fqaxmlqfskmwjqmhuzmq.supabase.co` — project admin |
| Vercel Project | `bolaveau-design-platform`, team `team_iuWIBU1DQJlbahCMAYQ8I20h` |
| GitHub Repo | `FranklinIV94/bolaveau-design-platform` (master branch, auto-deploy) |
| Vercel CLI | Token `vcp_...` (limited — can't trigger via API) |

---

## What to Prioritize for the Audit

**This is a luxury design studio portal — the experience should feel like stepping into a high-end architectural firm's private client lounge, not logging into project management software.**

1. **Sign-in page** — first impression sets the tone. Currently feels like a utility form, not an invitation.

2. **3D viewer experience** — this is the centerpiece. Anything that makes it feel less immersive (loading states, no fullscreen, unclear controls) directly undermines the product's value. Interior view in particular should feel like stepping inside.

3. **Project list** — clients should feel excitement when they open this, not a flat spreadsheet. Visual previews (3D thumbnails or ambient images) could transform this.

4. **Micro-interactions & motion** — currently zero animation beyond a spinner. Adding subtle transitions, hover states, and polish would dramatically elevate the luxury feel.

5. **Empty states** — what does the client see when there are no models? It should still feel intentional and premium, not like "nothing here yet."

---

## Notes for Claude

- The project uses **inline styles throughout**, not Tailwind component classes. When editing existing pages, match the inline style pattern or the component will break.
- `ModelViewer` is a **dynamic import** (`dynamic(() => import(...), { ssr: false })`) — it cannot be imported at the top of a file.
- `>` in JSX attribute expressions causes parse errors — always precompute comparison results before the JSX return block.
- The 3D canvas uses `@react-three/fiber` + `@react-three/drei` — if adding new drei components, verify the package is installed (`npm list @react-three/drei`).
- Supabase Storage bucket `3d-models` is **public read** — GLB files are publicly accessible via the `/api/models/file` proxy or direct Storage URL.
- NextAuth session role check: `(session?.user as any)?.role?.toLowerCase() === 'admin'` — note `.toLowerCase()` is required because Supabase stores role as lowercase.