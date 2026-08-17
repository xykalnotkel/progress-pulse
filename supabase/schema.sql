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

-- ============================================================
-- Likes (real, public, additive)
-- ============================================================
create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  update_id uuid not null references public.progress_updates(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists likes_update_created_idx on public.likes(update_id, created_at asc);

alter table public.likes enable row level security;

-- Anyone can count likes.
drop policy if exists "Public can view likes" on public.likes;
create policy "Public can view likes" on public.likes
for select using (true);

-- Anyone can add a like. There is deliberately no update/delete policy,
-- so likes are additive only and can never be removed by clients.
drop policy if exists "Anyone can like" on public.likes;
create policy "Anyone can like" on public.likes
for insert with check (true);

-- ============================================================
-- Comment threads: replies + author badges + reactions
-- ============================================================
alter table public.comments add column if not exists parent_id uuid references public.comments(id) on delete cascade;
alter table public.comments add column if not exists author_badge text check (author_badge in ('XyDev', 'XyTeam'));

create index if not exists comments_parent_idx on public.comments(parent_id);

-- Reactions on comments ("membantu", "setuju", "terima kasih").
-- Additive only, same policy shape as likes.
create table if not exists public.comment_reactions (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments(id) on delete cascade,
  reaction text not null check (reaction in ('membantu', 'setuju', 'terima kasih')),
  created_at timestamptz not null default now()
);

create index if not exists comment_reactions_comment_idx on public.comment_reactions(comment_id, created_at asc);

alter table public.comment_reactions enable row level security;

drop policy if exists "Public can view comment reactions" on public.comment_reactions;
create policy "Public can view comment reactions" on public.comment_reactions
for select using (true);

drop policy if exists "Anyone can react" on public.comment_reactions;
create policy "Anyone can react" on public.comment_reactions
for insert with check (true);

-- ============================================================
-- Admin/team profiles (custom display name, title, avatar)
-- ============================================================
create table if not exists public.profiles (
  email text primary key,
  display_name text check (char_length(display_name) between 1 and 48),
  title text check (char_length(title) <= 80),
  avatar_url text,
  badge text check (badge in ('XyDev', 'XyTeam')),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Display names/avatars are public (they appear on comment threads).
drop policy if exists "Public can view profiles" on public.profiles;
create policy "Public can view profiles" on public.profiles
for select using (true);
-- No public insert/update policies: profiles are managed only by server
-- routes with an authenticated owner/team session.

-- Admin/team replies can carry a custom avatar.
alter table public.comments add column if not exists author_avatar text;
