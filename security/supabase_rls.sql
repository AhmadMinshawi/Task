-- TaskV canonical production RLS.
-- Source of truth for the normalized schema.
-- Every table below must have owner_id uuid NOT NULL REFERENCES auth.users(id).

create or replace function public.taskv_is_owner(record_owner uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and auth.uid() = record_owner;
$$;

alter table if exists public.clients enable row level security;
alter table if exists public.projects enable row level security;
alter table if exists public.tasks enable row level security;
alter table if exists public.payments enable row level security;
alter table if exists public.deliveries enable row level security;
alter table if exists public.expenses enable row level security;
alter table if exists public.activities enable row level security;

-- Recreate one canonical policy per table. FOR ALL covers SELECT/INSERT/UPDATE/DELETE.
drop policy if exists "taskv_clients_owner" on public.clients;
create policy "taskv_clients_owner" on public.clients
  for all to authenticated
  using (public.taskv_is_owner(owner_id))
  with check (public.taskv_is_owner(owner_id));

drop policy if exists "taskv_projects_owner" on public.projects;
create policy "taskv_projects_owner" on public.projects
  for all to authenticated
  using (public.taskv_is_owner(owner_id))
  with check (public.taskv_is_owner(owner_id));

drop policy if exists "taskv_tasks_owner" on public.tasks;
create policy "taskv_tasks_owner" on public.tasks
  for all to authenticated
  using (public.taskv_is_owner(owner_id))
  with check (public.taskv_is_owner(owner_id));

drop policy if exists "taskv_payments_owner" on public.payments;
create policy "taskv_payments_owner" on public.payments
  for all to authenticated
  using (public.taskv_is_owner(owner_id))
  with check (public.taskv_is_owner(owner_id));

drop policy if exists "taskv_deliveries_owner" on public.deliveries;
create policy "taskv_deliveries_owner" on public.deliveries
  for all to authenticated
  using (public.taskv_is_owner(owner_id))
  with check (public.taskv_is_owner(owner_id));

drop policy if exists "taskv_expenses_owner" on public.expenses;
create policy "taskv_expenses_owner" on public.expenses
  for all to authenticated
  using (public.taskv_is_owner(owner_id))
  with check (public.taskv_is_owner(owner_id));

drop policy if exists "taskv_activities_owner" on public.activities;
create policy "taskv_activities_owner" on public.activities
  for all to authenticated
  using (public.taskv_is_owner(owner_id))
  with check (public.taskv_is_owner(owner_id));

-- IMPORTANT: never expose a Supabase service_role/secret key in browser code.
