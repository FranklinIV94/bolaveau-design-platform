-- Bolaveau Financial Suite — AR/AP/Payroll Schema Extension
-- Complements existing accounts + journal_entries tables
-- Uses Monetra as validation engine, Supabase as persistence

-- ============================================================
-- AR: Invoices + Payments
-- ============================================================

CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  billing_address TEXT,
  tax_id VARCHAR(50),
  payment_terms VARCHAR(50) DEFAULT 'net-30', -- net-15, net-30, net-60, due-on-receipt
  credit_limit_cents BIGINT DEFAULT 0, -- stored in minor units (cents)
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) NOT NULL, -- auto-generated: INV-0001
  customer_id UUID NOT NULL REFERENCES customers(id),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'partial', 'paid', 'voided', 'uncollectible')),
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  subtotal_cents BIGINT NOT NULL DEFAULT 0,
  tax_cents BIGINT NOT NULL DEFAULT 0,
  total_cents BIGINT NOT NULL DEFAULT 0,
  paid_cents BIGINT NOT NULL DEFAULT 0,
  balance_cents BIGINT GENERATED ALWAYS AS (total_cents - paid_cents) STORED,
  currency CHAR(3) DEFAULT 'USD',
  notes TEXT,
  -- Monetra hash chain integrity
  ledger_hash VARCHAR(64), -- SHA-256 hash from Monetra verification
  journal_entry_id UUID REFERENCES journal_entries(id), -- link to GL entry
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, invoice_number)
);

CREATE TABLE IF NOT EXISTS invoice_lines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  line_order INT NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price_cents BIGINT NOT NULL,
  amount_cents BIGINT NOT NULL, -- quantity * unit_price
  account_id UUID REFERENCES accounts(id), -- revenue account for this line
  tax_rate NUMERIC(5,4) DEFAULT 0, -- e.g. 0.0700 for 7%
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  payment_number VARCHAR(50) NOT NULL, -- PMT-0001
  customer_id UUID NOT NULL REFERENCES customers(id),
  amount_cents BIGINT NOT NULL,
  payment_method VARCHAR(30) DEFAULT 'check' CHECK (payment_method IN ('check', 'ach', 'wire', 'credit-card', 'cash', 'other')),
  reference VARCHAR(255), -- check number, transaction id, etc.
  deposit_account_id UUID REFERENCES accounts(id), -- which bank account
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  journal_entry_id UUID REFERENCES journal_entries(id),
  notes TEXT,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, payment_number)
);

CREATE TABLE IF NOT EXISTS invoice_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  applied_cents BIGINT NOT NULL, -- how much of this payment applies to this invoice
  applied_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(invoice_id, payment_id)
);

-- ============================================================
-- AP: Vendor Bills + Payments
-- ============================================================

CREATE TABLE IF NOT EXISTS vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  tax_id VARCHAR(50),
  payment_terms VARCHAR(50) DEFAULT 'net-30',
  account_number VARCHAR(100), -- vendor's account number with us
  1099_eligible BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  bill_number VARCHAR(50) NOT NULL, -- BIL-0001
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  vendor_invoice_number VARCHAR(100), -- vendor's own invoice number
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending-approval', 'approved', 'partial', 'paid', 'voided')),
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  subtotal_cents BIGINT NOT NULL DEFAULT 0,
  tax_cents BIGINT NOT NULL DEFAULT 0,
  total_cents BIGINT NOT NULL DEFAULT 0,
  paid_cents BIGINT NOT NULL DEFAULT 0,
  balance_cents BIGINT GENERATED ALWAYS AS (total_cents - paid_cents) STORED,
  currency CHAR(3) DEFAULT 'USD',
  notes TEXT,
  ledger_hash VARCHAR(64),
  journal_entry_id UUID REFERENCES journal_entries(id),
  approved_by UUID REFERENCES admin_users(id),
  approved_at TIMESTAMPTZ,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, bill_number)
);

CREATE TABLE IF NOT EXISTS bill_lines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  line_order INT NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price_cents BIGINT NOT NULL,
  amount_cents BIGINT NOT NULL,
  account_id UUID REFERENCES accounts(id), -- expense account for this line
  tax_rate NUMERIC(5,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bill_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  payment_number VARCHAR(50) NOT NULL, -- VPM-0001
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  amount_cents BIGINT NOT NULL,
  payment_method VARCHAR(30) DEFAULT 'check' CHECK (payment_method IN ('check', 'ach', 'wire', 'credit-card', 'cash', 'other')),
  reference VARCHAR(255),
  payment_account_id UUID REFERENCES accounts(id), -- bank/CC account paid from
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  journal_entry_id UUID REFERENCES journal_entries(id),
  notes TEXT,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, payment_number)
);

CREATE TABLE IF NOT EXISTS bill_payment_applied (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  bill_payment_id UUID NOT NULL REFERENCES bill_payments(id) ON DELETE CASCADE,
  applied_cents BIGINT NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(bill_id, bill_payment_id)
);

-- ============================================================
-- Payroll (basic — employee records + pay runs)
-- ============================================================

CREATE TABLE IF NOT EXISTS employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  hire_date DATE,
  termination_date DATE,
  pay_type VARCHAR(20) DEFAULT 'salary' CHECK (pay_type IN ('salary', 'hourly', 'contractor')),
  pay_rate_cents BIGINT NOT NULL, -- annual salary in cents OR hourly rate * 100
  pay_frequency VARCHAR(20) DEFAULT 'biweekly' CHECK (pay_frequency IN ('weekly', 'biweekly', 'semimonthly', 'monthly')),
  filing_status VARCHAR(20) DEFAULT 'single',
  federal_allowances INT DEFAULT 0,
  state VARCHAR(2), -- for state tax
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pay_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  run_number VARCHAR(50) NOT NULL, -- PR-0001
  pay_period_start DATE NOT NULL,
  pay_period_end DATE NOT NULL,
  pay_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending-approval', 'approved', 'processed', 'voided')),
  total_gross_cents BIGINT NOT NULL DEFAULT 0,
  total_net_cents BIGINT NOT NULL DEFAULT 0,
  total_tax_cents BIGINT NOT NULL DEFAULT 0,
  total_deduction_cents BIGINT NOT NULL DEFAULT 0,
  journal_entry_id UUID REFERENCES journal_entries(id),
  approved_by UUID REFERENCES admin_users(id),
  approved_at TIMESTAMPTZ,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, run_number)
);

CREATE TABLE IF NOT EXISTS pay_slips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pay_run_id UUID NOT NULL REFERENCES pay_runs(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id),
  gross_cents BIGINT NOT NULL,
  federal_tax_cents BIGINT NOT NULL DEFAULT 0,
  state_tax_cents BIGINT NOT NULL DEFAULT 0,
  social_security_cents BIGINT NOT NULL DEFAULT 0,
  medicare_cents BIGINT NOT NULL DEFAULT 0,
  other_deductions_cents BIGINT NOT NULL DEFAULT 0,
  net_cents BIGINT NOT NULL,
  hours_worked NUMERIC(6,2), -- for hourly employees
  journal_entry_id UUID REFERENCES journal_entries(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Indexes for performance
-- ============================================================

CREATE INDEX idx_invoices_org_customer ON invoices(org_id, customer_id);
CREATE INDEX idx_invoices_status ON invoices(org_id, status);
CREATE INDEX idx_invoices_due_date ON invoices(org_id, due_date) WHERE status NOT IN ('paid', 'voided');
CREATE INDEX idx_bills_org_vendor ON bills(org_id, vendor_id);
CREATE INDEX idx_bills_status ON bills(org_id, status);
CREATE INDEX idx_bills_due_date ON bills(org_id, due_date) WHERE status NOT IN ('paid', 'voided');
CREATE INDEX idx_payments_org_date ON payments(org_id, payment_date);
CREATE INDEX idx_bill_payments_org_date ON bill_payments(org_id, payment_date);
CREATE INDEX idx_pay_runs_org_date ON pay_runs(org_id, pay_date);
CREATE INDEX idx_customers_org ON customers(org_id);
CREATE INDEX idx_vendors_org ON vendors(org_id);
CREATE INDEX idx_employees_org ON employees(org_id);

-- ============================================================
-- RLS policies (multi-tenant security)
-- ============================================================

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_payment_applied ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE pay_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pay_slips ENABLE ROW LEVEL SECURITY;

-- Policy pattern: users can only see data from their org
-- (Adjust role checks as needed — admin/accountant write, viewer read)

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'customers', 'invoices', 'invoice_lines', 'payments', 'invoice_payments',
    'vendors', 'bills', 'bill_lines', 'bill_payments', 'bill_payment_applied',
    'employees', 'pay_runs', 'pay_slips'
  ]) LOOP
    EXECUTE format('CREATE POLICY "org_read_%s" ON %I FOR SELECT USING (org_id IN (SELECT org_id FROM user_org_roles WHERE user_id = auth.uid()))', tbl, tbl);
    EXECUTE format('CREATE POLICY "org_insert_%s" ON %I FOR INSERT WITH CHECK (org_id IN (SELECT org_id FROM user_org_roles WHERE user_id = auth.uid() AND role IN (''admin'', ''accountant'')))', tbl, tbl);
    EXECUTE format('CREATE POLICY "org_update_%s" ON %I FOR UPDATE USING (org_id IN (SELECT org_id FROM user_org_roles WHERE user_id = auth.uid() AND role IN (''admin'', ''accountant'')))', tbl, tbl);
  LOOP;
END $$;