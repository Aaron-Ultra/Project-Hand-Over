-- ===========================================================================
-- Hostel Complaint Agent - schema v2  (FRESH START: replaces the first version)
-- Supabase Dashboard > SQL Editor > New query > paste ALL > Run
-- ===========================================================================

-- ---- clean old stuff (safe on a new project too) ----
drop function if exists handle_new_user() cascade;
drop function if exists enforce_email_rules() cascade;
drop view if exists public_issue_events;
drop view if exists public_issues;
drop table if exists notifications, serious_concerns, resolution_votes, outbox,
  issue_events, complaints, issues, category_routes, profiles, offices,
  email_allowlist, email_rules cascade;
drop sequence if exists issue_seq;
drop sequence if exists complaint_seq;

create extension if not exists "pgcrypto";
create sequence issue_seq start 1;
create sequence complaint_seq start 1;

-- ---- offices + which office handles which category ----
create table offices (
  id uuid primary key default gen_random_uuid(),
  hostel_id text not null default 'main',
  name text not null,
  email text not null,               -- Level 1 (the office itself)
  escalation_name text not null,     -- Level 2 (warden)
  escalation_email text not null,
  final_name text not null,          -- Level 3 (chief warden / admin)
  final_email text not null
);

create table category_routes (
  category text primary key,
  office_id uuid not null references offices(id)
);

-- ---- user profiles (role lives here; students can NOT change it) ----
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'student' check (role in ('student','office','warden','admin')),
  office_id uuid references offices(id),     -- only for role = 'office'
  hostel_id text not null default 'main',
  created_at timestamptz not null default now()
);

-- ---- issues = one real-world problem; complaints = what each student wrote ----
create table issues (
  id uuid primary key default gen_random_uuid(),
  public_id text unique not null default ('ISS-' || lpad(nextval('issue_seq')::text, 5, '0')),
  hostel_id text not null default 'main',
  category text not null,
  block text not null,
  title text not null,
  summary text,
  severity int not null default 2 check (severity between 1 and 4),
  status text not null default 'open'
    check (status in ('open','in_progress','resolved','reopened','closed','withdrawn')),
  reporter_count int not null default 1,
  escalation_level int not null default 1 check (escalation_level between 1 and 3), -- 1 office, 2 warden, 3 admin
  priority_score numeric not null default 0,
  owner_office_id uuid references offices(id),
  opened_at timestamptz not null default now(),
  first_response_at timestamptz,
  reminder_sent_at timestamptz,
  escalated_at timestamptz,        -- when it reached Level 2
  escalated_l3_at timestamptz,     -- when it reached Level 3
  resolved_at timestamptz,
  updated_at timestamptz not null default now()
);

create table complaints (
  id uuid primary key default gen_random_uuid(),
  public_id text unique not null default ('CMP-' || lpad(nextval('complaint_seq')::text, 5, '0')),
  hostel_id text not null default 'main',
  issue_id uuid references issues(id) on delete cascade,
  user_id uuid references auth.users(id),
  title text,
  raw_text text not null,
  cleaned_text text,
  block text,
  floor text,
  room text,
  photo_url text,
  urgency text not null default 'normal' check (urgency in ('normal','urgent')),
  category_hint text,
  is_anonymous boolean not null default false,
  share_identity_with_warden boolean not null default false,
  status text not null default 'submitted' check (status in ('submitted','withdrawn')),
  follow_up_question text,
  follow_up_answer text,
  created_at timestamptz not null default now()
);

create table issue_events (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid references issues(id) on delete cascade,
  event_type text not null,
  detail text,
  created_at timestamptz not null default now()
);

-- simulated office inbox
create table outbox (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid references issues(id) on delete cascade,
  to_email text not null,
  subject text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table resolution_votes (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid references issues(id) on delete cascade,
  user_id uuid references auth.users(id),
  fixed boolean not null,
  created_at timestamptz not null default now(),
  unique (issue_id, user_id)
);

-- in-app notifications (frontend listens with Supabase realtime)
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  issue_id uuid references issues(id) on delete cascade,
  message text not null,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- serious concerns: NEVER public, only warden/admin
create table serious_concerns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),   -- null when the student stays anonymous
  text text not null,
  block text,
  source text not null default 'student_button',  -- or 'auto_detected'
  status text not null default 'new',
  created_at timestamptz not null default now()
);

-- college email rules (empty = anyone can sign up, good for testing)
create table email_rules (domain text primary key);          -- e.g. 'yourcollege.ac.in'
create table email_allowlist (email text primary key);       -- extra allowed emails (team testers)

-- ---- triggers on signup ----
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

create or replace function enforce_email_rules() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.email_rules)
     and not exists (select 1 from public.email_allowlist where lower(email) = lower(new.email))
     and not exists (select 1 from public.email_rules r where lower(new.email) like '%@' || lower(r.domain))
  then
    raise exception 'Please sign up with your college email';
  end if;
  return new;
end $$;

create trigger enforce_college_email
  before insert on auth.users for each row execute function public.enforce_email_rules();

-- ---- security: lock tables; backend uses the service_role key and bypasses this ----
alter table offices enable row level security;
alter table category_routes enable row level security;
alter table profiles enable row level security;
alter table issues enable row level security;
alter table complaints enable row level security;
alter table issue_events enable row level security;
alter table outbox enable row level security;
alter table resolution_votes enable row level security;
alter table notifications enable row level security;
alter table serious_concerns enable row level security;
alter table email_rules enable row level security;
alter table email_allowlist enable row level security;

create policy "read own profile" on profiles for select to authenticated using (id = auth.uid());
create policy "read own notifications" on notifications for select to authenticated using (user_id = auth.uid());
create policy "update own notifications" on notifications for update to authenticated using (user_id = auth.uid());

-- realtime for in-app notifications
alter publication supabase_realtime add table notifications;

-- ---- public tracker views (no names, no complaint text) ----
create or replace view public_issues as
  select id, public_id, hostel_id, category, block, title, severity, status, reporter_count,
         escalation_level, priority_score, opened_at, first_response_at, escalated_at,
         resolved_at, updated_at
  from issues;

create or replace view public_issue_events as
  select id, issue_id, event_type, detail, created_at from issue_events;

grant select on public_issues to anon, authenticated;
grant select on public_issue_events to anon, authenticated;

-- ---- demo office directory (edit emails here if your team changes them) ----
insert into offices (name, email, escalation_name, escalation_email, final_name, final_email) values
 ('Maintenance Desk',    'maintenance@hostel-demo.local', 'Warden', 'warden@hostel-demo.local', 'Hostel Admin', 'admin@hostel-demo.local'),
 ('Mess Committee',      'mess@hostel-demo.local',        'Warden', 'warden@hostel-demo.local', 'Hostel Admin', 'admin@hostel-demo.local'),
 ('Electrician',         'electricity@hostel-demo.local', 'Warden', 'warden@hostel-demo.local', 'Hostel Admin', 'admin@hostel-demo.local'),
 ('IT / WiFi Desk',      'wifi@hostel-demo.local',        'Warden', 'warden@hostel-demo.local', 'Hostel Admin', 'admin@hostel-demo.local'),
 ('Hostel Admin Office', 'admin@hostel-demo.local',       'Warden', 'warden@hostel-demo.local', 'Hostel Admin', 'admin@hostel-demo.local');

insert into category_routes (category, office_id)
select t.c, (select id from offices where name = t.n)
from (values
  ('mess','Mess Committee'), ('water','Maintenance Desk'), ('electricity','Electrician'),
  ('cleanliness','Maintenance Desk'), ('internet','IT / WiFi Desk'),
  ('maintenance','Maintenance Desk'), ('other','Hostel Admin Office')
) as t(c, n);

-- ===========================================================================
-- LATER (run separately, after creating users). Edit the emails first.
-- ===========================================================================
-- Make staff accounts (user must have signed up first):
--   update profiles set role='warden' where email='warden@gmail.com';
--   update profiles set role='admin'  where email='you@gmail.com';
--   update profiles set role='office', office_id=(select id from offices where name='Maintenance Desk')
--     where email='electrician@gmail.com';
-- Enforce college email (do this LAST, just before the demo):
--   insert into email_allowlist(email) values ('teammate1@gmail.com'),('teammate2@gmail.com');
--   insert into email_rules(domain) values ('yourcollege.ac.in');
