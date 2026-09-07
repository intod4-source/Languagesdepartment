-- Language Operations workflow, approvals, language-scoped access and file evidence.

alter table public.language_app_users
  add column if not exists language_codes text[] not null default '{}'::text[];

update public.language_app_users
set language_codes = array['*']::text[]
where role = 'super_admin' and not ('*' = any(language_codes));

alter table public.culture_learning_progress
  drop constraint if exists culture_learning_progress_total_questions_check;
alter table public.culture_learning_progress
  add constraint culture_learning_progress_total_questions_check
  check (total_questions between 1 and 100);

create or replace function private.language_has_access(code text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.language_app_users u
    where u.user_id = (select auth.uid()) and u.status = 'active'
      and (u.role = 'super_admin' or '*' = any(u.language_codes) or code = any(u.language_codes))
  );
$$;

create or replace function private.language_can_manage(code text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.language_app_users u
    where u.user_id = (select auth.uid()) and u.status = 'active'
      and (u.role = 'super_admin' or
        ((u.role in ('admin','manager') or u.permissions @> '{"manage_language_operations":true}'::jsonb)
          and ('*' = any(u.language_codes) or code = any(u.language_codes))))
  );
$$;

revoke all on function private.language_has_access(text) from public, anon;
revoke all on function private.language_can_manage(text) from public, anon;
grant execute on function private.language_has_access(text) to authenticated;
grant execute on function private.language_can_manage(text) to authenticated;

drop policy if exists "language user self read" on public.language_app_users;
create policy "language users scoped read" on public.language_app_users for select to authenticated
using (user_id = (select auth.uid()) or private.language_is_super_admin() or private.language_can('manage_users'));
drop policy if exists "language super admin manage users" on public.language_app_users;
create policy "language managers update users" on public.language_app_users for update to authenticated
using (private.language_is_super_admin() or private.language_can('manage_users'))
with check (private.language_is_super_admin() or private.language_can('manage_users'));

create table if not exists public.language_plan_assignments (
  language_code text not null,
  plan_item_id text not null,
  assignee_id uuid not null references auth.users(id) on delete cascade,
  supervisor_id uuid not null references auth.users(id) on delete cascade,
  assigned_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now(),
  primary key (language_code, plan_item_id)
);

create table if not exists public.language_plan_items (
  id text primary key,
  language_code text not null,
  section text not null,
  work text not null,
  current_value numeric not null default 0,
  unit text not null default 'count',
  cumulative_targets jsonb not null default '{}'::jsonb,
  yearly_required jsonb not null default '{}'::jsonb,
  required_2026 numeric not null default 0,
  monthly_2026 jsonb not null default '[]'::jsonb,
  source_row integer,
  updated_at timestamptz not null default now()
);

create table if not exists public.language_monthly_submissions (
  id uuid primary key default gen_random_uuid(),
  language_code text not null,
  plan_item_id text not null,
  year integer not null check (year between 2026 and 2100),
  month integer not null check (month between 1 and 12),
  target_value numeric not null default 0 check (target_value >= 0),
  completed_value numeric not null default 0 check (completed_value >= 0),
  submitted_by uuid not null references auth.users(id) on delete cascade,
  file_path text not null,
  file_name text not null,
  notes text not null default '',
  status text not null default 'submitted' check (status in ('submitted','approved','rejected')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  review_notes text not null default '',
  submitted_at timestamptz not null default now(),
  unique (language_code, plan_item_id, year, month)
);

create table if not exists public.language_projects (
  id uuid primary key default gen_random_uuid(),
  language_code text not null,
  country_name text not null,
  title text not null,
  assignee_id uuid not null references auth.users(id) on delete cascade,
  supervisor_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active','completed','cancelled')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.language_project_steps (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.language_projects(id) on delete cascade,
  language_code text not null,
  step_order integer not null check (step_order between 1 and 50),
  title text not null,
  description text not null default '',
  requires_file boolean not null default true,
  status text not null default 'locked' check (status in ('locked','active','submitted','approved','rejected')),
  unique (project_id, step_order)
);

create table if not exists public.language_step_submissions (
  id uuid primary key default gen_random_uuid(),
  step_id uuid not null unique references public.language_project_steps(id) on delete cascade,
  project_id uuid not null references public.language_projects(id) on delete cascade,
  language_code text not null,
  submitted_by uuid not null references auth.users(id) on delete cascade,
  file_path text not null,
  file_name text not null,
  notes text not null default '',
  status text not null default 'submitted' check (status in ('submitted','approved','rejected')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  review_notes text not null default '',
  submitted_at timestamptz not null default now()
);

alter table public.language_plan_assignments enable row level security;
alter table public.language_plan_items enable row level security;
alter table public.language_monthly_submissions enable row level security;
alter table public.language_projects enable row level security;
alter table public.language_project_steps enable row level security;
alter table public.language_step_submissions enable row level security;

create policy "plan assignments scoped read" on public.language_plan_assignments for select to authenticated using (private.language_has_access(language_code));
create policy "plan assignments manager write" on public.language_plan_assignments for all to authenticated using (private.language_can_manage(language_code)) with check (private.language_can_manage(language_code));
create policy "plan items scoped read" on public.language_plan_items for select to authenticated using (private.language_has_access(language_code));
create policy "plan items manager write" on public.language_plan_items for all to authenticated using (private.language_can_manage(language_code)) with check (private.language_can_manage(language_code));
create policy "monthly submissions scoped read" on public.language_monthly_submissions for select to authenticated using (submitted_by=(select auth.uid()) or private.language_can_manage(language_code));
create policy "monthly submissions worker insert" on public.language_monthly_submissions for insert to authenticated with check (
  submitted_by=(select auth.uid()) and private.language_has_access(language_code) and exists (
    select 1 from public.language_plan_assignments a where a.language_code=language_monthly_submissions.language_code and a.plan_item_id=language_monthly_submissions.plan_item_id and a.assignee_id=(select auth.uid())
  )
);
create policy "monthly submissions manager update" on public.language_monthly_submissions for update to authenticated using (private.language_can_manage(language_code)) with check (private.language_can_manage(language_code));
create policy "monthly submissions worker resubmit" on public.language_monthly_submissions for update to authenticated
using (submitted_by=(select auth.uid()) and status='rejected')
with check (submitted_by=(select auth.uid()) and status='submitted' and reviewed_by is null and reviewed_at is null);
create policy "projects scoped read" on public.language_projects for select to authenticated using (private.language_has_access(language_code));
create policy "projects manager write" on public.language_projects for all to authenticated using (private.language_can_manage(language_code)) with check (private.language_can_manage(language_code));
create policy "steps scoped read" on public.language_project_steps for select to authenticated using (private.language_has_access(language_code));
create policy "steps manager write" on public.language_project_steps for all to authenticated using (private.language_can_manage(language_code)) with check (private.language_can_manage(language_code));
create policy "step submissions scoped read" on public.language_step_submissions for select to authenticated using (submitted_by=(select auth.uid()) or private.language_can_manage(language_code));
create policy "step submissions worker insert" on public.language_step_submissions for insert to authenticated with check (
  submitted_by=(select auth.uid()) and private.language_has_access(language_code) and exists (
    select 1 from public.language_project_steps s join public.language_projects p on p.id=s.project_id
    where s.id=language_step_submissions.step_id and s.status in ('active','rejected') and p.assignee_id=(select auth.uid())
  )
);
create policy "step submissions manager update" on public.language_step_submissions for update to authenticated using (private.language_can_manage(language_code)) with check (private.language_can_manage(language_code));
create policy "step submissions worker resubmit" on public.language_step_submissions for update to authenticated
using (submitted_by=(select auth.uid()) and status='rejected')
with check (submitted_by=(select auth.uid()) and status='submitted' and reviewed_by is null and reviewed_at is null);

grant select,insert,update,delete on public.language_plan_items,public.language_plan_assignments,public.language_monthly_submissions,public.language_projects,public.language_project_steps,public.language_step_submissions to authenticated;

create index if not exists language_users_codes_idx on public.language_app_users using gin(language_codes);
create index if not exists language_plan_items_language_idx on public.language_plan_items(language_code,section);
create index if not exists language_assignments_assignee_idx on public.language_plan_assignments(assignee_id);
create index if not exists language_assignments_supervisor_idx on public.language_plan_assignments(supervisor_id);
create index if not exists language_assignments_assigned_by_idx on public.language_plan_assignments(assigned_by);
create index if not exists language_monthly_language_status_idx on public.language_monthly_submissions(language_code,status,year,month);
create index if not exists language_monthly_submitted_by_idx on public.language_monthly_submissions(submitted_by);
create index if not exists language_monthly_reviewed_by_idx on public.language_monthly_submissions(reviewed_by);
create index if not exists language_projects_language_idx on public.language_projects(language_code,status);
create index if not exists language_projects_assignee_idx on public.language_projects(assignee_id);
create index if not exists language_projects_supervisor_idx on public.language_projects(supervisor_id);
create index if not exists language_projects_created_by_idx on public.language_projects(created_by);
create index if not exists language_steps_project_idx on public.language_project_steps(project_id,step_order);
create index if not exists language_step_submissions_project_idx on public.language_step_submissions(project_id);
create index if not exists language_step_submissions_submitted_idx on public.language_step_submissions(submitted_by);
create index if not exists language_step_submissions_reviewed_idx on public.language_step_submissions(reviewed_by);
create index if not exists language_step_submissions_queue_idx on public.language_step_submissions(language_code,status);

insert into storage.buckets (id,name,public,file_size_limit)
values ('language-task-files','language-task-files',false,26214400)
on conflict (id) do update set public=false,file_size_limit=26214400;

create policy "language task files upload" on storage.objects for insert to authenticated with check (
  bucket_id='language-task-files' and (storage.foldername(name))[2]=(select auth.uid())::text and private.language_has_access((storage.foldername(name))[1])
);
create policy "language task files read" on storage.objects for select to authenticated using (
  bucket_id='language-task-files' and ((storage.foldername(name))[2]=(select auth.uid())::text or private.language_can_manage((storage.foldername(name))[1]))
);
create policy "language task files owner delete" on storage.objects for delete to authenticated using (
  bucket_id='language-task-files' and (storage.foldername(name))[2]=(select auth.uid())::text
);
