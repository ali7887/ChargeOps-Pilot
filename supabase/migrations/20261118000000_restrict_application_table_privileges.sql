-- ChargeOps Pilot: Database Privileges Security Hardening
-- Migration: 20261118000000_restrict_application_table_privileges.sql
-- Enforces the Principle of Least Privilege across core application tables.
--
-- Security Objectives:
-- 1. Deny anonymous access (anon role) completely on application tables.
-- 2. Restrict authenticated users to SELECT only (row visibility governed by existing RLS policies).
-- 3. Eliminate direct INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, and MAINTAIN for authenticated clients.
-- 4. Preserve server-side administrative access (service_role) for user management, synthetic data seeding, and maintenance.

-- Step 1: Revoke all existing table-level privileges from anon and authenticated on the four core tables
REVOKE ALL PRIVILEGES ON TABLE 
  public.profiles,
  public.charging_events,
  public.runbook_sections,
  public.audit_events
FROM anon, authenticated;

-- Step 2: Grant SELECT strictly to authenticated role (enforced in conjunction with RLS)
GRANT SELECT ON TABLE 
  public.profiles,
  public.charging_events,
  public.runbook_sections,
  public.audit_events
TO authenticated;

-- Step 3: Ensure service_role retains necessary privileges for server-side administrative operations
-- Note: Server-side admin routes (e.g. user invitations, role assignments, audit logging, and data seeding)
-- execute via createAdminClient() using the Supabase Service Role key.
GRANT ALL PRIVILEGES ON TABLE 
  public.profiles,
  public.charging_events,
  public.runbook_sections,
  public.audit_events
TO service_role;
