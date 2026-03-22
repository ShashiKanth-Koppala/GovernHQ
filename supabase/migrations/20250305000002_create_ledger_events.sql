-- Alter ledger_events: add organization_id, tighten status, enable RLS.
-- Idempotent: safe to run even if partially applied.
-- ledger_events already exists with: id, agent_id, action, status, metadata, created_at

-- Add organization_id if it doesn't exist yet
alter table ledger_events
  add column if not exists organization_id uuid references organizations(id);

-- Set not null only if the column is currently nullable (table has 0 rows, so safe)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'ledger_events'
      and column_name  = 'organization_id'
      and is_nullable  = 'YES'
  ) then
    alter table ledger_events alter column organization_id set not null;
  end if;
end $$;

-- Replace the default 'logged' with 'allow'
alter table ledger_events alter column status set default 'allow';

-- Add status check constraint if it doesn't exist yet
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'ledger_events_status_check'
  ) then
    alter table ledger_events
      add constraint ledger_events_status_check
        check (status in ('allow', 'pause', 'block'));
  end if;
end $$;

-- Enable RLS (no-op if already enabled)
alter table ledger_events enable row level security;

-- Recreate RLS policies idempotently
drop policy if exists "ledger_events_select_own_org" on ledger_events;
create policy "ledger_events_select_own_org"
  on ledger_events for select
  using (
    organization_id in (
      select id from organizations where owner_id = auth.uid()
    )
  );

drop policy if exists "ledger_events_insert_own_org" on ledger_events;
create policy "ledger_events_insert_own_org"
  on ledger_events for insert
  with check (
    organization_id in (
      select id from organizations where owner_id = auth.uid()
    )
  );
