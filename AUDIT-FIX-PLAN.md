# Bolaveau Design Platform — Audit Fix Plan

Source: Claude Audit Report (April 27, 2026)
Priority: Critical → High → Medium → Low

---

## 🔴 CRITICAL — Fix Now

### 1. Scene persistence API broken (500 error)
- **Status:** API route exists but `scene_data` column missing from projects table
- **Fix:** Add `scene_data JSONB` + `scene_updated_at TIMESTAMPTZ` to projects table
- **Action:** Supabase migration + update API route to handle missing column gracefully

### 2. RLS/tenant isolation not enforced
- **Status:** `entity_id` and `created_by` not stamped on inserts, no RLS policies
- **Fix:** Add entity_id to all tables, stamp created_by = auth.uid(), write RLS policies
- **Action:** Supabase migration + API route updates

### 3. Hardcoded admin credentials in production
- **Status:** admin@bolaveau.com / bolaveau2026 is live on a public URL
- **Fix:** Rotate password to 24+ char random, enable MFA, remove from all prompts/docs

### 4. No rate limiting on auth
- **Fix:** Add Vercel Edge Middleware rate limiting on /api/auth/*

### 5. Missing HTTP security headers
- **Fix:** Add next.config.js headers() with CSP, HSTS, X-Frame-Options, etc.

## 🟠 HIGH — Fix This Week

### 6. Bookkeeping status says "Live" on About page
- **Status:** ALREADY FIXED in v5 — changed to "Shell"

### 7. Guide link 404s
- **Fix:** Create /guide route or link to About page instead

### 9. No error tracking
- **Fix:** Add Sentry (@sentry/nextjs) with sourcemaps

### 11. Accessibility — buttons have no aria-labels
- **Fix:** Add aria-label to all icon-only buttons

## 🟡 MEDIUM — Fix Next Sprint

### 12. Soft-delete vs hard-delete
- **Fix:** Add deleted_at columns, audit_log table

### 14-15. Bundle weight + Iconify dependency
- **Fix:** Tree-shake Three.js, bundle icons at build time

### 17. Undo/Redo discoverability
- **Status:** ALREADY FIXED — UndoRedoButtons component added

### 24. Reconsider 4-deployment architecture
- **Recommendation:** Use 1 Supabase project with logical schemas, not 4 instances
- **Action:** Update proposal v5 to reflect this

## 🟢 LOW — Backlog

- created_by null on seed data (backfill)
- JWT session lifetime (reduce to 7 days)
- About page typos (already fixed andDocuSign)
- Favicon sizes (add apple-touch-icon, 192/512)
- Disable NextAuth debug in production