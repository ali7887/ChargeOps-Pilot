-- ChargeOps Pilot: Initial Schema Migration
-- Strictly read-only demonstration database structure for charging operations demo
-- All data must be synthetic (DEMO_DATA_ONLY)

-- 1. Profiles Table (RBAC: viewer / admin only)
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'viewer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- RLS: Authenticated users can read their own profile
create policy "Users can read own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = user_id);

-- RLS: Admins can read all profiles
create policy "Admins can view all profiles"
  on public.profiles
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- No public insert/update/delete policies; role modifications require service-role bootstrap.


-- 2. Charging Events Table (Synthetic events only)
create table if not exists public.charging_events (
  event_id text primary key,
  transaction_id text not null,
  attempt_id text not null,
  event_at timestamptz not null,
  ingested_at timestamptz not null default now(),
  status text not null check (status in ('success', 'failed', 'reversed', 'pending', 'timeout')),
  error_code text,
  service_type text not null check (service_type in ('voice', 'data', 'sms', 'ussd', 'subscription')),
  amount numeric(12, 2) default 0,
  synthetic boolean not null default true check (synthetic = true)
);

create index if not exists idx_charging_events_tx_event_at
  on public.charging_events (transaction_id, event_at asc, ingested_at asc);

create index if not exists idx_charging_events_event_at
  on public.charging_events (event_at);

create index if not exists idx_charging_events_status
  on public.charging_events (status);

create index if not exists idx_charging_events_error_code
  on public.charging_events (error_code);

alter table public.charging_events enable row level security;

-- RLS: Default deny for anonymous, read-only for authenticated viewers and admins
create policy "Authenticated users can read synthetic charging events"
  on public.charging_events
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where user_id = auth.uid() and role in ('admin', 'viewer')
    )
  );


-- 3. Runbook Sections Table (Lexical & Full-Text Search)
create table if not exists public.runbook_sections (
  id uuid primary key default gen_random_uuid(),
  doc_id text not null,
  version text not null,
  section_id text not null,
  title text not null,
  content text not null,
  error_codes text[] not null default '{}',
  status text not null check (status in ('draft', 'active', 'deprecated', 'archived')),
  effective_from timestamptz not null,
  effective_to timestamptz,
  synthetic boolean not null default true check (synthetic = true),
  search_vector tsvector generated always as (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(content, ''))
  ) stored,
  created_at timestamptz not null default now(),
  constraint uq_runbook_section unique (doc_id, version, section_id)
);

create index if not exists idx_runbook_search_vector
  on public.runbook_sections using gin (search_vector);

create index if not exists idx_runbook_error_codes
  on public.runbook_sections using gin (error_codes);

create index if not exists idx_runbook_status_dates
  on public.runbook_sections (status, effective_from, effective_to);

alter table public.runbook_sections enable row level security;

-- RLS: Authenticated users can read active, permitted runbook sections
create policy "Authenticated users can read active runbook sections"
  on public.runbook_sections
  for select
  to authenticated
  using (
    status = 'active'
    and effective_from <= now()
    and (effective_to is null or effective_to > now())
    and exists (
      select 1 from public.profiles
      where user_id = auth.uid() and role in ('admin', 'viewer')
    )
  );


-- 4. Audit Events Table (Minimal metadata, no sensitive payloads)
create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action_type text not null,
  target_resource text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_events enable row level security;

-- RLS: Only admins can view audit events
create policy "Admins can view audit events"
  on public.audit_events
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where user_id = auth.uid() and role = 'admin'
    )
  );
