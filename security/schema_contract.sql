-- Canonical ownership contract for TaskV.
-- Adapt existing tables to these columns before enabling production RLS.

-- Required on every user-owned table:
-- id uuid primary key
-- owner_id uuid not null references auth.users(id)
-- created_at timestamptz not null
-- updated_at timestamptz not null
-- deleted_at timestamptz null

-- Recommended indexes:
-- create index if not exists idx_projects_owner on public.projects(owner_id);
-- create index if not exists idx_tasks_owner on public.tasks(owner_id);
-- create index if not exists idx_payments_owner on public.payments(owner_id);
-- create index if not exists idx_deliveries_owner on public.deliveries(owner_id);
-- create index if not exists idx_expenses_owner on public.expenses(owner_id);
