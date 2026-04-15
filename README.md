# Bolaveau Design Platform

A Next.js 14+ platform for Bolaveau Group to host and view 3D models of their interior design/construction projects.

## Features

- **Auth**: NextAuth v4 + Supabase credentials-based auth
- **Role-based access**: ADMIN (upload/manage) and CLIENT (view only)
- **Project Management**: Create, edit, delete projects with status tracking
- **3D Model Hosting**: Upload .glb/.gltf files per project
- **Real 3D Viewer**: GLTF model loader with React Three Fiber + Drei

## Tech Stack

- Next.js 15 (App Router)
- React Three Fiber + Drei (3D visualization)
- NextAuth v4 (authentication)
- Supabase (database + storage)
- TypeScript

## Setup

### 1. Database Setup

Go to your Supabase project dashboard → **SQL Editor** and run the contents of `supabase-setup.sql`:

```sql
-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  address VARCHAR(500) DEFAULT '',
  status VARCHAR(50) DEFAULT 'planning',
  client_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create models table
CREATE TABLE IF NOT EXISTS models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  filename VARCHAR(500) NOT NULL,
  storage_path VARCHAR(1000) NOT NULL,
  file_size BIGINT DEFAULT 0,
  uploaded_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (optional - app handles auth)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;

-- Insert admin user (password: bolaveau2026)
INSERT INTO admin_users (email, password_hash, name, role, is_active)
VALUES ('admin@bolaveau.com', 'bolaveau2026', 'Bolaveau Admin', 'ADMIN', true)
ON CONFLICT (email) DO NOTHING;

-- Insert sample project
INSERT INTO projects (name, description, address, status)
VALUES ('Sunset Villa Renovation', 'Complete interior redesign of a 4-bedroom villa.', '1234 Ocean Drive, Miami Beach, FL 33139', 'in-progress');
```

### 2. Environment Variables

Create `.env.local` (already created, or copy from `.env.local.example`):

```
NEXTAUTH_SECRET=bolaveau-dev-secret-2026
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://wtbrdvplrhbarrqrvoag.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

### 5. Login

- **Email**: admin@bolaveau.com
- **Password**: bolaveau2026

## Routes

| Route | Description |
|-------|-------------|
| `/` | Redirects to signin or dashboard |
| `/auth/signin` | Sign in page |
| `/projects` | Client project list (authenticated) |
| `/projects/[id]` | Project detail with 3D viewer |
| `/admin/projects` | Admin project management |

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/    # NextAuth handler
│   │   ├── models/                # Model CRUD
│   │   ├── models/upload/         # File upload
│   │   ├── models/file/           # File serving
│   │   └── projects/             # Project CRUD
│   ├── auth/signin/              # Sign in page
│   ├── admin/projects/           # Admin dashboard
│   └── projects/[id]/           # Project viewer
├── components/
│   ├── AuthProvider.tsx          # NextAuth session provider
│   ├── Header.tsx                 # Bolaveau branding header
│   ├── Footer.tsx                 # Footer
│   └── ModelViewer.tsx            # Real GLTF 3D viewer
└── lib/
    ├── supabase.ts                # Supabase client
    └── supabase-admin.ts          # Admin client
```

## 3D Model Upload

- Accepts `.glb` and `.gltf` files only
- Max file size: 50MB
- Stored in Supabase Storage bucket `3d-models`
- Drag & drop upload on project detail page (admin only)
- Latest model auto-loads in the 3D viewer

## Colors

| Token | Value | Use |
|-------|-------|-----|
| Gold | `#c9a84c` | Primary accent |
| Dark | `#1a1a1a` | Cards, header |
| Background | `#0a0a0a` | Page background |

## Build

```bash
npm run build   # Clean production build ✓
npm run dev     # Development server
```