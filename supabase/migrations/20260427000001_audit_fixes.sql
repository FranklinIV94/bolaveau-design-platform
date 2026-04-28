-- ============================================================
-- Bolaveau Design Platform — Audit Migration
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- Project: fqaxmlqfskmwjqmhuzmq
-- Date: April 27, 2026
-- ============================================================

-- 1. Add scene_data column for 3D editor persistence (fixes audit #1)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS scene_data JSONB DEFAULT '{}';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS scene_updated_at TIMESTAMPTZ;

-- 2. Add entity_id and created_by for tenant isolation (fixes audit #2)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS entity_id UUID;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS created_by UUID;

-- 3. Backfill created_by and entity_id for existing rows
UPDATE projects SET created_by = '00000000-0000-0000-0000-000000000001' WHERE created_by IS NULL;
UPDATE projects SET entity_id = '00000000-0000-0000-0000-000000000001' WHERE entity_id IS NULL;

-- 4. Make NOT NULL after backfill
ALTER TABLE projects ALTER COLUMN created_by SET NOT NULL;
ALTER TABLE projects ALTER COLUMN entity_id SET NOT NULL;

-- 5. Add deleted_at for soft deletes (fixes audit #12)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 6. Create audit_log table for compliance (fixes audit #12)
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  before_data JSONB,
  after_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);

-- 7. Enable RLS on projects (fixes audit #2)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Admins can see all projects
CREATE POLICY "Admins can see all projects" ON projects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Users see only their entity's projects
CREATE POLICY "Users see own entity projects" ON projects
  FOR SELECT USING (
    entity_id IN (
      SELECT entity_id FROM users WHERE users.id = auth.uid()
    )
  );

-- 8. Enable RLS on audit_log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read audit log" ON audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- 9. Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Admins can read all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- 10. Enable RLS on models table
ALTER TABLE models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage models" ON models
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- ============================================================
-- AFTER RUNNING: Verify with these queries
-- ============================================================
-- SELECT column_name, is_nullable FROM information_schema.columns 
--   WHERE table_name = 'projects' ORDER BY ordinal_position;
-- SELECT * FROM audit_log LIMIT 1;  -- should return empty set
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('projects', 'audit_log', 'users', 'models');