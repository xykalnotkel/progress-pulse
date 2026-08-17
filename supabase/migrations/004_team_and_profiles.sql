-- Migration for existing projects: team members + profile enrichment +
-- per-update contributors.

create table if not exists public.team_members (
  email text primary key,
  added_at timestamptz not null default now(),
  added_by text
);

alter table public.profiles add column if not exists banner_url text;
alter table public.profiles add column if not exists bio text check (char_length(bio) <= 240);
alter table public.profiles add column if not exists links jsonb not null default '[]'::jsonb;

alter table public.progress_updates
  add column if not exists contributors jsonb not null default '[]'::jsonb;
alter table public.comments add column if not exists author_title text;
