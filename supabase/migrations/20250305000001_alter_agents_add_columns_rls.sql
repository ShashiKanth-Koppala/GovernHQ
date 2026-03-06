-- Alter existing agents table to add missing columns and constraints
-- The table already has: id, organization_id, name, description, status, created_at

-- Add missing columns
alter table agents
  add column source       text  not null default 'n8n',
  add column metadata     jsonb not null default '{}',
  add column risk_profile text  not null default 'low';

-- Add check constraints
alter table agents
  add constraint agents_source_check
    check (source in ('n8n', 'zapier')),

  add constraint agents_risk_profile_check
    check (risk_profile in ('low', 'medium', 'high')),

  add constraint agents_status_check
    check (status in ('active', 'inactive', 'blocked'));

-- Enable RLS
alter table agents enable row level security;

-- Helper: resolve the calling user's organization id
-- Pattern: select id from organizations where owner_id = auth.uid()

-- SELECT: users can only see agents in their organization
create policy "agents_select_own_org"
  on agents for select
  using (
    organization_id in (
      select id from organizations where owner_id = auth.uid()
    )
  );

-- INSERT: users can only create agents in their organization
create policy "agents_insert_own_org"
  on agents for insert
  with check (
    organization_id in (
      select id from organizations where owner_id = auth.uid()
    )
  );

-- UPDATE: users can only update agents in their organization
create policy "agents_update_own_org"
  on agents for update
  using (
    organization_id in (
      select id from organizations where owner_id = auth.uid()
    )
  );

-- DELETE: users can only delete agents in their organization
create policy "agents_delete_own_org"
  on agents for delete
  using (
    organization_id in (
      select id from organizations where owner_id = auth.uid()
    )
  );
