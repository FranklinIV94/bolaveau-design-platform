-- Bolaveau Design Platform Database Setup

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  address VARCHAR(500) DEFAULT '',
  status VARCHAR(50) DEFAULT 'planning' CHECK (status IN ('planning', 'in-progress', 'completed')),
  client_id UUID REFERENCES admin_users(id),
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
  uploaded_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;

-- RLS policies: allow all reads (app handles auth via NextAuth)
CREATE POLICY "Allow read on projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Allow read on models" ON models FOR SELECT USING (true);

-- RLS policies: allow all writes (app handles auth via NextAuth)
CREATE POLICY "Allow write on projects" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow write on projects" ON projects FOR UPDATE USING (true);
CREATE POLICY "Allow write on projects" ON projects FOR DELETE USING (true);

CREATE POLICY "Allow write on models" ON models FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow write on models" ON models FOR UPDATE USING (true);
CREATE POLICY "Allow write on models" ON models FOR DELETE USING (true);

-- Insert a default admin user
-- Password: bolaveau2026
INSERT INTO admin_users (email, password_hash, name, role, is_active)
VALUES ('admin@bolaveau.com', 'bolaveau2026', 'Bolaveau Admin', 'ADMIN', true)
ON CONFLICT (email) DO NOTHING;

-- Insert a sample project
INSERT INTO projects (name, description, address, status)
VALUES ('Sunset Villa Renovation', 'Complete interior redesign of a 4-bedroom villa with modern finishes and smart home integration.', '1234 Ocean Drive, Miami Beach, FL 33139', 'in-progress');