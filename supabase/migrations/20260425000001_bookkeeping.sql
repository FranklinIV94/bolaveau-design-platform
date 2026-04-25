-- ============================================================
-- Bookkeeping Module — Initial Schema
-- Run on Supabase: bolaveau-design-platform
-- ============================================================

-- Organizations already exist from initial migration.
-- This adds bookkeeping-specific tables.

-- --- Chart of Accounts ---
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  account_number TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'asset', 'liability', 'equity', 'revenue', 'expense'
  )),
  subtype TEXT,  -- e.g. 'bank', 'accounts_receivable', 'accounts_payable'
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, account_number)
);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_read_accounts" ON accounts
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM user_org_roles WHERE user_id = auth.uid())
  );

CREATE POLICY "admins_write_accounts" ON accounts
  FOR ALL USING (
    org_id IN (SELECT org_id FROM user_org_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Default chart of accounts seed (Bolaveau Group example)
-- Will only insert if table is empty
INSERT INTO accounts (org_id, account_number, name, type, subtype, description)
SELECT
  orgs.id,
  acc.number,
  acc.name,
  acc.type,
  acc.subtype,
  acc.description
FROM organizations orgs
CROSS JOIN (
  VALUES
    -- Assets
    ('1000', 'Cash Checking',         'asset', 'bank',          'Primary operating checking account'),
    ('1010', 'Cash Savings',          'asset', 'bank',          'Business savings account'),
    ('1100', 'Accounts Receivable',   'asset', 'accounts_receivable', 'Money owed by clients'),
    ('1200', 'Prepaid Expenses',      'asset', 'other',          'Expenses paid in advance'),
    ('1500', 'Equipment',            'asset', 'fixed_asset',    'Furniture, computers, software'),
    ('1600', 'Accumulated Depreciation', 'asset', 'contra',     'Accumulated depreciation on fixed assets'),
    -- Liabilities
    ('2000', 'Accounts Payable',      'liability', 'accounts_payable', 'Money owed to vendors'),
    ('2100', 'Credit Card Payable',   'liability', 'credit_card',  'Credit card balances'),
    ('2200', 'Sales Tax Payable',     'liability', 'tax',           'Sales tax collected'),
    ('2300', 'Payroll Liabilities',   'liability', 'payroll',        'Wages and payroll taxes owed'),
    ('2500', 'Notes Payable',         'liability', 'loan',           'Long-term debt'),
    -- Equity
    ('3000', 'Owners Equity',         'equity', 'owners',          'Owner investment'),
    ('3100', 'Retained Earnings',     'equity', 'retained',        'Cumulative net income'),
    ('3200', 'Distributions',         'equity', 'distributions',    'Owner withdrawals'),
    -- Revenue
    ('4000', 'Design Services',       'revenue', 'service',        '3D visualization and design fees'),
    ('4100', 'Consulting Revenue',    'revenue', 'service',        'Consulting and advisory fees'),
    ('4200', 'Project Management',    'revenue', 'service',        'Project management fees'),
    ('4900', 'Other Income',          'revenue', 'other',          'Miscellaneous income'),
    -- Expenses
    ('5000', 'Advertising',           'expense', 'marketing',       'Marketing and advertising'),
    ('5100', 'Bank Fees',             'expense', 'admin',          'Bank and credit card fees'),
    ('5200', 'Insurance',             'expense', 'insurance',       'Business insurance'),
    ('5300', 'Professional Services', 'expense', 'admin',         'Legal, accounting, consulting'),
    ('5400', 'Rent',                  'expense', 'facilities',     'Office rent'),
    ('5500', 'Software & Subscriptions', 'expense', 'tech',         'SaaS tools and software'),
    ('5600', 'Utilities',             'expense', 'facilities',     'Electric, internet, phone'),
    ('5700', 'Wages & Salaries',     'expense', 'payroll',        'Employee compensation'),
    ('5800', 'Payroll Taxes',        'expense', 'payroll',        'Employer payroll taxes'),
    ('5900', 'Office Supplies',      'expense', 'admin',          'Supplies and materials'),
    ('6000', 'Travel & Entertainment', 'expense', 'travel',        'Client travel and entertainment'),
    ('6100', 'Depreciation',         'expense', 'other',          'Depreciation expense'),
    ('9900', 'Miscellaneous Expense', 'expense', 'other',          'Uncategorized expenses')
) AS acc(number, name, type, subtype, description)
WHERE NOT EXISTS (SELECT 1 FROM accounts LIMIT 1)
ON CONFLICT (org_id, account_number) DO NOTHING;

-- --- Journal Entries ---
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  entry_number TEXT NOT NULL,  -- e.g. 'JE-0001'
  date DATE NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'posted' CHECK (status IN ('draft', 'posted', 'reversed')),
  reversal_of UUID REFERENCES journal_entries(id),
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, entry_number)
);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_read_journal" ON journal_entries
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM user_org_roles WHERE user_id = auth.uid())
  );

CREATE POLICY "admins_write_journal" ON journal_entries
  FOR ALL USING (
    org_id IN (SELECT org_id FROM user_org_roles WHERE user_id = auth.uid() AND role IN ('admin', 'accountant'))
  );

-- --- Journal Entry Lines ---
CREATE TABLE IF NOT EXISTS journal_entry_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE RESTRICT NOT NULL,
  debit DECIMAL(15,2) DEFAULT 0,
  credit DECIMAL(15,2) DEFAULT 0,
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  -- Each line must have either a debit or credit, not both
  CHECK (
    (debit > 0 AND credit = 0) OR
    (credit > 0 AND debit = 0) OR
    (debit = 0 AND credit = 0)
  )
);

ALTER TABLE journal_entry_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_read_lines" ON journal_entry_lines
  FOR SELECT USING (
    journal_entry_id IN (
      SELECT je.id FROM journal_entries je
      WHERE je.org_id IN (SELECT org_id FROM user_org_roles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "admins_write_lines" ON journal_entry_lines
  FOR ALL USING (
    journal_entry_id IN (
      SELECT je.id FROM journal_entries je
      WHERE je.org_id IN (SELECT org_id FROM user_org_roles WHERE user_id = auth.uid() AND role IN ('admin', 'accountant'))
    )
  );

-- --- Helper function to get next JE number ---
CREATE OR REPLACE FUNCTION get_next_journal_entry_number(p_org_id UUID)
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  org_slug TEXT;
BEGIN
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(entry_number FROM 'JE-([0-9]+)$') AS INTEGER)
  ), 0)
  INTO next_num
  FROM journal_entries
  WHERE org_id = p_org_id;

  SELECT slug INTO org_slug FROM organizations WHERE id = p_org_id;

  RETURN 'JE-' || LPAD((next_num + 1)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- Trigger to auto-set entry_number ---
CREATE OR REPLACE FUNCTION set_journal_entry_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.entry_number IS NULL OR NEW.entry_number = '' THEN
    NEW.entry_number := get_next_journal_entry_number(NEW.org_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_journal_entry_number ON journal_entries;
CREATE TRIGGER trigger_set_journal_entry_number
  BEFORE INSERT ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION set_journal_entry_number();

-- --- Updated at trigger ---
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER accounts_updated_at BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER journal_entries_updated_at BEFORE UPDATE ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
