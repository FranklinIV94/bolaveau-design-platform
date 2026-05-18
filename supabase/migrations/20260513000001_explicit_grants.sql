-- Migration: Explicit GRANT statements for Supabase Data API access
-- Date: 2026-05-13
-- Reason: Supabase removing auto-GRANTs on public schema (effective Oct 30, 2026)
-- Without these, PostgREST returns 42501 permission errors
--
-- Tables in this project:
--   projects, models (initial migration)
--   accounts, journal_entries, journal_entry_lines (bookkeeping)
--   audit_log (audit fixes)
--   users, user_org_roles (initial/auth)
--   bills, bill_lines, bill_payments, bill_payment_applied (AP)
--   invoices, invoice_lines, invoice_payments, payments (AR)

-- ============================================================
-- Core tables
-- ============================================================

-- projects
GRANT SELECT ON public.projects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;

-- models
GRANT SELECT ON public.models TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.models TO authenticated;
GRANT ALL ON public.models TO service_role;

-- users
GRANT SELECT ON public.users TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;

-- user_org_roles
GRANT SELECT ON public.user_org_roles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_org_roles TO authenticated;
GRANT ALL ON public.user_org_roles TO service_role;

-- ============================================================
-- Bookkeeping tables
-- ============================================================

-- accounts
GRANT SELECT ON public.accounts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO authenticated;
GRANT ALL ON public.accounts TO service_role;

-- journal_entries
GRANT SELECT ON public.journal_entries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journal_entries TO authenticated;
GRANT ALL ON public.journal_entries TO service_role;

-- journal_entry_lines
GRANT SELECT ON public.journal_entry_lines TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journal_entry_lines TO authenticated;
GRANT ALL ON public.journal_entry_lines TO service_role;

-- ============================================================
-- AP tables
-- ============================================================

-- bills
GRANT SELECT ON public.bills TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bills TO authenticated;
GRANT ALL ON public.bills TO service_role;

-- bill_lines
GRANT SELECT ON public.bill_lines TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bill_lines TO authenticated;
GRANT ALL ON public.bill_lines TO service_role;

-- bill_payments
GRANT SELECT ON public.bill_payments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bill_payments TO authenticated;
GRANT ALL ON public.bill_payments TO service_role;

-- bill_payment_applied
GRANT SELECT ON public.bill_payment_applied TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bill_payment_applied TO authenticated;
GRANT ALL ON public.bill_payment_applied TO service_role;

-- ============================================================
-- AR tables
-- ============================================================

-- invoices
GRANT SELECT ON public.invoices TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;

-- invoice_lines
GRANT SELECT ON public.invoice_lines TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_lines TO authenticated;
GRANT ALL ON public.invoice_lines TO service_role;

-- invoice_payments
GRANT SELECT ON public.invoice_payments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_payments TO authenticated;
GRANT ALL ON public.invoice_payments TO service_role;

-- payments
GRANT SELECT ON public.payments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;

-- ============================================================
-- Audit
-- ============================================================

-- audit_log
GRANT SELECT ON public.audit_log TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;

-- admin_users (if exists as separate table)
GRANT SELECT ON public.admin_users TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_users TO authenticated;
GRANT ALL ON public.admin_users TO service_role;

-- ============================================================
-- Sequence grants (for serial/identity columns)
-- ============================================================

DO $$
DECLARE
  seq record;
BEGIN
  FOR seq IN 
    SELECT sequence_name 
    FROM information_schema.sequences 
    WHERE sequence_schema = 'public'
  LOOP
    EXECUTE format('GRANT USAGE, SELECT ON public.%I TO anon;', seq.sequence_name);
    EXECUTE format('GRANT USAGE, SELECT ON public.%I TO authenticated;', seq.sequence_name);
    EXECUTE format('GRANT ALL ON public.%I TO service_role;', seq.sequence_name);
  END LOOP;
END;
$$;