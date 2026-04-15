# Bolaveau Design Platform — Security & Delivery Audit
**Audited:** April 15, 2026
**Status:** 🔴 Needs fixes before client delivery

---

## CRITICAL — Must Fix Before Launch

### 🔴 Auth brute-force / rate limiting
**File:** `src/app/api/auth/[...nextauth]/route.ts`
**Issue:** No rate limiting on `/api/auth`. An attacker can brute-force credentials unlimited times.
**Fix:** Add rate limiting middleware. Vercel has built-in rate limiting via `@upstash/ratelimit` or Next.js Edge Config. Or add a simple in-memory tracker.
**Priority:** P0 — exposed right now

---

### 🔴 Sensitive env vars in .env.local (not in Vercel)
**File:** `.env.local`
**Issue:**
- `NEXTAUTH_SECRET=bolaveau-dev-secret-2026` — weak, committed to repo
- `SUPABASE_SERVICE_ROLE_KEY=...` — committed to repo
- `NEXTAUTH_URL=http://localhost:3000` — wrong for production
**Fix:**
1. Move `NEXTAUTH_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXTAUTH_URL` → Vercel environment variables (Production → Settings → Environment Variables)
2. Generate a proper `NEXTAUTH_SECRET` (min 32 chars, `openssl rand -base64 32`)
3. Set `NEXTAUTH_URL=https://bolaveau-design-platform.vercel.app`
4. Delete from `.env.local`
**Priority:** P0 — secrets are in the repo

---

### 🔴 init route creates user with plaintext password
**File:** `src/app/api/init/route.ts`
**Issue:**
```ts
.from('admin_users')
.insert({
  email: 'admin@bolaveau.com',
  password_hash: 'bolaveau2026',  // ← plaintext
```
**Fix:** Use bcrypt to hash before insert:
```ts
import bcrypt from 'bcryptjs'
const hash = await bcrypt.hash('bolaveau2026', 12)
```
**Priority:** P0 — if this route ever runs against prod DB, bad

---

### 🔴 No auth check on model upload, file download, init, setup routes
**Files:**
- `src/app/api/models/upload/route.ts` — no auth check at all
- `src/app/api/models/file/route.ts` — no auth check at all
- `src/app/api/init/route.ts` — secret check only (not auth session)
- `src/app/api/setup/route.ts` — no auth, no secret
**Fix:** Add `getServerSession` or `getToken` guard to all routes. Or better — add a shared auth guard utility.
**Priority:** P0 — these endpoints are open to anyone with the URL

---

## HIGH — Fix Before Client Handoff

### 🟡 No pagination on list endpoints
**Files:** `src/app/api/projects/route.ts`, `src/app/api/models/route.ts`
**Issue:** `GET /api/projects` returns all projects. No `limit` / `offset`.
**Fix:** Add `?limit=20&offset=0` pagination params.
**Priority:** P1 — functional now but won't scale

---

### 🟡 console.error in production code
**Files:** `src/app/api/models/upload/route.ts`, `src/app/api/models/file/route.ts`
**Issue:** `console.error` statements log to Vercel function logs (server-side only, but still).
**Fix:** Replace with structured error tracking or remove. Vercel Log Drains can pipe these.
**Priority:** P2 — low risk but noisy in logs

---

### 🟡 bcrypt not imported in init route
**File:** `src/app/api/init/route.ts`
**Issue:** `bcrypt` is used in the auth route but imported in the init route.
**Fix:** Add `import bcrypt from 'bcryptjs'` to init route (needed for the P0 fix above).
**Priority:** P1

---

### 🟡 npm audit — 3 high severity vulnerabilities
**Issue:** `glob` package has command injection vulnerability (GHSA-5j98-mcp5-4vw2)
**Fix:** `npm audit fix --force` — but this will update `eslint-config-next` which is a breaking change for Next.js 14. Better to update when Next.js 15 is stable.
**Workaround:** Suppress the warning or pin `glob@10.4.5` explicitly.
**Priority:** P2 — affects only eslint tooling, not runtime

---

## MEDIUM — Environment & Deployment

### 🟡 NEXTAUTH_URL is localhost
**File:** `.env.local`
**Issue:** `NEXTAUTH_URL=http://localhost:3000` — this works for Vercel auto-detect but should be explicit in production env.
**Fix:** Set `NEXTAUTH_URL=https://bolaveau-design-platform.vercel.app` in Vercel env vars.
**Priority:** P1

---

### 🟡 .env.local not in .gitignore
**Check:** Run `git check-ignore .env.local` — if not ignored, it will commit.
**Fix:** Verify `.env.local` is in `.gitignore`.
**Priority:** P1

---

### 🟡 No rollback plan documented
**Fix:** Document: "If deploy breaks, use `vercel rollback` or revert GitHub commit SHA."
**Priority:** P2

---

## LOW — Nice to Have

### 🔵 PM2 / process manager
**Status:** N/A — Vercel manages Node.js processes. No PM2 needed on Vercel.
**Note:** If self-hosted later, add PM2.

---

### 🔵 Separate dev/prod DB
**Status:** N/A — single Supabase project. Separate dev would require two Supabase projects.
**Note:** Can be done later. Currently one project at `fqaxmlqfskmwjqmhuzmq.supabase.co`.

---

### 🔵 Backups
**Status:** ⚠️ Verify in Supabase Dashboard → Database → Backups
**Fix:** Check that auto-backups are enabled (Supabase free tier has point-in-time recovery).

---

### 🔵 CORS on Supabase Storage
**Fix:** Go to Supabase Dashboard → Storage → `3d-models` bucket → Permissions
Add policy:
```
Allow public read on 3d-models bucket
```
Verify no wildcard CORS on the storage bucket itself.

---

## What's Already Good ✅

| Item | Status |
|---|---|
| Auth tokens have expiry (NextAuth default 30d) | ✅ |
| Sessions invalidated on logout | ✅ NextAuth handles this |
| Passwords hashed with bcrypt | ✅ `bcrypt.compare()` in auth route |
| Parameterized queries (Supabase SDK) | ✅ No raw SQL string concat |
| HTTPS enforced | ✅ Vercel auto-redirects HTTP |
| DB connection pooling | ✅ Supabase handles this |
| Firewall (only 80/443 public) | ✅ Vercel infrastructure |
| SSL certificate | ✅ Vercel auto-provisions |
| Migrations in version control | ✅ `supabase-setup.sql` in repo |
| Non-root DB user | ✅ Uses `supabaseAdmin` service role |
| No API keys in frontend code | ✅ Public anon key only on client |
| Error handling on async ops | ✅ Try/catch on all routes |
| Loading/error states in UI | ✅ Spinner + error text in components |

---

## Action Items (Priority Order)

### Before Saturday Demo (Can Wait)
1. [ ] Move `NEXTAUTH_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXTAUTH_URL` → Vercel env vars
2. [ ] Generate proper `NEXTAUTH_SECRET`
3. [ ] Check `.env.local` is in `.gitignore`
4. [ ] Add auth guards to `/api/models/upload`, `/api/models/file`
5. [ ] Fix init route to use bcrypt hash
6. [ ] Add rate limiting to auth route
7. [ ] Add pagination to list endpoints
8. [ ] Verify Supabase auto-backups are on

### After Saturday (Before Client Handoff)
9. [ ] Add structured error logging (Vercel Log Drain)
10. [ ] Document rollback procedure
11. [ ] Lock CORS on Supabase storage bucket
12. [ ] Run `npm audit fix` when safe (ESLint update)
13. [ ] Penetration test the model upload endpoint

---

*This checklist lives in: `bolaveau-design-platform/SECURITY-AUDIT.md`*
*Update after each security-sensitive change.*