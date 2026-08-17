-- Progress Pulse schema
-- Paste this entire file into Supabase SQL Editor and click Run.
-- API writes are performed only by server routes with SUPABASE_SERVICE_ROLE_KEY.

create extension if not exists "pgcrypto";

create table if not exists public.apps (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 80),
  tagline text check (char_length(tagline) <= 180),
  description text check (char_length(description) <= 3000),
  cover_url text,
  links jsonb not null default '[]'::jsonb,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.progress_updates (
  id uuid primary key default gen_random_uuid(),
  app_id uuid not null references public.apps(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  description text check (char_length(description) <= 5000),
  status text not null default 'building' check (status in ('planning', 'building', 'testing', 'shipped')),
  version text check (char_length(version) <= 40),
  media jsonb not null default '[]'::jsonb,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  update_id uuid not null references public.progress_updates(id) on delete cascade,
  author_name text not null check (char_length(author_name) between 2 and 48),
  body text not null check (char_length(body) between 2 and 1000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  moderated_at timestamptz,
  moderated_by text
);

create index if not exists progress_updates_app_created_idx on public.progress_updates(app_id, created_at desc);
create index if not exists comments_update_status_created_idx on public.comments(update_id, status, created_at asc);

create or replace function public.set_updated_at()
returns trigger language plpgsql security invoker as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists apps_set_updated_at on public.apps;
create trigger apps_set_updated_at
before update on public.apps
for each row execute function public.set_updated_at();

drop trigger if exists progress_updates_set_updated_at on public.progress_updates;
create trigger progress_updates_set_updated_at
before update on public.progress_updates
for each row execute function public.set_updated_at();

alter table public.apps enable row level security;
alter table public.progress_updates enable row level security;
alter table public.comments enable row level security;

-- Public visitors can only read live content. All writes go through server APIs.
drop policy if exists "Public can view published apps" on public.apps;
create policy "Public can view published apps" on public.apps
for select using (is_published = true);

drop policy if exists "Public can view published updates" on public.progress_updates;
create policy "Public can view published updates" on public.progress_updates
for select using (is_published = true);

drop policy if exists "Public can view approved comments" on public.comments;
create policy "Public can view approved comments" on public.comments
for select using (status = 'approved');

-- Do not create public INSERT/UPDATE/DELETE policies. The service role used in API routes
-- bypasses RLS and never reaches the browser.
